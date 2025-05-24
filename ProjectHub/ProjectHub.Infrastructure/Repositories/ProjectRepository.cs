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

        public async Task<Project> GetByIdAsync(int id)
        {
            return await _context.Projects.FindAsync(id);
        }

        public async Task<IEnumerable<Project>> GetAllAsync()
        {
            return await _context.Projects.ToListAsync();
        }

        public async Task<IEnumerable<Project>> GetByOwnerIdAsync(string ownerId)
        {
            return await _context.Projects.Where(p => p.OwnerId == ownerId).ToListAsync();
        }

        public async Task AddAsync(Project project)
        {
            _context.Projects.Add(project);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(Project projectToUpdate)
        {
            var existingProject = await _context.Projects.FindAsync(projectToUpdate.Id);
            if (existingProject != null)
            {
                existingProject.Name = projectToUpdate.Name;
                existingProject.Description = projectToUpdate.Description;
                await _context.SaveChangesAsync();
            }
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
    }
} 