using ProjectHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface IProjectInvitationRepository
    {
        Task<ProjectInvitation?> GetByIdAsync(int id);
        Task<ProjectInvitation?> GetPendingInvitationAsync(int projectId, Guid inviteeId);
        Task<IEnumerable<ProjectInvitation>> GetUserInvitationsAsync(Guid userId, InvitationStatus? status = null);
        Task<IEnumerable<ProjectInvitation>> GetProjectInvitationsAsync(int projectId, InvitationStatus? status = null);
        Task<IEnumerable<ProjectInvitation>> GetSentInvitationsAsync(Guid inviterId, InvitationStatus? status = null);
        Task AddAsync(ProjectInvitation invitation);
        Task UpdateAsync(ProjectInvitation invitation);
        Task DeleteAsync(ProjectInvitation invitation);
        Task<bool> HasPendingInvitationAsync(int projectId, Guid inviteeId);
    }
} 