using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Services
{
    public class ProjectParticipantService : IProjectParticipantService
    {
        private readonly IProjectParticipantRepository _participantRepository;
        private readonly IProjectRepository _projectRepository;
        private readonly IUserRepository _userRepository;

        public ProjectParticipantService(
            IProjectParticipantRepository participantRepository,
            IProjectRepository projectRepository,
            IUserRepository userRepository)
        {
            _participantRepository = participantRepository;
            _projectRepository = projectRepository;
            _userRepository = userRepository;
        }

        public async Task<ProjectParticipant> AddParticipantAsync(int projectId, Guid userId, string requestingUserId, ParticipantRole role = ParticipantRole.Participant)
        {
            // Check if requesting user is owner
            if (!await IsUserOwnerAsync(projectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("Only project owner can add participants.");
            }

            // Check if project exists
            var project = await _projectRepository.GetByIdAsync(projectId);
            if (project == null)
            {
                throw new Exception("Project not found.");
            }

            // Check if user exists
            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new Exception("User not found.");
            }

            // Check if user is already a participant
            var existingParticipant = await _participantRepository.GetByProjectAndUserAsync(projectId, userId);
            if (existingParticipant != null)
            {
                throw new Exception("User is already a participant in this project.");
            }

            // Create new participant
            var participant = new ProjectParticipant
            {
                ProjectId = projectId,
                UserId = userId,
                Role = role,
                JoinedAt = DateTime.UtcNow
            };

            await _participantRepository.AddAsync(participant);
            return participant;
        }

        public async Task RemoveParticipantAsync(int projectId, Guid userId, string requestingUserId)
        {
            // Check if requesting user is owner or removing themselves
            var requestingUserGuid = Guid.Parse(requestingUserId);
            var isOwner = await IsUserOwnerAsync(projectId, requestingUserId);
            var isSelfRemoval = requestingUserGuid == userId;

            if (!isOwner && !isSelfRemoval)
            {
                throw new UnauthorizedAccessException("Only project owner can remove other participants.");
            }

            // Check if participant exists
            var participant = await _participantRepository.GetByProjectAndUserAsync(projectId, userId);
            if (participant == null)
            {
                throw new Exception("Participant not found.");
            }

            // Prevent owner from being removed
            if (participant.Role == ParticipantRole.Owner)
            {
                throw new Exception("Cannot remove project owner from project.");
            }

            await _participantRepository.RemoveAsync(participant);
        }

        public async Task<IEnumerable<ProjectParticipant>> GetProjectParticipantsAsync(int projectId, string requestingUserId)
        {
            // Check if user is a participant
            var requestingUserGuid = Guid.Parse(requestingUserId);
            if (!await _participantRepository.IsUserInProjectAsync(projectId, requestingUserGuid))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            return await _participantRepository.GetProjectParticipantsAsync(projectId);
        }

        public async Task<IEnumerable<ProjectParticipant>> GetUserProjectsAsync(Guid userId)
        {
            return await _participantRepository.GetUserProjectsAsync(userId);
        }

        public async Task<bool> IsUserOwnerAsync(int projectId, string userId)
        {
            var userGuid = Guid.Parse(userId);
            var role = await _participantRepository.GetUserRoleInProjectAsync(projectId, userGuid);
            return role == ParticipantRole.Owner;
        }

        public async Task<bool> IsUserParticipantAsync(int projectId, string userId)
        {
            var userGuid = Guid.Parse(userId);
            return await _participantRepository.IsUserInProjectAsync(projectId, userGuid);
        }

        public async Task<ParticipantRole?> GetUserRoleAsync(int projectId, string userId)
        {
            var userGuid = Guid.Parse(userId);
            return await _participantRepository.GetUserRoleInProjectAsync(projectId, userGuid);
        }

        public async Task UpdateParticipantRoleAsync(int projectId, Guid userId, ParticipantRole newRole, string requestingUserId)
        {
            // Check if requesting user is owner
            if (!await IsUserOwnerAsync(projectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("Only project owner can update participant roles.");
            }

            // Check if participant exists
            var participant = await _participantRepository.GetByProjectAndUserAsync(projectId, userId);
            if (participant == null)
            {
                throw new Exception("Participant not found.");
            }

            // Prevent changing owner role
            if (participant.Role == ParticipantRole.Owner && newRole != ParticipantRole.Owner)
            {
                throw new Exception("Cannot change owner role. Transfer ownership instead.");
            }

            participant.Role = newRole;
            await _participantRepository.UpdateAsync(participant);
        }
    }
} 