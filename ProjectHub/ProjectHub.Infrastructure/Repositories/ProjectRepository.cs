using Microsoft.EntityFrameworkCore;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using ProjectHub.Infrastructure.Data;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectHub.Infrastructure.Repositories
{
    public class ProjectRepository : IProjectRepository
    {
        private readonly ApplicationDbContext _context;

        public ProjectRepository(ApplicationDbContext context)
        {
            _context = context;
        }
        
        public async Task<Project?> GetByIdAsync(int id)
        {
            return await _context.Projects
                .AsNoTracking()
                .FirstOrDefaultAsync(p => p.Id == id);
        }

        public async Task<IEnumerable<Project>> GetAllAsync()
        {
            return await _context.Projects
                .AsNoTracking()
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<Project>> GetByOwnerIdAsync(string ownerId)
        {
            return await _context.Projects
                .AsNoTracking()
                .Where(p => p.OwnerId == ownerId)
                .OrderByDescending(p => p.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(Project project)
        {
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Project project)
        {
            _context.Entry(project).State = EntityState.Modified;
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(int id)
        {
            var projectToRemove = await _context.Projects.FindAsync(id);
            if (projectToRemove != null)
            {
                _context.Projects.Remove(projectToRemove);
                await _context.SaveChangesAsync();
            }
        }

        public async Task<Project?> GetByPublicIdAsync(Guid publicId)
        {
            return await _context.Projects.AsNoTracking().FirstOrDefaultAsync(p => p.PublicId == publicId);
        }

        public async Task<int?> GetInternalIdByPublicIdAsync(Guid publicId)
        {
            var id = await _context.Projects.Where(p => p.PublicId == publicId).Select(p => (int?)p.Id).FirstOrDefaultAsync();
            return id;
        }
    }
}