using ProjectHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface ITaskActivityRepository
    {
        Task<TaskActivity?> GetByIdAsync(int id);
        Task<IEnumerable<TaskActivity>> GetByTaskIdAsync(int taskId);
        Task<IEnumerable<TaskActivity>> GetByTaskIdAsync(int taskId, int limit = 50);
        Task AddAsync(TaskActivity activity);
        Task<int> GetActivityCountByTaskIdAsync(int taskId);
        
        // Project-level activity methods
        Task<IEnumerable<TaskActivity>> GetByProjectIdAsync(int projectId, int page = 1, int pageSize = 20, string? filter = null);
        Task<int> GetActivityCountByProjectIdAsync(int projectId, string? filter = null);
    }
} 