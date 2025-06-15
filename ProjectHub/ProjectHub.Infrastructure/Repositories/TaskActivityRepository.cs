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
    public class TaskActivityRepository : ITaskActivityRepository
    {
        private readonly ApplicationDbContext _context;

        public TaskActivityRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<TaskActivity?> GetByIdAsync(int id)
        {
            return await _context.TaskActivities.FindAsync(id);
        }

        public async Task<IEnumerable<TaskActivity>> GetByTaskIdAsync(int taskId)
        {
            return await _context.TaskActivities
                .Where(a => a.TaskId == taskId)
                .OrderByDescending(a => a.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<TaskActivity>> GetByTaskIdAsync(int taskId, int limit = 50)
        {
            return await _context.TaskActivities
                .Where(a => a.TaskId == taskId)
                .OrderByDescending(a => a.CreatedAt)
                .Take(limit)
                .ToListAsync();
        }

        public async Task AddAsync(TaskActivity activity)
        {
            _context.TaskActivities.Add(activity);
            await _context.SaveChangesAsync();
        }

        public async Task<int> GetActivityCountByTaskIdAsync(int taskId)
        {
            return await _context.TaskActivities
                .CountAsync(a => a.TaskId == taskId);
        }
    }
} 