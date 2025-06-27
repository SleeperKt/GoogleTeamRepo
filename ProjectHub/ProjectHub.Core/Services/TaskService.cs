using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectHub.Core.Services
{
    public class TaskService : ITaskService
    {
        private readonly ITaskRepository _taskRepository;
        private readonly IProjectParticipantRepository _participantRepository;
        private readonly IUserRepository _userRepository;
        private readonly IProjectRepository _projectRepository;
        private readonly ITaskCommentRepository _commentRepository;
        private readonly ITaskActivityRepository _activityRepository;
        private readonly IProjectWorkflowRepository _workflowRepository;

        public TaskService(
            ITaskRepository taskRepository,
            IProjectParticipantRepository participantRepository,
            IUserRepository userRepository,
            IProjectRepository projectRepository,
            ITaskCommentRepository commentRepository,
            ITaskActivityRepository activityRepository,
            IProjectWorkflowRepository workflowRepository)
        {
            _taskRepository = taskRepository;
            _participantRepository = participantRepository;
            _userRepository = userRepository;
            _projectRepository = projectRepository;
            _commentRepository = commentRepository;
            _activityRepository = activityRepository;
            _workflowRepository = workflowRepository;
        }

        private async Task<User?> FindUserByIdOrEmailAsync(string userIdOrEmail)
        {
            if (Guid.TryParse(userIdOrEmail, out Guid userId))
            {
                return await _userRepository.GetByIdAsync(userId);
            }
            return await _userRepository.GetByEmailAsync(userIdOrEmail);
        }

        private async Task<bool> IsUserProjectParticipantAsync(int projectId, string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null) return false;
            
            return await _participantRepository.IsUserInProjectAsync(projectId, user.UserId);
        }

        private async Task<ParticipantRole?> GetUserRoleInProjectAsync(int projectId, string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null) return null;
            
            return await _participantRepository.GetUserRoleInProjectAsync(projectId, user.UserId);
        }

        private async Task EnsureUserCanEditTasksAsync(int projectId, string userId)
        {
            var role = await GetUserRoleInProjectAsync(projectId, userId);
            if (role == null)
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }
            
            // Only Editor and above can edit tasks (Editor=3, Admin=2, Owner=1)
            if (role > ParticipantRole.Editor)
            {
                throw new UnauthorizedAccessException("User does not have permission to edit tasks. Editor role or higher required.");
            }
        }

        private static string GetUserInitials(string userName)
        {
            if (string.IsNullOrWhiteSpace(userName))
                return "??";

            var parts = userName.Trim().Split(' ', StringSplitOptions.RemoveEmptyEntries);
            if (parts.Length == 0)
                return "??";

            if (parts.Length == 1)
                return parts[0].Length > 0 ? parts[0][0].ToString().ToUpper() : "?";

            return (parts[0][0].ToString() + parts[^1][0].ToString()).ToUpper();
        }

        private async Task<string> GetStatusDisplayNameAsync(int projectId, int statusValue)
        {
            // Get workflow stages for the project
            var workflowStages = await _workflowRepository.GetProjectWorkflowStagesAsync(projectId);
            var stagesList = workflowStages.OrderBy(s => s.Order).ToList();

            // Map status value to workflow stage name
            if (statusValue >= 1 && statusValue <= stagesList.Count)
            {
                var stageIndex = statusValue - 1; // Convert to 0-based index
                return stagesList[stageIndex].Name;
            }

            // Fallback to default names for known TaskStatus enum values
            return statusValue switch
            {
                1 => "Todo",
                2 => "InProgress",
                3 => "InReview", 
                4 => "Done",
                5 => "Cancelled",
                _ => $"Stage {statusValue}"
            };
        }

        private async Task<double> CalculateNewTaskPositionAsync(int projectId, Entities.TaskStatus status)
        {
            var allTasks = await _taskRepository.GetAllByProjectIdAsync(projectId);
            var tasksInColumn = allTasks.Where(t => t.Status == status).ToList();
            
            if (!tasksInColumn.Any())
                return 1000; // First task in column
            
            var maxPosition = tasksInColumn.Max(t => t.Position);
            return maxPosition + 1000; // Add new task at the end
        }

        private async Task<TaskResponse> MapToTaskResponseAsync(ProjectTask task)
        {
            var createdByUser = await _userRepository.GetByIdAsync(task.CreatedById);
            User? assigneeUser = null;
            
            if (task.AssigneeId.HasValue)
            {
                assigneeUser = await _userRepository.GetByIdAsync(task.AssigneeId.Value);
            }

            // Get comment and activity counts
            var commentCount = await _commentRepository.GetCommentCountByTaskIdAsync(task.Id);
            var activityCount = await _activityRepository.GetActivityCountByTaskIdAsync(task.Id);

            string[]? labels = null;
            if (!string.IsNullOrEmpty(task.Labels))
            {
                try
                {
                    labels = System.Text.Json.JsonSerializer.Deserialize<string[]>(task.Labels);
                }
                catch
                {
                    // If deserialization fails, ignore labels
                    labels = null;
                }
            }

            // Create assignee info object if assignee exists
            DataTransferObjects.AssigneeInfo? assigneeInfo = null;
            if (assigneeUser != null)
            {
                assigneeInfo = new DataTransferObjects.AssigneeInfo
                {
                    Name = assigneeUser.UserName ?? "Unknown",
                    Image = null, // We don't have user images yet, could be added later
                    Initials = GetUserInitials(assigneeUser.UserName ?? "Unknown")
                };
            }

            return new TaskResponse
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                ProjectId = task.ProjectId,
                AssigneeId = task.AssigneeId,
                AssigneeName = assigneeUser?.UserName,
                Assignee = assigneeInfo,
                Status = task.Status,
                Stage = task.Stage,
                CreatedById = task.CreatedById,
                CreatedByName = createdByUser?.UserName ?? "Unknown",
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                DueDate = task.DueDate,
                EstimatedHours = task.EstimatedHours,
                Priority = task.Priority,
                Type = task.Type,
                Labels = labels,
                Comments = commentCount,
                Activities = activityCount,
                Position = task.Position
            };
        }

        public async Task<TaskResponse?> GetTaskByIdAsync(int id, string requestingUserId)
        {
            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null) return null;

            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(task.ProjectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            return await MapToTaskResponseAsync(task);
        }

        public async Task<IEnumerable<TaskResponse>> GetProjectTasksAsync(int projectId, string requestingUserId, TaskFilterRequest? filter = null)
        {
            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(projectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            IEnumerable<ProjectTask> tasks;
            
            if (filter == null)
            {
                tasks = await _taskRepository.GetAllByProjectIdAsync(projectId);
            }
            else
            {
                tasks = await _taskRepository.GetFilteredTasksAsync(
                    projectId,
                    filter.SearchTerm,
                    filter.Status,
                    filter.Stage,
                    filter.AssigneeId,
                    filter.AssigneeName,
                    filter.Priority,
                    filter.DueDateFrom,
                    filter.DueDateTo,
                    filter.TaskType,
                    filter.Labels,
                    filter.PageNumber,
                    filter.PageSize);
            }

            var taskResponses = new List<TaskResponse>();
            foreach (var task in tasks)
            {
                taskResponses.Add(await MapToTaskResponseAsync(task));
            }

            return taskResponses;
        }

        public async Task<TaskResponse> CreateTaskAsync(int projectId, CreateTaskRequest request, string createdByUserId)
        {
            // Check if user has permission to create tasks (Editor role or higher)
            await EnsureUserCanEditTasksAsync(projectId, createdByUserId);

            // Validate assignee is also a project participant
            if (request.AssigneeId.HasValue)
            {
                var isAssigneeParticipant = await _participantRepository.IsUserInProjectAsync(projectId, request.AssigneeId.Value);
                if (!isAssigneeParticipant)
                {
                    throw new ArgumentException("Assignee must be a participant in the project.");
                }
            }

            var createdByUser = await FindUserByIdOrEmailAsync(createdByUserId);
            if (createdByUser == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(createdByUserId));
            }

            // Calculate position for new task (at the end of the current status column)
            double position = request.Position ?? await CalculateNewTaskPositionAsync(projectId, request.Status);

            var task = new ProjectTask
            {
                Title = request.Title,
                Description = request.Description,
                ProjectId = projectId,
                AssigneeId = request.AssigneeId,
                Status = request.Status,
                Stage = request.Stage,
                CreatedById = createdByUser.UserId,
                DueDate = request.DueDate,
                EstimatedHours = request.EstimatedHours,
                Priority = request.Priority,
                Type = request.Type,
                Labels = request.Labels != null && request.Labels.Length > 0 
                    ? System.Text.Json.JsonSerializer.Serialize(request.Labels)
                    : null,
                Position = position,
                CreatedAt = DateTime.Now
            };

            await _taskRepository.AddAsync(task);
            
            // Log activity
            await LogTaskActivityAsync(task.Id, "created", createdByUserId, $"Created task '{task.Title}'");
            
            return await MapToTaskResponseAsync(task);
        }

        public async Task<TaskResponse> UpdateTaskAsync(int id, UpdateTaskRequest request, string requestingUserId)
        {
            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null)
            {
                throw new ArgumentException("Task not found.");
            }

            // Check if user has permission to edit tasks (Editor role or higher)
            await EnsureUserCanEditTasksAsync(task.ProjectId, requestingUserId);

            // Validate assignee is also a project participant (only if assigning to someone)
            if (request.AssigneeId.HasValue)
            {
                var isAssigneeParticipant = await _participantRepository.IsUserInProjectAsync(task.ProjectId, request.AssigneeId.Value);
                if (!isAssigneeParticipant)
                {
                    throw new ArgumentException("Assignee must be a participant in the project.");
                }
            }

            // Store original values for activity logging
            var originalStatus = task.Status;
            var originalAssigneeId = task.AssigneeId;
            var originalPriority = task.Priority;

            // Update only provided fields
            if (!string.IsNullOrEmpty(request.Title))
                task.Title = request.Title;
            
            if (request.Description != null)
                task.Description = request.Description;
            
            // Handle assignee update - need to check if assigneeId is provided in request (including null for unassigning)
            // We need to differentiate between "not provided" vs "explicitly set to null"
            // For now, we'll assume assigneeId is always provided in the request
            task.AssigneeId = request.AssigneeId;
            
            if (request.Status.HasValue)
                task.Status = request.Status.Value;
            
            if (request.Stage.HasValue)
                task.Stage = request.Stage.Value;
            
            if (request.DueDate.HasValue)
                task.DueDate = request.DueDate;
            
            if (request.EstimatedHours.HasValue)
                task.EstimatedHours = request.EstimatedHours;
            
            if (request.Priority.HasValue)
                task.Priority = request.Priority.Value;
            
            if (!string.IsNullOrEmpty(request.Type))
                task.Type = request.Type;
            
            if (request.Labels != null)
            {
                task.Labels = request.Labels.Length > 0 
                    ? System.Text.Json.JsonSerializer.Serialize(request.Labels)
                    : null;
            }

            if (request.Position.HasValue)
                task.Position = request.Position.Value;

            await _taskRepository.UpdateAsync(task);

            // Track if any activities were logged
            bool activityLogged = false;

            // Log activities for significant changes
            if (request.Status.HasValue && originalStatus != task.Status)
            {
                var originalStatusName = await GetStatusDisplayNameAsync(task.ProjectId, (int)originalStatus);
                var newStatusName = await GetStatusDisplayNameAsync(task.ProjectId, (int)task.Status);
                
                await LogTaskActivityAsync(id, "status_change", requestingUserId, 
                    $"Changed status from {originalStatusName} to {newStatusName}", 
                    originalStatusName, newStatusName);
                activityLogged = true;
            }

            if (originalAssigneeId != task.AssigneeId)
            {
                var oldAssigneeName = originalAssigneeId.HasValue ? 
                    (await _userRepository.GetByIdAsync(originalAssigneeId.Value))?.UserName ?? "Unknown" : "Unassigned";
                var newAssigneeName = task.AssigneeId.HasValue ? 
                    (await _userRepository.GetByIdAsync(task.AssigneeId.Value))?.UserName ?? "Unknown" : "Unassigned";
                
                await LogTaskActivityAsync(id, "assignee_change", requestingUserId, 
                    $"Changed assignee from {oldAssigneeName} to {newAssigneeName}", 
                    oldAssigneeName, newAssigneeName);
                activityLogged = true;
            }

            if (request.Priority.HasValue && originalPriority != task.Priority)
            {
                var priorityNames = new Dictionary<int, string> { {1, "Low"}, {2, "Medium"}, {3, "High"}, {4, "Critical"} };
                var oldPriorityName = priorityNames.GetValueOrDefault(originalPriority, "Unknown");
                var newPriorityName = priorityNames.GetValueOrDefault(task.Priority, "Unknown");
                
                await LogTaskActivityAsync(id, "priority_change", requestingUserId, 
                    $"Changed priority from {oldPriorityName} to {newPriorityName}", 
                    oldPriorityName, newPriorityName);
                activityLogged = true;
            }

            // Log a general update activity if no specific changes were logged
            // This catches title, description, labels, and other field changes
            if (!activityLogged)
            {
                await LogTaskActivityAsync(id, "updated", requestingUserId, "Updated task details");
            }

            return await MapToTaskResponseAsync(task);
        }

        public async Task<TaskResponse> ReorderTaskAsync(int taskId, TaskReorderRequest request, string requestingUserId)
        {
            Console.WriteLine($"🔧 TASK REORDER: Starting reorder for task {taskId} to status {request.Status}, position {request.Position}");
            
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null)
            {
                throw new ArgumentException("Task not found.");
            }

            Console.WriteLine($"🔧 TASK REORDER: Found task '{task.Title}' with current status {task.Status}");

            // Check if user has permission to edit tasks (Editor role or higher)
            await EnsureUserCanEditTasksAsync(task.ProjectId, requestingUserId);

            // Update task status and position
            var originalStatus = task.Status;
            
            // Validate the status value before casting
            if (!Enum.IsDefined(typeof(Entities.TaskStatus), request.Status))
            {
                Console.WriteLine($"❌ TASK REORDER: Status value {request.Status} is not defined in TaskStatus enum");
                throw new ArgumentException($"Invalid status value: {request.Status}. Must be a valid TaskStatus enum value (1-20).");
            }
            
            task.Status = (Entities.TaskStatus)request.Status;
            task.Position = request.Position;
            
            Console.WriteLine($"🔧 TASK REORDER: Updated task status from {originalStatus} to {task.Status}, position to {task.Position}");

            await _taskRepository.UpdateAsync(task);

            // Log activity if status changed
            if (originalStatus != task.Status)
            {
                var originalStatusName = await GetStatusDisplayNameAsync(task.ProjectId, (int)originalStatus);
                var newStatusName = await GetStatusDisplayNameAsync(task.ProjectId, (int)task.Status);
                
                await LogTaskActivityAsync(taskId, "status_change", requestingUserId, 
                    $"Moved task from {originalStatusName} to {newStatusName}", 
                    originalStatusName, newStatusName);
            }

            return await MapToTaskResponseAsync(task);
        }

        public async Task DeleteTaskAsync(int id, string requestingUserId)
        {
            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null)
            {
                throw new ArgumentException("Task not found.");
            }

            // Check if user has permission to delete tasks (Owner or task creator, or Admin)
            var requestingUser = await FindUserByIdOrEmailAsync(requestingUserId);
            if (requestingUser == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(requestingUserId));
            }

            var userRole = await _participantRepository.GetUserRoleInProjectAsync(task.ProjectId, requestingUser.UserId);
            if (userRole == null)
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            var isOwner = userRole == ParticipantRole.Owner;
            var isAdmin = userRole == ParticipantRole.Admin;
            var isCreator = task.CreatedById == requestingUser.UserId;

            if (!isOwner && !isAdmin && !isCreator)
            {
                throw new UnauthorizedAccessException("Only project owner, admin, or task creator can delete this task.");
            }

            // Log activity before deletion
            await LogTaskActivityAsync(id, "deleted", requestingUserId, $"Deleted task '{task.Title}'");

            await _taskRepository.DeleteAsync(id);
        }

        public async Task<int> GetTaskCountAsync(int projectId, string requestingUserId, TaskFilterRequest? filter = null)
        {
            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(projectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            if (filter == null)
            {
                return await _taskRepository.GetTotalCountAsync(projectId, null, null, null, null, null, null, null);
            }

            return await _taskRepository.GetTotalCountAsync(
                projectId,
                filter.SearchTerm,
                filter.Status,
                filter.Stage,
                filter.AssigneeId,
                filter.AssigneeName,
                filter.Priority,
                filter.DueDateFrom,
                filter.DueDateTo,
                filter.TaskType,
                filter.Labels);
        }

        public async Task<IEnumerable<TaskResponse>> GetMyTasksAsync(string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(userId));
            }

            var tasks = await _taskRepository.GetByAssigneeIdAsync(user.UserId);
            
            var taskResponses = new List<TaskResponse>();
            foreach (var task in tasks)
            {
                taskResponses.Add(await MapToTaskResponseAsync(task));
            }

            return taskResponses;
        }

        // Comment methods
        public async Task<TaskCommentResponse> AddCommentAsync(int taskId, CreateTaskCommentRequest request, string userId)
        {
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null)
            {
                throw new ArgumentException("Task not found.");
            }

            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(task.ProjectId, userId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(userId));
            }

            var comment = new TaskComment
            {
                TaskId = taskId,
                UserId = user.UserId,
                Content = request.Content,
                CreatedAt = DateTime.Now
            };

            await _commentRepository.AddAsync(comment);

            // Log activity
            await LogTaskActivityAsync(taskId, "comment", userId, $"Added a comment");

            return new TaskCommentResponse
            {
                Id = comment.Id,
                TaskId = comment.TaskId,
                UserId = comment.UserId,
                UserName = user.UserName,
                Content = comment.Content,
                CreatedAt = comment.CreatedAt,
                UpdatedAt = comment.UpdatedAt
            };
        }

        public async Task<IEnumerable<TaskCommentResponse>> GetTaskCommentsAsync(int taskId, string requestingUserId)
        {
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null)
            {
                throw new ArgumentException("Task not found.");
            }

            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(task.ProjectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            var comments = await _commentRepository.GetByTaskIdAsync(taskId);
            var commentResponses = new List<TaskCommentResponse>();

            foreach (var comment in comments)
            {
                var user = await _userRepository.GetByIdAsync(comment.UserId);
                commentResponses.Add(new TaskCommentResponse
                {
                    Id = comment.Id,
                    TaskId = comment.TaskId,
                    UserId = comment.UserId,
                    UserName = user?.UserName ?? "Unknown",
                    Content = comment.Content,
                    CreatedAt = comment.CreatedAt,
                    UpdatedAt = comment.UpdatedAt
                });
            }

            return commentResponses;
        }

        public async Task<int> GetTaskCommentCountAsync(int taskId, string requestingUserId)
        {
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null)
            {
                throw new ArgumentException("Task not found.");
            }

            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(task.ProjectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            return await _commentRepository.GetCommentCountByTaskIdAsync(taskId);
        }

        // Activity methods
        public async Task<IEnumerable<TaskActivityResponse>> GetTaskActivitiesAsync(int taskId, string requestingUserId)
        {
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null)
            {
                throw new ArgumentException("Task not found.");
            }

            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(task.ProjectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            var activities = await _activityRepository.GetByTaskIdAsync(taskId, 50); // Limit to 50 activities
            var activityResponses = new List<TaskActivityResponse>();

            foreach (var activity in activities)
            {
                var user = await _userRepository.GetByIdAsync(activity.UserId);
                activityResponses.Add(new TaskActivityResponse
                {
                    Id = activity.Id,
                    TaskId = activity.TaskId,
                    UserId = activity.UserId,
                    UserName = user?.UserName ?? "Unknown",
                    ActivityType = activity.ActivityType,
                    Description = activity.Description,
                    OldValue = activity.OldValue,
                    NewValue = activity.NewValue,
                    CreatedAt = activity.CreatedAt
                });
            }

            return activityResponses;
        }

        public async Task LogTaskActivityAsync(int taskId, string activityType, string userId, string? description = null, string? oldValue = null, string? newValue = null)
        {
            var task = await _taskRepository.GetByIdAsync(taskId);
            if (task == null)
            {
                throw new ArgumentException("Task not found.");
            }

            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(userId));
            }

            var activity = new TaskActivity
            {
                TaskId = taskId,
                UserId = user.UserId,
                ActivityType = activityType,
                Description = description,
                OldValue = oldValue,
                NewValue = newValue,
                CreatedAt = DateTime.Now
            };

            await _activityRepository.AddAsync(activity);
        }

        // Project activity methods
        public async Task<IEnumerable<ProjectActivityResponse>> GetProjectActivitiesAsync(int projectId, string requestingUserId, int page = 1, int pageSize = 20)
        {
            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(projectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            var activities = await _activityRepository.GetByProjectIdAsync(projectId, page, pageSize);
            var activityResponses = new List<ProjectActivityResponse>();

            foreach (var activity in activities)
            {
                var user = await _userRepository.GetByIdAsync(activity.UserId);
                var task = await _taskRepository.GetByIdAsync(activity.TaskId);
                
                activityResponses.Add(new ProjectActivityResponse
                {
                    Id = activity.Id,
                    TaskId = activity.TaskId,
                    TaskTitle = task?.Title ?? "Unknown Task",
                    UserId = activity.UserId,
                    UserName = user?.UserName ?? "Unknown",
                    ActivityType = activity.ActivityType,
                    Description = activity.Description,
                    OldValue = activity.OldValue,
                    NewValue = activity.NewValue,
                    CreatedAt = activity.CreatedAt
                });
            }

            return activityResponses;
        }

        public async Task<int> GetProjectActivityCountAsync(int projectId, string requestingUserId)
        {
            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(projectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            return await _activityRepository.GetActivityCountByProjectIdAsync(projectId);
        }

        // Helper methods
    }
}
