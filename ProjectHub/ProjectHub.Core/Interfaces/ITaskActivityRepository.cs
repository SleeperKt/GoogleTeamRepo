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
    }
} 