using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface ITaskService
    {
        Task<TaskResponse?> GetTaskByIdAsync(int id, string requestingUserId);
        Task<IEnumerable<TaskResponse>> GetProjectTasksAsync(int projectId, string requestingUserId, TaskFilterRequest? filter = null);
        Task<TaskResponse> CreateTaskAsync(int projectId, CreateTaskRequest request, string createdByUserId);
        Task<TaskResponse> UpdateTaskAsync(int id, UpdateTaskRequest request, string requestingUserId);
        Task<TaskResponse> ReorderTaskAsync(int taskId, TaskReorderRequest request, string requestingUserId);
        Task DeleteTaskAsync(int id, string requestingUserId);
        Task<int> GetTaskCountAsync(int projectId, string requestingUserId, TaskFilterRequest? filter = null);
        Task<IEnumerable<TaskResponse>> GetMyTasksAsync(string userId);
        
        // Comment methods
        Task<TaskCommentResponse> AddCommentAsync(int taskId, CreateTaskCommentRequest request, string userId);
        Task<IEnumerable<TaskCommentResponse>> GetTaskCommentsAsync(int taskId, string requestingUserId);
        Task<int> GetTaskCommentCountAsync(int taskId, string requestingUserId);
        
        // Activity methods
        Task<IEnumerable<TaskActivityResponse>> GetTaskActivitiesAsync(int taskId, string requestingUserId);
        Task LogTaskActivityAsync(int taskId, string activityType, string userId, string? description = null, string? oldValue = null, string? newValue = null);
    }
}
