using Microsoft.EntityFrameworkCore;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using ProjectHub.Infrastructure.Data;

namespace ProjectHub.Infrastructure.Repositories
{
    public class ProjectSettingsRepository : IProjectSettingsRepository
    {
        private readonly ApplicationDbContext _context;

        public ProjectSettingsRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProjectSettings?> GetProjectSettingsAsync(int projectId)
        {
            return await _context.ProjectSettings
                .FirstOrDefaultAsync(ps => ps.ProjectId == projectId);
        }

        public async Task<ProjectSettings> CreateProjectSettingsAsync(ProjectSettings settings)
        {
            settings.CreatedAt = DateTime.Now;
            settings.UpdatedAt = DateTime.Now;
            
            _context.ProjectSettings.Add(settings);
            await _context.SaveChangesAsync();
            
            return settings;
        }

        public async Task<ProjectSettings> UpdateProjectSettingsAsync(ProjectSettings settings)
        {
            settings.UpdatedAt = DateTime.Now;
            
            _context.ProjectSettings.Update(settings);
            await _context.SaveChangesAsync();
            
            return settings;
        }

        public async Task DeleteProjectSettingsAsync(int projectId)
        {
            var settings = await _context.ProjectSettings
                .FirstOrDefaultAsync(ps => ps.ProjectId == projectId);
                
            if (settings != null)
            {
                _context.ProjectSettings.Remove(settings);
                await _context.SaveChangesAsync();
            }
        }
    }
} 