using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface IProjectInvitationService
    {
        Task<ProjectInvitation> CreateInvitationAsync(int projectId, CreateInvitationRequest request, string inviterUserId);
        Task<ProjectInvitation> RespondToInvitationAsync(int invitationId, InvitationStatus status, string userId);
        Task CancelInvitationAsync(int invitationId, string userId);
        Task<IEnumerable<InvitationResponse>> GetUserInvitationsAsync(string userId, InvitationStatus? status = null);
        Task<IEnumerable<InvitationResponse>> GetProjectInvitationsAsync(int projectId, string userId);
        Task<IEnumerable<InvitationResponse>> GetSentInvitationsAsync(string userId, InvitationStatus? status = null);
        Task<InvitationResponse?> GetInvitationDetailsAsync(int invitationId, string userId);
    }
} 