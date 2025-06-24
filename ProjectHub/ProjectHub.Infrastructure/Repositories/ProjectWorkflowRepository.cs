using Microsoft.EntityFrameworkCore;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using ProjectHub.Infrastructure.Data;

namespace ProjectHub.Infrastructure.Repositories
{
    public class ProjectWorkflowRepository : IProjectWorkflowRepository
    {
        private readonly ApplicationDbContext _context;

        public ProjectWorkflowRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ProjectWorkflowStage>> GetProjectWorkflowStagesAsync(int projectId)
        {
            return await _context.ProjectWorkflowStages
                .Where(pws => pws.ProjectId == projectId)
                .OrderBy(pws => pws.Order)
                .ToListAsync();
        }

        public async Task<ProjectWorkflowStage?> GetProjectWorkflowStageByIdAsync(int stageId)
        {
            return await _context.ProjectWorkflowStages
                .FirstOrDefaultAsync(pws => pws.Id == stageId);
        }

        public async Task<ProjectWorkflowStage> CreateProjectWorkflowStageAsync(ProjectWorkflowStage stage)
        {
            // Get the next order position
            var maxOrder = await _context.ProjectWorkflowStages
                .Where(pws => pws.ProjectId == stage.ProjectId)
                .MaxAsync(pws => (int?)pws.Order) ?? 0;
                
            stage.Order = maxOrder + 1;
            stage.CreatedAt = DateTime.Now;
            
            _context.ProjectWorkflowStages.Add(stage);
            await _context.SaveChangesAsync();
            
            return stage;
        }

        public async Task<ProjectWorkflowStage> UpdateProjectWorkflowStageAsync(ProjectWorkflowStage stage)
        {
            _context.ProjectWorkflowStages.Update(stage);
            await _context.SaveChangesAsync();
            
            return stage;
        }

        public async Task DeleteProjectWorkflowStageAsync(int stageId)
        {
            var stage = await _context.ProjectWorkflowStages
                .FirstOrDefaultAsync(pws => pws.Id == stageId);
                
            if (stage != null)
            {
                _context.ProjectWorkflowStages.Remove(stage);
                await _context.SaveChangesAsync();
            }
        }

        public async Task ReorderProjectWorkflowStagesAsync(int projectId, int[] stageIds)
        {
            Console.WriteLine($"🔧 WORKFLOW REORDER: Starting reorder for project {projectId} with stages: [{string.Join(", ", stageIds)}]");
            
            var stages = await _context.ProjectWorkflowStages
                .Where(pws => pws.ProjectId == projectId && stageIds.Contains(pws.Id))
                .ToListAsync();

            Console.WriteLine($"🔧 WORKFLOW REORDER: Found {stages.Count} stages");
            foreach (var stage in stages)
            {
                Console.WriteLine($"🔧 WORKFLOW REORDER: Stage {stage.Id} '{stage.Name}' current order: {stage.Order}");
            }

            // Create a mapping of old order to new order for task migration
            var oldOrderToNewOrder = new Dictionary<int, int>();
            
            for (int i = 0; i < stageIds.Length; i++)
            {
                var stage = stages.FirstOrDefault(s => s.Id == stageIds[i]);
                if (stage != null)
                {
                    Console.WriteLine($"🔧 WORKFLOW REORDER: Mapping old order {stage.Order} → new order {i} for stage '{stage.Name}'");
                    oldOrderToNewOrder[stage.Order] = i;
                    stage.Order = i;
                }
            }

            Console.WriteLine($"🔧 WORKFLOW REORDER: Order mapping: {string.Join(", ", oldOrderToNewOrder.Select(kvp => $"{kvp.Key}→{kvp.Value}"))}");

            // Get all tasks for this project and update their status to match the new workflow order
            var projectTasks = await _context.Tasks
                .Where(t => t.ProjectId == projectId)
                .ToListAsync();

            Console.WriteLine($"🔧 WORKFLOW REORDER: Found {projectTasks.Count} tasks to potentially migrate");

            foreach (var task in projectTasks)
            {
                // Convert TaskStatus to old workflow position (0-based)
                var oldWorkflowPosition = (int)task.Status - 1;
                
                Console.WriteLine($"🔧 WORKFLOW REORDER: Task {task.Id} '{task.Title}' has status {task.Status} (workflow position {oldWorkflowPosition})");
                
                // Find the new workflow position for this task
                if (oldOrderToNewOrder.TryGetValue(oldWorkflowPosition, out var newWorkflowPosition))
                {
                    // Convert new workflow position back to TaskStatus (1-based)
                    // Handle extended TaskStatus values for custom workflow stages
                    var statusValue = newWorkflowPosition + 1;
                    if (statusValue > 20)
                    {
                        Console.WriteLine($"⚠️ WORKFLOW REORDER: Status value {statusValue} exceeds maximum supported stages (20). Using stage 20.");
                        statusValue = 20;
                    }
                    var newTaskStatus = (Core.Entities.TaskStatus)statusValue;
                    
                    // Only update if the status actually changed
                    if (task.Status != newTaskStatus)
                    {
                        Console.WriteLine($"🔄 MIGRATING TASK: {task.Id} '{task.Title}' from status {task.Status} (workflow pos {oldWorkflowPosition}) to status {newTaskStatus} (workflow pos {newWorkflowPosition})");
                        task.Status = newTaskStatus;
                    }
                    else
                    {
                        Console.WriteLine($"🔧 TASK NO CHANGE: {task.Id} '{task.Title}' stays at status {task.Status}");
                    }
                }
                else
                {
                    Console.WriteLine($"⚠️ TASK MAPPING MISS: {task.Id} '{task.Title}' workflow position {oldWorkflowPosition} not found in mapping");
                }
            }

            Console.WriteLine($"🔧 WORKFLOW REORDER: Saving changes...");
            await _context.SaveChangesAsync();
            Console.WriteLine($"✅ WORKFLOW REORDER: Complete!");
        }

        public async Task<IEnumerable<ProjectWorkflowStage>> GetOrCreateDefaultWorkflowStagesAsync(int projectId)
        {
            var existingStages = await GetProjectWorkflowStagesAsync(projectId);
            
            if (existingStages.Any())
            {
                return existingStages;
            }

            // Create default workflow stages
            var defaultStages = new[]
            {
                new ProjectWorkflowStage
                {
                    ProjectId = projectId,
                    Name = "To Do",
                    Color = "#6b7280",
                    Order = 0,
                    IsDefault = true,
                    IsCompleted = false
                },
                new ProjectWorkflowStage
                {
                    ProjectId = projectId,
                    Name = "In Progress",
                    Color = "#3b82f6",
                    Order = 1,
                    IsDefault = false,
                    IsCompleted = false
                },
                new ProjectWorkflowStage
                {
                    ProjectId = projectId,
                    Name = "In Review",
                    Color = "#f59e0b",
                    Order = 2,
                    IsDefault = false,
                    IsCompleted = false
                },
                new ProjectWorkflowStage
                {
                    ProjectId = projectId,
                    Name = "Done",
                    Color = "#10b981",
                    Order = 3,
                    IsDefault = false,
                    IsCompleted = true
                }
            };

            foreach (var stage in defaultStages)
            {
                stage.CreatedAt = DateTime.Now;
                _context.ProjectWorkflowStages.Add(stage);
            }

            await _context.SaveChangesAsync();
            
            return defaultStages;
        }
    }
} 