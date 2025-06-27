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
    public class MilestoneRepository : IMilestoneRepository
    {
        private readonly ApplicationDbContext _context;

        public MilestoneRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProjectMilestone?> GetByIdAsync(int id)
        {
            return await _context.ProjectMilestones
                .Include(m => m.Project)
                .FirstOrDefaultAsync(m => m.Id == id);
        }

        public async Task<IEnumerable<ProjectMilestone>> GetByProjectIdAsync(int projectId)
        {
            return await _context.ProjectMilestones
                .Where(m => m.ProjectId == projectId)
                .OrderBy(m => m.TargetDate)
                .ToListAsync();
        }

        public async Task<ProjectMilestone> AddAsync(ProjectMilestone milestone)
        {
            _context.ProjectMilestones.Add(milestone);
            await _context.SaveChangesAsync();
            return milestone;
        }

        public async Task<ProjectMilestone> UpdateAsync(ProjectMilestone milestone)
        {
            milestone.UpdatedAt = DateTime.Now;
            _context.ProjectMilestones.Update(milestone);
            await _context.SaveChangesAsync();
            return milestone;
        }

        public async Task DeleteAsync(int id)
        {
            var milestone = await GetByIdAsync(id);
            if (milestone != null)
            {
                _context.ProjectMilestones.Remove(milestone);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<int> GetMilestoneCountByProjectIdAsync(int projectId)
        {
            return await _context.ProjectMilestones
                .CountAsync(m => m.ProjectId == projectId);
        }

        public async Task<IEnumerable<ProjectMilestone>> GetOverdueMilestonesAsync(int projectId)
        {
            var now = DateTime.Now;
            return await _context.ProjectMilestones
                .Where(m => m.ProjectId == projectId && 
                           m.TargetDate < now && 
                           m.Status != MilestoneStatus.Completed && 
                           m.Status != MilestoneStatus.Cancelled)
                .OrderBy(m => m.TargetDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectMilestone>> GetUpcomingMilestonesAsync(int projectId, int days = 30)
        {
            var now = DateTime.Now;
            var futureDate = now.AddDays(days);
            
            return await _context.ProjectMilestones
                .Where(m => m.ProjectId == projectId && 
                           m.TargetDate >= now && 
                           m.TargetDate <= futureDate &&
                           m.Status != MilestoneStatus.Completed && 
                           m.Status != MilestoneStatus.Cancelled)
                .OrderBy(m => m.TargetDate)
                .ToListAsync();
        }
    }
} 