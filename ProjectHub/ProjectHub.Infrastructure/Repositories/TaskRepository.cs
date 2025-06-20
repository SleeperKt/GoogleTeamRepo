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
    public class TaskRepository : ITaskRepository
    {
        private readonly ApplicationDbContext _context;

        public TaskRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProjectTask?> GetByIdAsync(int id)
        {
            return await _context.Tasks.FindAsync(id);
        }

        public async Task<IEnumerable<ProjectTask>> GetAllByProjectIdAsync(int projectId)
        {
            return await _context.Tasks
                .Where(t => t.ProjectId == projectId)
                .OrderBy(t => t.Position)
                .ThenByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectTask>> GetFilteredTasksAsync(int projectId, ProjectHub.Core.Entities.TaskStatus? status = null, TaskStage? stage = null, Guid? assigneeId = null, int? priority = null, DateTime? dueDateFrom = null, DateTime? dueDateTo = null, int pageNumber = 1, int pageSize = 10)
        {
            var query = _context.Tasks.Where(t => t.ProjectId == projectId);

            if (status.HasValue)
                query = query.Where(t => t.Status == status.Value);

            if (stage.HasValue)
                query = query.Where(t => t.Stage == stage.Value);

            if (assigneeId.HasValue)
                query = query.Where(t => t.AssigneeId == assigneeId.Value);

            if (priority.HasValue)
                query = query.Where(t => t.Priority == priority.Value);

            if (dueDateFrom.HasValue)
                query = query.Where(t => t.DueDate >= dueDateFrom.Value);

            if (dueDateTo.HasValue)
                query = query.Where(t => t.DueDate <= dueDateTo.Value);

            return await query
                .OrderBy(t => t.Position)
                .ThenByDescending(t => t.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectTask>> GetFilteredTasksAsync(int projectId, string? searchTerm = null, ProjectHub.Core.Entities.TaskStatus? status = null, TaskStage? stage = null, Guid? assigneeId = null, string? assigneeName = null, int? priority = null, DateTime? dueDateFrom = null, DateTime? dueDateTo = null, string? taskType = null, string[]? labels = null, int pageNumber = 1, int pageSize = 10)
        {
            var query = _context.Tasks
                .Where(t => t.ProjectId == projectId);

            // Search functionality
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(t => 
                    t.Title.ToLower().Contains(searchTerm.ToLower()) ||
                    (!string.IsNullOrEmpty(t.Description) && t.Description.ToLower().Contains(searchTerm.ToLower())));
            }

            if (status.HasValue)
                query = query.Where(t => t.Status == status.Value);

            if (stage.HasValue)
                query = query.Where(t => t.Stage == stage.Value);

            if (assigneeId.HasValue)
                query = query.Where(t => t.AssigneeId == assigneeId.Value);

            // Note: assigneeName filtering not implemented - use assigneeId instead

            if (priority.HasValue)
                query = query.Where(t => t.Priority == priority.Value);

            if (dueDateFrom.HasValue)
                query = query.Where(t => t.DueDate >= dueDateFrom.Value);

            if (dueDateTo.HasValue)
                query = query.Where(t => t.DueDate <= dueDateTo.Value);

            // Filter by task type if provided
            if (!string.IsNullOrWhiteSpace(taskType))
                query = query.Where(t => t.Type == taskType);

            // TODO: Add labels filtering when Labels property is added to ProjectTask entity

            return await query
                .OrderBy(t => t.Position)
                .ThenByDescending(t => t.CreatedAt)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectTask>> GetByAssigneeIdAsync(Guid assigneeId)
        {
            return await _context.Tasks
                .Where(t => t.AssigneeId == assigneeId)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectTask>> GetByCreatedByIdAsync(Guid createdById)
        {
            return await _context.Tasks
                .Where(t => t.CreatedById == createdById)
                .OrderByDescending(t => t.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(ProjectTask task)
        {
            _context.Tasks.Add(task);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ProjectTask task)
        {
            task.UpdatedAt = DateTime.Now;
            _context.Entry(task).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var task = await _context.Tasks.FindAsync(id);
            if (task != null)
            {
                _context.Tasks.Remove(task);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<int> GetTotalCountAsync(int projectId, ProjectHub.Core.Entities.TaskStatus? status = null, TaskStage? stage = null, Guid? assigneeId = null, int? priority = null, DateTime? dueDateFrom = null, DateTime? dueDateTo = null)
        {
            var query = _context.Tasks.Where(t => t.ProjectId == projectId);

            if (status.HasValue)
                query = query.Where(t => t.Status == status.Value);

            if (stage.HasValue)
                query = query.Where(t => t.Stage == stage.Value);

            if (assigneeId.HasValue)
                query = query.Where(t => t.AssigneeId == assigneeId.Value);

            if (priority.HasValue)
                query = query.Where(t => t.Priority == priority.Value);

            if (dueDateFrom.HasValue)
                query = query.Where(t => t.DueDate >= dueDateFrom.Value);

            if (dueDateTo.HasValue)
                query = query.Where(t => t.DueDate <= dueDateTo.Value);

            return await query.CountAsync();
        }

        public async Task<int> GetTotalCountAsync(int projectId, string? searchTerm = null, ProjectHub.Core.Entities.TaskStatus? status = null, TaskStage? stage = null, Guid? assigneeId = null, string? assigneeName = null, int? priority = null, DateTime? dueDateFrom = null, DateTime? dueDateTo = null, string? taskType = null, string[]? labels = null)
        {
            var query = _context.Tasks
                .Where(t => t.ProjectId == projectId);

            // Search functionality
            if (!string.IsNullOrWhiteSpace(searchTerm))
            {
                query = query.Where(t => 
                    t.Title.ToLower().Contains(searchTerm.ToLower()) ||
                    (!string.IsNullOrEmpty(t.Description) && t.Description.ToLower().Contains(searchTerm.ToLower())));
            }

            if (status.HasValue)
                query = query.Where(t => t.Status == status.Value);

            if (stage.HasValue)
                query = query.Where(t => t.Stage == stage.Value);

            if (assigneeId.HasValue)
                query = query.Where(t => t.AssigneeId == assigneeId.Value);

            // Note: assigneeName filtering not implemented - use assigneeId instead

            if (priority.HasValue)
                query = query.Where(t => t.Priority == priority.Value);

            if (dueDateFrom.HasValue)
                query = query.Where(t => t.DueDate >= dueDateFrom.Value);

            if (dueDateTo.HasValue)
                query = query.Where(t => t.DueDate <= dueDateTo.Value);

            // Filter by task type if provided
            if (!string.IsNullOrWhiteSpace(taskType))
                query = query.Where(t => t.Type == taskType);

            // TODO: Add labels filtering when Labels property is added to ProjectTask entity

            return await query.CountAsync();
        }
    }
}
