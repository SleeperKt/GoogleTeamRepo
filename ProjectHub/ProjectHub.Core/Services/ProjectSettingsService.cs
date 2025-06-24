using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using System.Linq;

namespace ProjectHub.Core.Services
{
    public class ProjectSettingsService : IProjectSettingsService
    {
        private readonly IProjectSettingsRepository _settingsRepository;
        private readonly IProjectLabelRepository _labelRepository;
        private readonly IProjectWorkflowRepository _workflowRepository;
        private readonly IProjectService _projectService;
        private readonly ITaskRepository _taskRepository;

        public ProjectSettingsService(
            IProjectSettingsRepository settingsRepository,
            IProjectLabelRepository labelRepository,
            IProjectWorkflowRepository workflowRepository,
            IProjectService projectService,
            ITaskRepository taskRepository)
        {
            _settingsRepository = settingsRepository;
            _labelRepository = labelRepository;
            _workflowRepository = workflowRepository;
            _projectService = projectService;
            _taskRepository = taskRepository;
        }

        public async Task<ProjectSettingsResponse?> GetProjectSettingsAsync(int projectId, string userEmail)
        {
            // Check if user has access to project
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            var settings = await _settingsRepository.GetProjectSettingsAsync(projectId);
            
            if (settings == null)
            {
                // Create default settings
                settings = new ProjectSettings
                {
                    ProjectId = projectId,
                    EnableNotifications = true,
                    EnableCommentsNotifications = true,
                    EnableTaskAssignmentNotifications = true,
                    DefaultTaskView = "board"
                };
                
                settings = await _settingsRepository.CreateProjectSettingsAsync(settings);
            }

            return MapToSettingsResponse(settings);
        }

        public async Task<ProjectSettingsResponse> UpdateProjectSettingsAsync(int projectId, UpdateProjectSettingsRequest request, string userEmail)
        {
            // Check if user has admin access
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            var settings = await _settingsRepository.GetProjectSettingsAsync(projectId);
            
            if (settings == null)
            {
                settings = new ProjectSettings { ProjectId = projectId };
            }

            // Update settings
            settings.Timezone = request.Timezone;
            settings.StartDate = request.StartDate;
            settings.EndDate = request.EndDate;
            settings.EnableNotifications = request.EnableNotifications;
            settings.EnableTimeTracking = request.EnableTimeTracking;
            settings.EnableCommentsNotifications = request.EnableCommentsNotifications;
            settings.EnableTaskAssignmentNotifications = request.EnableTaskAssignmentNotifications;
            settings.DefaultTaskView = request.DefaultTaskView;
            settings.AllowGuestAccess = request.AllowGuestAccess;

            if (settings.Id == 0)
            {
                settings = await _settingsRepository.CreateProjectSettingsAsync(settings);
            }
            else
            {
                settings = await _settingsRepository.UpdateProjectSettingsAsync(settings);
            }

            return MapToSettingsResponse(settings);
        }

        public async Task<IEnumerable<ProjectLabelResponse>> GetProjectLabelsAsync(int projectId, string userEmail)
        {
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            var labels = await _labelRepository.GetProjectLabelsAsync(projectId);
            return labels.Select(MapToLabelResponse);
        }

        public async Task<ProjectLabelResponse> CreateProjectLabelAsync(int projectId, CreateProjectLabelRequest request, string userEmail)
        {
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            var label = new ProjectLabel
            {
                ProjectId = projectId,
                Name = request.Name,
                Color = request.Color
            };

            label = await _labelRepository.CreateProjectLabelAsync(label);
            return MapToLabelResponse(label);
        }

