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
            var stages = await _context.ProjectWorkflowStages
                .Where(pws => pws.ProjectId == projectId && stageIds.Contains(pws.Id))
                .ToListAsync();

            for (int i = 0; i < stageIds.Length; i++)
            {
                var stage = stages.FirstOrDefault(s => s.Id == stageIds[i]);
                if (stage != null)
                {
                    stage.Order = i;
                }
            }

            await _context.SaveChangesAsync();
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