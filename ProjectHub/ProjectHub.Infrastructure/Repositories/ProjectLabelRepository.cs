using Microsoft.EntityFrameworkCore;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using ProjectHub.Infrastructure.Data;

namespace ProjectHub.Infrastructure.Repositories
{
    public class ProjectLabelRepository : IProjectLabelRepository
    {
        private readonly ApplicationDbContext _context;

        public ProjectLabelRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<ProjectLabel>> GetProjectLabelsAsync(int projectId)
        {
            return await _context.ProjectLabels
                .Where(pl => pl.ProjectId == projectId)
                .OrderBy(pl => pl.Order)
                .ToListAsync();
        }

        public async Task<ProjectLabel?> GetProjectLabelByIdAsync(int labelId)
        {
            return await _context.ProjectLabels
                .FirstOrDefaultAsync(pl => pl.Id == labelId);
        }

        public async Task<ProjectLabel> CreateProjectLabelAsync(ProjectLabel label)
        {
            // Get the next order position
            var maxOrder = await _context.ProjectLabels
                .Where(pl => pl.ProjectId == label.ProjectId)
                .MaxAsync(pl => (int?)pl.Order) ?? 0;
                
            label.Order = maxOrder + 1;
            label.CreatedAt = DateTime.Now;
            
            _context.ProjectLabels.Add(label);
            await _context.SaveChangesAsync();
            
            return label;
        }

        public async Task<ProjectLabel> UpdateProjectLabelAsync(ProjectLabel label)
        {
            _context.ProjectLabels.Update(label);
            await _context.SaveChangesAsync();
            
            return label;
        }

        public async Task DeleteProjectLabelAsync(int labelId)
        {
            var label = await _context.ProjectLabels
                .FirstOrDefaultAsync(pl => pl.Id == labelId);
                
            if (label != null)
            {
                _context.ProjectLabels.Remove(label);
                await _context.SaveChangesAsync();
            }
        }

        public async Task ReorderProjectLabelsAsync(int projectId, int[] labelIds)
        {
            var labels = await _context.ProjectLabels
                .Where(pl => pl.ProjectId == projectId && labelIds.Contains(pl.Id))
                .ToListAsync();

            for (int i = 0; i < labelIds.Length; i++)
            {
                var label = labels.FirstOrDefault(l => l.Id == labelIds[i]);
                if (label != null)
                {
                    label.Order = i;
                }
            }

            await _context.SaveChangesAsync();
        }
    }
} 