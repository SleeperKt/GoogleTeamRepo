using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;


namespace ProjectHub.Core.Services
{
    public class ProjectParticipantService : IProjectParticipantService
    {
        private readonly IProjectParticipantRepository _participantRepository;
        private readonly IProjectRepository _projectRepository;
        private readonly IUserRepository _userRepository;        public ProjectParticipantService(
            IProjectParticipantRepository participantRepository,
            IProjectRepository projectRepository,
            IUserRepository userRepository)
        {
            _participantRepository = participantRepository;
            _projectRepository = projectRepository;
            _userRepository = userRepository;
        }

        private async Task<User?> FindUserByIdOrEmailAsync(string userIdOrEmail)
        {
            if (string.IsNullOrEmpty(userIdOrEmail))
                return null;

            // Try parsing as GUID first
            if (Guid.TryParse(userIdOrEmail, out var userId))
            {
                return await _userRepository.GetByIdAsync(userId);
            }

            return await _userRepository.GetByEmailAsync(userIdOrEmail);
        }        public async Task<ProjectParticipant> AddParticipantAsync(int projectId, Guid userId, string requestingUserId, ParticipantRole role = ParticipantRole.Editor)
        {
            if (!await IsUserOwnerAsync(projectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("Only project owner can add participants.");
            }

            var project = await _projectRepository.GetByIdAsync(projectId);
            if (project == null)
            {
                throw new InvalidOperationException("Project not found.");
            }

            var user = await _userRepository.GetByIdAsync(userId);
            if (user == null)
            {
                throw new InvalidOperationException("User not found.");
            }

            var existingParticipant = await _participantRepository.GetByProjectAndUserAsync(projectId, userId);
            if (existingParticipant != null)
            {
                throw new InvalidOperationException("User is already a participant in this project.");
            }

            var participant = new ProjectParticipant
            {
                ProjectId = projectId,
                UserId = userId,
                Role = role,
                JoinedAt = DateTime.Now
            };

            await _participantRepository.AddAsync(participant);
            return participant;
        }public async Task RemoveParticipantAsync(int projectId, Guid userId, string requestingUserId)
        {
            var requestingUser = await FindUserByIdOrEmailAsync(requestingUserId);
            if (requestingUser == null)
            {
                throw new ArgumentException("Invalid requesting user ID or email", nameof(requestingUserId));
            }

            var isOwner = await IsUserOwnerAsync(projectId, requestingUserId);
            var isSelfRemoval = requestingUser.UserId == userId;

            if (!isOwner && !isSelfRemoval)
            {
                throw new UnauthorizedAccessException("Only project owner can remove other participants.");
            }

            var participant = await _participantRepository.GetByProjectAndUserAsync(projectId, userId);
            if (participant == null)
            {
                throw new InvalidOperationException("Participant not found.");
            }

            if (participant.Role == ParticipantRole.Owner)
            {
                throw new InvalidOperationException("Cannot remove project owner from project.");
            }

            await _participantRepository.RemoveAsync(participant);
        }
        public async Task<IEnumerable<ProjectParticipant>> GetProjectParticipantsAsync(int projectId, string requestingUserId)
        {
            var user = await FindUserByIdOrEmailAsync(requestingUserId);
            if (user == null)
            {
                throw new ArgumentException($"User not found with ID or email: {requestingUserId}", nameof(requestingUserId));
            }

            if (!await _participantRepository.IsUserInProjectAsync(projectId, user.UserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            // Get participants with user details
            var participants = await _participantRepository.GetProjectParticipantsAsync(projectId);
            return participants;
        }

        public async Task<IEnumerable<ProjectParticipant>> GetUserProjectsAsync(Guid userId)
        {
            return await _participantRepository.GetUserProjectsAsync(userId);
        }        public async Task<bool> IsUserOwnerAsync(int projectId, string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
                return false;
            
            var role = await _participantRepository.GetUserRoleInProjectAsync(projectId, user.UserId);
            return role == ParticipantRole.Owner;
        }

        public async Task<bool> IsUserParticipantAsync(int projectId, string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
                return false;
            
            return await _participantRepository.IsUserInProjectAsync(projectId, user.UserId);
        }

        public async Task<ParticipantRole?> GetUserRoleAsync(int projectId, string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
                return null;
            
            return await _participantRepository.GetUserRoleInProjectAsync(projectId, user.UserId);
        }        public async Task UpdateParticipantRoleAsync(int projectId, Guid userId, ParticipantRole newRole, string requestingUserId)
        {
            // Resolve the requester and ensure they are part of the project
            var requester = await FindUserByIdOrEmailAsync(requestingUserId);
            if (requester == null)
            {
                throw new UnauthorizedAccessException("Requesting user not found.");
            }

            var requesterParticipant = await _participantRepository.GetByProjectAndUserAsync(projectId, requester.UserId);
            if (requesterParticipant == null)
            {
                throw new UnauthorizedAccessException("Requesting user is not a participant in this project.");
            }

            var requesterRole = requesterParticipant.Role;

            // Only Owners or Admins can attempt to update roles
            if (requesterRole != ParticipantRole.Owner && requesterRole != ParticipantRole.Admin)
            {
                throw new UnauthorizedAccessException("Only project owner or admin can update participant roles.");
            }

            // Retrieve the participant whose role is to be updated
            var participant = await _participantRepository.GetByProjectAndUserAsync(projectId, userId);
            if (participant == null)
            {
                throw new InvalidOperationException("Participant not found.");
            }

            // Prevent changing the owner's role via this endpoint (requires ownership transfer)
            if (participant.Role == ParticipantRole.Owner && newRole != ParticipantRole.Owner)
            {
                throw new InvalidOperationException("Cannot change owner role. Transfer ownership instead.");
            }

            // Additional restrictions for Admins (Owners are unrestricted apart from the rule above)
            if (requesterRole == ParticipantRole.Admin)
            {
                // Admins cannot change their own role
                if (requester.UserId == userId)
                {
                    throw new UnauthorizedAccessException("Admins cannot change their own role.");
                }

                // Admins cannot modify roles of other Admins or Owners
                if (participant.Role == ParticipantRole.Admin || participant.Role == ParticipantRole.Owner)
                {
                    throw new UnauthorizedAccessException("Admins cannot change roles of other admins or owners.");
                }

                // Admins cannot assign the Owner or Admin role
                if (newRole == ParticipantRole.Owner || newRole == ParticipantRole.Admin)
                {
                    throw new UnauthorizedAccessException("Admins cannot assign the selected role.");
                }
            }

            // Apply the new role
            participant.Role = newRole;
            await _participantRepository.UpdateAsync(participant);
        }

        public async Task<IEnumerable<ParticipantDetails>> GetProjectParticipantDetailsAsync(int projectId, string requestingUserId)
        {
            var user = await FindUserByIdOrEmailAsync(requestingUserId);
            if (user == null)
            {
                throw new ArgumentException($"User not found with ID or email: {requestingUserId}", nameof(requestingUserId));
            }
            
            if (!await _participantRepository.IsUserInProjectAsync(projectId, user.UserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            var participants = await _participantRepository.GetProjectParticipantsAsync(projectId);
            var details = new List<ParticipantDetails>();
            
            foreach (var participant in participants)
            {
                var participantUser = await _userRepository.GetByIdAsync(participant.UserId);
                if (participantUser != null)
                {
                    details.Add(new ParticipantDetails
                    {
                        ParticipantId = participant.Id,
                        UserId = participantUser.UserId,
                        UserName = participantUser.UserName,
                        Email = participantUser.Email,
                        Role = participant.Role,
                        JoinedAt = participant.JoinedAt
                    });
                }
            }
            
            return details;
        }

        public async Task<IEnumerable<UserProjectResponse>> GetUserProjectDetailsAsync(Guid userId)
        {
            var participations = await _participantRepository.GetUserProjectsAsync(userId);
            var projectDetails = new List<UserProjectResponse>();
            
            foreach (var participation in participations)
            {
                var project = await _projectRepository.GetByIdAsync(participation.ProjectId);
                if (project != null)
                {
                    projectDetails.Add(new UserProjectResponse
                    {
                        ProjectId = project.Id,
                        ProjectName = project.Name,
                        ProjectDescription = project.Description,
                        Role = participation.Role,
                        JoinedAt = participation.JoinedAt,
                        Status = project.Status,
                        Priority = project.Priority
                    });
                }
            }
            
            return projectDetails;
        }
    }
}