using ProjectHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface IMilestoneRepository
    {
        Task<ProjectMilestone?> GetByIdAsync(int id);
        Task<IEnumerable<ProjectMilestone>> GetByProjectIdAsync(int projectId);
        Task<ProjectMilestone> AddAsync(ProjectMilestone milestone);
        Task<ProjectMilestone> UpdateAsync(ProjectMilestone milestone);
        Task DeleteAsync(int id);
        Task<int> GetMilestoneCountByProjectIdAsync(int projectId);
        Task<IEnumerable<ProjectMilestone>> GetOverdueMilestonesAsync(int projectId);
        Task<IEnumerable<ProjectMilestone>> GetUpcomingMilestonesAsync(int projectId, int days = 30);
    }
} 