        public async Task<ProjectLabelResponse> UpdateProjectLabelAsync(int projectId, int labelId, UpdateProjectLabelRequest request, string userEmail)
        {
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            var label = await _labelRepository.GetProjectLabelByIdAsync(labelId);
            if (label == null || label.ProjectId != projectId)
                throw new ArgumentException("Label not found");

            var oldLabelName = label.Name;
            var newLabelName = request.Name;

            // Update the label
            label.Name = request.Name;
            label.Color = request.Color;
            label.Order = request.Order;

            label = await _labelRepository.UpdateProjectLabelAsync(label);

            // If label name changed, update all tasks that use this label
            if (oldLabelName != newLabelName)
            {
                await UpdateTaskLabelsAsync(projectId, oldLabelName, newLabelName);
            }

            return MapToLabelResponse(label);
        }

        public async Task DeleteProjectLabelAsync(int projectId, int labelId, string userEmail)
        {
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            var label = await _labelRepository.GetProjectLabelByIdAsync(labelId);
            if (label == null || label.ProjectId != projectId)
                throw new ArgumentException("Label not found");

            await _labelRepository.DeleteProjectLabelAsync(labelId);
        }

        public async Task ReorderProjectLabelsAsync(int projectId, int[] labelIds, string userEmail)
        {
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            await _labelRepository.ReorderProjectLabelsAsync(projectId, labelIds);
        }

        public async Task<IEnumerable<WorkflowStageResponse>> GetProjectWorkflowStagesAsync(int projectId, string userEmail)
        {
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            var stages = await _workflowRepository.GetOrCreateDefaultWorkflowStagesAsync(projectId);
            var stageResponses = new List<WorkflowStageResponse>();

            foreach (var stage in stages)
            {
                var taskCount = await GetTaskCountForStage(projectId, stage.Id);
                stageResponses.Add(MapToWorkflowStageResponse(stage, taskCount));
            }

            return stageResponses;
        }

        public async Task<WorkflowStageResponse> CreateWorkflowStageAsync(int projectId, CreateWorkflowStageRequest request, string userEmail)
        {
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            var stage = new ProjectWorkflowStage
            {
                ProjectId = projectId,
                Name = request.Name,
                Color = request.Color,
                IsCompleted = request.IsCompleted
            };

            stage = await _workflowRepository.CreateProjectWorkflowStageAsync(stage);
            var taskCount = await GetTaskCountForStage(projectId, stage.Id);
            return MapToWorkflowStageResponse(stage, taskCount);
        }

        public async Task<WorkflowStageResponse> UpdateWorkflowStageAsync(int projectId, int stageId, UpdateWorkflowStageRequest request, string userEmail)
        {
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            var stage = await _workflowRepository.GetProjectWorkflowStageByIdAsync(stageId);
            if (stage == null || stage.ProjectId != projectId)
                throw new ArgumentException("Workflow stage not found");

            stage.Name = request.Name;
            stage.Color = request.Color;
            stage.Order = request.Order;
            stage.IsCompleted = request.IsCompleted;

            stage = await _workflowRepository.UpdateProjectWorkflowStageAsync(stage);
            var taskCount = await GetTaskCountForStage(projectId, stage.Id);
            return MapToWorkflowStageResponse(stage, taskCount);
        }

        public async Task DeleteWorkflowStageAsync(int projectId, int stageId, string userEmail)
        {
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            var stage = await _workflowRepository.GetProjectWorkflowStageByIdAsync(stageId);
            if (stage == null || stage.ProjectId != projectId)
                throw new ArgumentException("Workflow stage not found");

            // Check if there are tasks in this stage
            var taskCount = await GetTaskCountForStage(projectId, stageId);
            if (taskCount > 0)
                throw new InvalidOperationException("Cannot delete workflow stage that contains tasks");

            await _workflowRepository.DeleteProjectWorkflowStageAsync(stageId);
        }

        public async Task ReorderWorkflowStagesAsync(int projectId, ReorderWorkflowStagesRequest request, string userEmail)
        {
            var hasAccess = await _projectService.UserHasAccessAsync(projectId, userEmail);
            if (!hasAccess)
                throw new UnauthorizedAccessException("User does not have access to this project");

            await _workflowRepository.ReorderProjectWorkflowStagesAsync(projectId, request.StageIds);
        }

