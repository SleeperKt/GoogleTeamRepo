using Microsoft.EntityFrameworkCore;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using ProjectHub.Infrastructure.Data;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectHub.Infrastructure.Repositories
{
    public class TaskCommentRepository : ITaskCommentRepository
    {
        private readonly ApplicationDbContext _context;

        public TaskCommentRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TaskComment?> GetByIdAsync(int id)
        {
            return await _context.TaskComments.FindAsync(id);
        }

        public async Task<IEnumerable<TaskComment>> GetByTaskIdAsync(int taskId)
        {
            return await _context.TaskComments
                .Where(c => c.TaskId == taskId)
                .OrderBy(c => c.CreatedAt)
                .ToListAsync();
        }

        public async Task<int> GetCommentCountByTaskIdAsync(int taskId)
        {
            return await _context.TaskComments
                .CountAsync(c => c.TaskId == taskId);
        }

        public async Task AddAsync(TaskComment comment)
        {
            _context.TaskComments.Add(comment);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(TaskComment comment)
        {
            comment.UpdatedAt = DateTime.Now;
            _context.Entry(comment).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var comment = await _context.TaskComments.FindAsync(id);
            if (comment != null)
            {
                _context.TaskComments.Remove(comment);
                await _context.SaveChangesAsync();
            }
        }
    }
} 