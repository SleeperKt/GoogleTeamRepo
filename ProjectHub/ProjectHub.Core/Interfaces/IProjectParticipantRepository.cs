using ProjectHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface IProjectParticipantRepository
    {
        Task<ProjectParticipant?> GetByProjectAndUserAsync(int projectId, Guid userId);
        Task<IEnumerable<ProjectParticipant>> GetProjectParticipantsAsync(int projectId);
        Task<IEnumerable<ProjectParticipant>> GetUserProjectsAsync(Guid userId);
        Task<ProjectParticipant?> GetParticipantWithDetailsAsync(int projectId, Guid userId);
        Task AddAsync(ProjectParticipant participant);
        Task UpdateAsync(ProjectParticipant participant);
        Task RemoveAsync(ProjectParticipant participant);
        Task<bool> IsUserInProjectAsync(int projectId, Guid userId);
        Task<ParticipantRole?> GetUserRoleInProjectAsync(int projectId, Guid userId);
    }
} 