        private static ProjectSettingsResponse MapToSettingsResponse(ProjectSettings settings)
        {
            return new ProjectSettingsResponse
            {
                Id = settings.Id,
                ProjectId = settings.ProjectId,
                Timezone = settings.Timezone,
                StartDate = settings.StartDate,
                EndDate = settings.EndDate,
                EnableNotifications = settings.EnableNotifications,
                EnableTimeTracking = settings.EnableTimeTracking,
                EnableCommentsNotifications = settings.EnableCommentsNotifications,
                EnableTaskAssignmentNotifications = settings.EnableTaskAssignmentNotifications,
                DefaultTaskView = settings.DefaultTaskView,
                AllowGuestAccess = settings.AllowGuestAccess,
                CreatedAt = settings.CreatedAt,
                UpdatedAt = settings.UpdatedAt
            };
        }

        private static ProjectLabelResponse MapToLabelResponse(ProjectLabel label)
        {
            return new ProjectLabelResponse
            {
                Id = label.Id,
                Name = label.Name,
                Color = label.Color,
                Order = label.Order,
                CreatedAt = label.CreatedAt
            };
        }

        private static WorkflowStageResponse MapToWorkflowStageResponse(ProjectWorkflowStage stage, int taskCount)
        {
            return new WorkflowStageResponse
            {
                Id = stage.Id,
                Name = stage.Name,
                Color = stage.Color,
                Order = stage.Order,
                IsDefault = stage.IsDefault,
                IsCompleted = stage.IsCompleted,
                CreatedAt = stage.CreatedAt,
                TaskCount = taskCount
            };
        }

        private async Task UpdateTaskLabelsAsync(int projectId, string oldLabelName, string newLabelName)
        {
            // Get all tasks for the project
            var allTasks = await _taskRepository.GetAllByProjectIdAsync(projectId);
            
            foreach (var task in allTasks)
            {
                if (!string.IsNullOrEmpty(task.Labels))
                {
                    try
                    {
                        // Deserialize the labels
                        var labels = System.Text.Json.JsonSerializer.Deserialize<string[]>(task.Labels);
                        if (labels != null && labels.Contains(oldLabelName))
                        {
                            // Replace the old label name with the new one
                            var updatedLabels = labels.Select(label => label == oldLabelName ? newLabelName : label).ToArray();
                            
                            // Serialize back to JSON and update the task
                            task.Labels = System.Text.Json.JsonSerializer.Serialize(updatedLabels);
                            await _taskRepository.UpdateAsync(task);
                        }
                    }
                    catch (System.Text.Json.JsonException)
                    {
                        // Skip tasks with invalid JSON in labels
                        continue;
                    }
                }
            }
        }

        private async Task<int> GetTaskCountForStage(int projectId, int stageId)
        {
            // Get all tasks for the project
            var tasks = await _taskRepository.GetAllByProjectIdAsync(projectId);
            
            // For now, map TaskStatus to workflow stage position
            // This is a temporary solution until tasks are directly linked to workflow stages
            var workflowStages = await _workflowRepository.GetProjectWorkflowStagesAsync(projectId);
            var stagesList = workflowStages.OrderBy(s => s.Order).ToList();
            var stageIndex = stagesList.FindIndex(s => s.Id == stageId);
            
            if (stageIndex == -1) return 0;
            
            // Map task status to stage index
            var taskCount = stageIndex switch
            {
                0 => tasks.Count(t => t.Status == Entities.TaskStatus.Todo),
                1 => tasks.Count(t => t.Status == Entities.TaskStatus.InProgress),
                2 => tasks.Count(t => t.Status == Entities.TaskStatus.InReview),
                3 => tasks.Count(t => t.Status == Entities.TaskStatus.Done),
                _ => 0
            };
            
            return taskCount;
        }
    }
} 