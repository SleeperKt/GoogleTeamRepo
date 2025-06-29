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

        // Project-level activity methods
        public async Task<IEnumerable<TaskActivity>> GetByProjectIdAsync(int projectId, int page = 1, int pageSize = 20, string? filter = null)
        {
            var query = _context.TaskActivities
                .Include(a => a.Task)
                .Where(a => a.Task.ProjectId == projectId);

            // Apply filter if provided and not "all"
            if (!string.IsNullOrEmpty(filter) && filter != "all")
            {
                // Use exact string comparison instead of ToLower()
                query = query.Where(a => a.ActivityType == filter);
            }

            return await query
                .OrderByDescending(a => a.CreatedAt)
                .Skip((page - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<int> GetActivityCountByProjectIdAsync(int projectId, string? filter = null)
        {
            var query = _context.TaskActivities
                .Include(a => a.Task)
                .Where(a => a.Task.ProjectId == projectId);

            // Apply filter if provided and not "all"
            if (!string.IsNullOrEmpty(filter) && filter != "all")
            {
                // Use exact string comparison instead of ToLower()
                query = query.Where(a => a.ActivityType == filter);
            }

            return await query.CountAsync();
        }
    }
} 