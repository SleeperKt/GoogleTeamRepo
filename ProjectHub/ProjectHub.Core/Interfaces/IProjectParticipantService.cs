using ProjectHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface IProjectParticipantService
    {
        Task<ProjectParticipant> AddParticipantAsync(int projectId, Guid userId, string requestingUserId, ParticipantRole role = ParticipantRole.Participant);
        Task RemoveParticipantAsync(int projectId, Guid userId, string requestingUserId);
        Task<IEnumerable<ProjectParticipant>> GetProjectParticipantsAsync(int projectId, string requestingUserId);
        Task<IEnumerable<ProjectParticipant>> GetUserProjectsAsync(Guid userId);
        Task<bool> IsUserOwnerAsync(int projectId, string userId);
        Task<bool> IsUserParticipantAsync(int projectId, string userId);
        Task<ParticipantRole?> GetUserRoleAsync(int projectId, string userId);
        Task UpdateParticipantRoleAsync(int projectId, Guid userId, ParticipantRole newRole, string requestingUserId);
    }
} 