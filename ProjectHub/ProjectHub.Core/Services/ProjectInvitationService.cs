using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectHub.Core.Services
{
    public class ProjectInvitationService : IProjectInvitationService
    {
        private readonly IProjectInvitationRepository _invitationRepository;
        private readonly IProjectRepository _projectRepository;
        private readonly IUserRepository _userRepository;
        private readonly IProjectParticipantRepository _participantRepository;

        public ProjectInvitationService(
            IProjectInvitationRepository invitationRepository,
            IProjectRepository projectRepository,
            IUserRepository userRepository,
            IProjectParticipantRepository participantRepository)
        {
            _invitationRepository = invitationRepository;
            _projectRepository = projectRepository;
            _userRepository = userRepository;
            _participantRepository = participantRepository;
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
        }

        public async Task<ProjectInvitation> CreateInvitationAsync(int projectId, CreateInvitationRequest request, string inviterUserId)
        {
            var inviter = await FindUserByIdOrEmailAsync(inviterUserId);
            if (inviter == null)
            {
                throw new ArgumentException("Invalid inviter user ID or email", nameof(inviterUserId));
            }

            var project = await _projectRepository.GetByIdAsync(projectId);
            if (project == null)
            {
                throw new InvalidOperationException("Project not found.");
            }

            // Check if inviter has permission to invite (must be owner or admin)
            var inviterRole = await _participantRepository.GetUserRoleInProjectAsync(projectId, inviter.UserId);
            if (inviterRole != ParticipantRole.Owner && inviterRole != ParticipantRole.Admin)
            {
                throw new UnauthorizedAccessException("Only project owners and admins can send invitations.");
            }

            var invitee = await _userRepository.GetByEmailAsync(request.InviteeEmail);
            if (invitee == null)
            {
                throw new InvalidOperationException($"User with email {request.InviteeEmail} not found.");
            }

            // Check if user is already a participant
            var isAlreadyParticipant = await _participantRepository.IsUserInProjectAsync(projectId, invitee.UserId);
            if (isAlreadyParticipant)
            {
                throw new InvalidOperationException("User is already a participant in this project.");
            }

            // Check if there's already a pending invitation
            var hasPendingInvitation = await _invitationRepository.HasPendingInvitationAsync(projectId, invitee.UserId);
            if (hasPendingInvitation)
            {
                throw new InvalidOperationException("User already has a pending invitation for this project.");
            }

            var invitation = new ProjectInvitation
            {
                ProjectId = projectId,
                InviterId = inviter.UserId,
                InviteeId = invitee.UserId,
                Role = request.Role,
                Status = InvitationStatus.Pending,
                Message = request.Message,
                CreatedAt = DateTime.Now
            };

            await _invitationRepository.AddAsync(invitation);
            return invitation;
        }

        public async Task<ProjectInvitation> RespondToInvitationAsync(int invitationId, InvitationStatus status, string userId)
        {
            if (status != InvitationStatus.Accepted && status != InvitationStatus.Declined)
            {
                throw new ArgumentException("Status must be either Accepted or Declined.", nameof(status));
            }

            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(userId));
            }

            var invitation = await _invitationRepository.GetByIdAsync(invitationId);
            if (invitation == null)
            {
                throw new InvalidOperationException("Invitation not found.");
            }

            if (invitation.InviteeId != user.UserId)
            {
                throw new UnauthorizedAccessException("You can only respond to your own invitations.");
            }

            if (invitation.Status != InvitationStatus.Pending)
            {
                throw new InvalidOperationException("Invitation has already been responded to.");
            }

            invitation.Status = status;
            invitation.RespondedAt = DateTime.Now;

            await _invitationRepository.UpdateAsync(invitation);

            // If accepted, add user as participant
            if (status == InvitationStatus.Accepted)
            {
                var participant = new ProjectParticipant
                {
                    ProjectId = invitation.ProjectId,
                    UserId = invitation.InviteeId,
                    Role = invitation.Role,
                    JoinedAt = DateTime.Now
                };

                await _participantRepository.AddAsync(participant);
            }

            return invitation;
        }

        public async Task CancelInvitationAsync(int invitationId, string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(userId));
            }

            var invitation = await _invitationRepository.GetByIdAsync(invitationId);
            if (invitation == null)
            {
                throw new InvalidOperationException("Invitation not found.");
            }

            if (invitation.InviterId != user.UserId)
            {
                throw new UnauthorizedAccessException("You can only cancel invitations you sent.");
            }

            if (invitation.Status != InvitationStatus.Pending)
            {
                throw new InvalidOperationException("Only pending invitations can be cancelled.");
            }

            invitation.Status = InvitationStatus.Cancelled;
            invitation.RespondedAt = DateTime.Now;

            await _invitationRepository.UpdateAsync(invitation);
        }

        public async Task<IEnumerable<InvitationResponse>> GetUserInvitationsAsync(string userId, InvitationStatus? status = null)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(userId));
            }

            var invitations = await _invitationRepository.GetUserInvitationsAsync(user.UserId, status);
            return await MapToInvitationResponses(invitations);
        }

        public async Task<IEnumerable<InvitationResponse>> GetProjectInvitationsAsync(int projectId, string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(userId));
            }

            // Check if user has permission to view project invitations
            var userRole = await _participantRepository.GetUserRoleInProjectAsync(projectId, user.UserId);
            if (userRole != ParticipantRole.Owner && userRole != ParticipantRole.Admin)
            {
                throw new UnauthorizedAccessException("Only project owners and admins can view project invitations.");
            }

            var invitations = await _invitationRepository.GetProjectInvitationsAsync(projectId);
            return await MapToInvitationResponses(invitations);
        }

        public async Task<IEnumerable<InvitationResponse>> GetSentInvitationsAsync(string userId, InvitationStatus? status = null)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(userId));
            }

            var invitations = await _invitationRepository.GetSentInvitationsAsync(user.UserId, status);
            return await MapToInvitationResponses(invitations);
        }

        public async Task<InvitationResponse?> GetInvitationDetailsAsync(int invitationId, string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(userId));
            }

            var invitation = await _invitationRepository.GetByIdAsync(invitationId);
            if (invitation == null)
            {
                return null;
            }

            // User can view invitation if they are the inviter or invitee
            if (invitation.InviterId != user.UserId && invitation.InviteeId != user.UserId)
            {
                throw new UnauthorizedAccessException("You don't have permission to view this invitation.");
            }

            var responses = await MapToInvitationResponses(new[] { invitation });
            return responses.FirstOrDefault();
        }

        private async Task<IEnumerable<InvitationResponse>> MapToInvitationResponses(IEnumerable<ProjectInvitation> invitations)
        {
            var responses = new List<InvitationResponse>();

            foreach (var invitation in invitations)
            {
                var project = invitation.Project ?? await _projectRepository.GetByIdAsync(invitation.ProjectId);
                var inviter = invitation.Inviter ?? await _userRepository.GetByIdAsync(invitation.InviterId);
                var invitee = invitation.Invitee ?? await _userRepository.GetByIdAsync(invitation.InviteeId);

                if (project != null && inviter != null && invitee != null)
                {
                    responses.Add(new InvitationResponse
                    {
                        Id = invitation.Id,
                        ProjectId = invitation.ProjectId,
                        ProjectPublicId = project.PublicId,
                        ProjectName = project.Name,
                        ProjectDescription = project.Description,
                        InviterId = invitation.InviterId,
                        InviterName = inviter.UserName,
                        InviterEmail = inviter.Email,
                        InviteeId = invitation.InviteeId,
                        InviteeName = invitee.UserName,
                        InviteeEmail = invitee.Email,
                        Role = invitation.Role,
                        Status = invitation.Status,
                        CreatedAt = invitation.CreatedAt,
                        RespondedAt = invitation.RespondedAt,
                        Message = invitation.Message
                    });
                }
            }

            return responses;
        }
    }
} 