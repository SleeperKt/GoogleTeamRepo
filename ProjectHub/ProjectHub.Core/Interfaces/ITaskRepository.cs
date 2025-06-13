using ProjectHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface ITaskRepository
    {
        Task<ProjectTask?> GetByIdAsync(int id);
        Task<IEnumerable<ProjectTask>> GetAllByProjectIdAsync(int projectId);
        Task<IEnumerable<ProjectTask>> GetFilteredTasksAsync(int projectId, ProjectHub.Core.Entities.TaskStatus? status = null, TaskStage? stage = null, Guid? assigneeId = null, int? priority = null, DateTime? dueDateFrom = null, DateTime? dueDateTo = null, int pageNumber = 1, int pageSize = 10);
        Task<IEnumerable<ProjectTask>> GetByAssigneeIdAsync(Guid assigneeId);
        Task<IEnumerable<ProjectTask>> GetByCreatedByIdAsync(Guid createdById);
        Task AddAsync(ProjectTask task);
        Task UpdateAsync(ProjectTask task);
        Task DeleteAsync(int id);
        Task<int> GetTotalCountAsync(int projectId, ProjectHub.Core.Entities.TaskStatus? status = null, TaskStage? stage = null, Guid? assigneeId = null, int? priority = null, DateTime? dueDateFrom = null, DateTime? dueDateTo = null);
    }
}
