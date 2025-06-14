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

        public TaskService(
            ITaskRepository taskRepository,
            IProjectParticipantRepository participantRepository,
            IUserRepository userRepository,
            IProjectRepository projectRepository)
        {
            _taskRepository = taskRepository;
            _participantRepository = participantRepository;
            _userRepository = userRepository;
            _projectRepository = projectRepository;
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

        private async Task<TaskResponse> MapToTaskResponseAsync(ProjectTask task)
        {
            var createdByUser = await _userRepository.GetByIdAsync(task.CreatedById);
            User? assigneeUser = null;
            
            if (task.AssigneeId.HasValue)
            {
                assigneeUser = await _userRepository.GetByIdAsync(task.AssigneeId.Value);
            }

            return new TaskResponse
            {
                Id = task.Id,
                Title = task.Title,
                Description = task.Description,
                ProjectId = task.ProjectId,
                AssigneeId = task.AssigneeId,
                AssigneeName = assigneeUser?.UserName,
                Status = task.Status,
                Stage = task.Stage,
                CreatedById = task.CreatedById,
                CreatedByName = createdByUser?.UserName ?? "Unknown",
                CreatedAt = task.CreatedAt,
                UpdatedAt = task.UpdatedAt,
                DueDate = task.DueDate,
                EstimatedHours = task.EstimatedHours,
                Priority = task.Priority
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
            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(projectId, createdByUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

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
                CreatedAt = DateTime.UtcNow
            };

            await _taskRepository.AddAsync(task);
            return await MapToTaskResponseAsync(task);
        }

        public async Task<TaskResponse> UpdateTaskAsync(int id, UpdateTaskRequest request, string requestingUserId)
        {
            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null)
            {
                throw new ArgumentException("Task not found.");
            }

            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(task.ProjectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            // Validate assignee is also a project participant
            if (request.AssigneeId.HasValue)
            {
                var isAssigneeParticipant = await _participantRepository.IsUserInProjectAsync(task.ProjectId, request.AssigneeId.Value);
                if (!isAssigneeParticipant)
                {
                    throw new ArgumentException("Assignee must be a participant in the project.");
                }
            }

            // Update only provided fields
            if (!string.IsNullOrEmpty(request.Title))
                task.Title = request.Title;
            
            if (request.Description != null)
                task.Description = request.Description;
            
            if (request.AssigneeId.HasValue)
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

            await _taskRepository.UpdateAsync(task);
            return await MapToTaskResponseAsync(task);
        }

        public async Task DeleteTaskAsync(int id, string requestingUserId)
        {
            var task = await _taskRepository.GetByIdAsync(id);
            if (task == null)
            {
                throw new ArgumentException("Task not found.");
            }

            // Check if user is participant in the project and has permission to delete
            var requestingUser = await FindUserByIdOrEmailAsync(requestingUserId);
            if (requestingUser == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(requestingUserId));
            }

            var userRole = await _participantRepository.GetUserRoleInProjectAsync(task.ProjectId, requestingUser.UserId);
            var isOwner = userRole == ParticipantRole.Owner;
            var isCreator = task.CreatedById == requestingUser.UserId;

            if (!isOwner && !isCreator)
            {
                throw new UnauthorizedAccessException("Only project owner or task creator can delete this task.");
            }

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
                return await _taskRepository.GetTotalCountAsync(projectId);
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
    }
}
