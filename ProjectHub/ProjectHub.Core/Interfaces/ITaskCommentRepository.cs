using ProjectHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface ITaskCommentRepository
    {
        Task<TaskComment?> GetByIdAsync(int id);
        Task<IEnumerable<TaskComment>> GetByTaskIdAsync(int taskId);
        Task<int> GetCommentCountByTaskIdAsync(int taskId);
        Task AddAsync(TaskComment comment);
        Task UpdateAsync(TaskComment comment);
        Task DeleteAsync(int id);
    }
} 