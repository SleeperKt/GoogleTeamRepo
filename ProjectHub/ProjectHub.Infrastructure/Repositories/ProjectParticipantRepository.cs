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
    public class ProjectParticipantRepository : IProjectParticipantRepository
    {
        private readonly ApplicationDbContext _context;

        public ProjectParticipantRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProjectParticipant?> GetByProjectAndUserAsync(int projectId, Guid userId)
        {
            return await _context.ProjectParticipants
                .FirstOrDefaultAsync(pp => pp.ProjectId == projectId && pp.UserId == userId);
        }

        public async Task<IEnumerable<ProjectParticipant>> GetProjectParticipantsAsync(int projectId)
        {
            return await _context.ProjectParticipants
                .Include(pp => pp.User)
                .Where(pp => pp.ProjectId == projectId)
                .OrderBy(pp => pp.JoinedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectParticipant>> GetUserProjectsAsync(Guid userId)
        {
            return await _context.ProjectParticipants
                .Include(pp => pp.Project)
                .Where(pp => pp.UserId == userId)
                .OrderBy(pp => pp.JoinedAt)
                .ToListAsync();
        }

        public async Task<ProjectParticipant?> GetParticipantWithDetailsAsync(int projectId, Guid userId)
        {
            return await _context.ProjectParticipants
                .Include(pp => pp.User)
                .Include(pp => pp.Project)
                .FirstOrDefaultAsync(pp => pp.ProjectId == projectId && pp.UserId == userId);
        }

        public async Task AddAsync(ProjectParticipant participant)
        {
            _context.ProjectParticipants.Add(participant);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ProjectParticipant participant)
        {
            _context.ProjectParticipants.Update(participant);
            await _context.SaveChangesAsync();
        }

        public async Task RemoveAsync(ProjectParticipant participant)
        {
            _context.ProjectParticipants.Remove(participant);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> IsUserInProjectAsync(int projectId, Guid userId)
        {
            return await _context.ProjectParticipants
                .AnyAsync(pp => pp.ProjectId == projectId && pp.UserId == userId);
        }

        public async Task<ParticipantRole?> GetUserRoleInProjectAsync(int projectId, Guid userId)
        {
            var participant = await GetByProjectAndUserAsync(projectId, userId);
            return participant?.Role;
        }
    }
} 