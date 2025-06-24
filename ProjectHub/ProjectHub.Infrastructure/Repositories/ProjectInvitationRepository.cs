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
    public class ProjectInvitationRepository : IProjectInvitationRepository
    {
        private readonly ApplicationDbContext _context;

        public ProjectInvitationRepository(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<ProjectInvitation?> GetByIdAsync(int id)
        {
            return await _context.ProjectInvitations
                .Include(pi => pi.Project)
                .Include(pi => pi.Inviter)
                .Include(pi => pi.Invitee)
                .FirstOrDefaultAsync(pi => pi.Id == id);
        }

        public async Task<ProjectInvitation?> GetPendingInvitationAsync(int projectId, Guid inviteeId)
        {
            return await _context.ProjectInvitations
                .Include(pi => pi.Project)
                .Include(pi => pi.Inviter)
                .Include(pi => pi.Invitee)
                .FirstOrDefaultAsync(pi => pi.ProjectId == projectId && 
                                          pi.InviteeId == inviteeId && 
                                          pi.Status == InvitationStatus.Pending);
        }

        public async Task<IEnumerable<ProjectInvitation>> GetUserInvitationsAsync(Guid userId, InvitationStatus? status = null)
        {
            var query = _context.ProjectInvitations
                .Include(pi => pi.Project)
                .Include(pi => pi.Inviter)
                .Include(pi => pi.Invitee)
                .Where(pi => pi.InviteeId == userId);

            if (status.HasValue)
            {
                query = query.Where(pi => pi.Status == status.Value);
            }

            return await query
                .OrderByDescending(pi => pi.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectInvitation>> GetProjectInvitationsAsync(int projectId, InvitationStatus? status = null)
        {
            var query = _context.ProjectInvitations
                .Include(pi => pi.Project)
                .Include(pi => pi.Inviter)
                .Include(pi => pi.Invitee)
                .Where(pi => pi.ProjectId == projectId);

            if (status.HasValue)
            {
                query = query.Where(pi => pi.Status == status.Value);
            }

            return await query
                .OrderByDescending(pi => pi.CreatedAt)
                .ToListAsync();
        }

        public async Task<IEnumerable<ProjectInvitation>> GetSentInvitationsAsync(Guid inviterId, InvitationStatus? status = null)
        {
            var query = _context.ProjectInvitations
                .Include(pi => pi.Project)
                .Include(pi => pi.Inviter)
                .Include(pi => pi.Invitee)
                .Where(pi => pi.InviterId == inviterId);

            if (status.HasValue)
            {
                query = query.Where(pi => pi.Status == status.Value);
            }

            return await query
                .OrderByDescending(pi => pi.CreatedAt)
                .ToListAsync();
        }

        public async Task AddAsync(ProjectInvitation invitation)
        {
            _context.ProjectInvitations.Add(invitation);
            await _context.SaveChangesAsync();
        }

        public async Task UpdateAsync(ProjectInvitation invitation)
        {
            _context.ProjectInvitations.Update(invitation);
            await _context.SaveChangesAsync();
        }

        public async Task DeleteAsync(ProjectInvitation invitation)
        {
            _context.ProjectInvitations.Remove(invitation);
            await _context.SaveChangesAsync();
        }

        public async Task<bool> HasPendingInvitationAsync(int projectId, Guid inviteeId)
        {
            return await _context.ProjectInvitations
                .AnyAsync(pi => pi.ProjectId == projectId && 
                               pi.InviteeId == inviteeId && 
                               pi.Status == InvitationStatus.Pending);
        }
    }
} 