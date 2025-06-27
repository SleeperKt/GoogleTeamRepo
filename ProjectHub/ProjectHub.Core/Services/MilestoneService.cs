using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectHub.Core.Services
{
    public class MilestoneService : IMilestoneService
    {
        private readonly IMilestoneRepository _milestoneRepository;
        private readonly IProjectParticipantRepository _participantRepository;
        private readonly IUserRepository _userRepository;
        private readonly IProjectRepository _projectRepository;

        public MilestoneService(
            IMilestoneRepository milestoneRepository,
            IProjectParticipantRepository participantRepository,
            IUserRepository userRepository,
            IProjectRepository projectRepository)
        {
            _milestoneRepository = milestoneRepository;
            _participantRepository = participantRepository;
            _userRepository = userRepository;
            _projectRepository = projectRepository;
        }

        private async Task<User?> FindUserByIdOrEmailAsync(string userIdOrEmail)
        {
            // Try to parse as Guid first (user ID)
            if (Guid.TryParse(userIdOrEmail, out var userId))
            {
                return await _userRepository.GetByIdAsync(userId);
            }
            // Otherwise treat as email
            return await _userRepository.GetByEmailAsync(userIdOrEmail);
        }

        private async Task<bool> IsUserProjectParticipantAsync(int projectId, string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null) return false;
            
            return await _participantRepository.IsUserInProjectAsync(projectId, user.UserId);
        }

        private async Task EnsureUserCanEditMilestonesAsync(int projectId, string userId)
        {
            var user = await FindUserByIdOrEmailAsync(userId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(userId));
            }

            var userRole = await _participantRepository.GetUserRoleInProjectAsync(projectId, user.UserId);
            if (userRole == null || userRole == ParticipantRole.Viewer)
            {
                throw new UnauthorizedAccessException("User does not have permission to edit milestones in this project.");
            }
        }

        private static MilestoneStatus ParseMilestoneStatus(string status)
        {
            return status.ToLower() switch
            {
                "upcoming" => MilestoneStatus.Upcoming,
                "in-progress" => MilestoneStatus.InProgress,
                "completed" => MilestoneStatus.Completed,
                "cancelled" => MilestoneStatus.Cancelled,
                _ => MilestoneStatus.Upcoming
            };
        }

        private static string GetMilestoneStatusString(MilestoneStatus status)
        {
            return status switch
            {
                MilestoneStatus.Upcoming => "upcoming",
                MilestoneStatus.InProgress => "in-progress",
                MilestoneStatus.Completed => "completed",
                MilestoneStatus.Cancelled => "cancelled",
                _ => "upcoming"
            };
        }

        private static MilestoneResponse MapToMilestoneResponse(ProjectMilestone milestone, User? createdByUser)
        {
            var now = DateTime.Now;
            var daysUntilDue = (int)(milestone.TargetDate - now).TotalDays;
            var isOverdue = milestone.TargetDate < now && 
                           milestone.Status != MilestoneStatus.Completed && 
                           milestone.Status != MilestoneStatus.Cancelled;

            return new MilestoneResponse
            {
                Id = milestone.Id,
                ProjectId = milestone.ProjectId,
                Title = milestone.Title,
                Description = milestone.Description,
                TargetDate = milestone.TargetDate,
                Status = GetMilestoneStatusString(milestone.Status),
                CreatedById = milestone.CreatedById,
                CreatedByName = createdByUser?.UserName ?? "Unknown",
                CreatedAt = milestone.CreatedAt,
                UpdatedAt = milestone.UpdatedAt,
                CompletedAt = milestone.CompletedAt,
                IsOverdue = isOverdue,
                DaysUntilDue = daysUntilDue
            };
        }

        public async Task<MilestoneResponse?> GetMilestoneByIdAsync(int id, string requestingUserId)
        {
            var milestone = await _milestoneRepository.GetByIdAsync(id);
            if (milestone == null) return null;

            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(milestone.ProjectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            var createdByUser = await _userRepository.GetByIdAsync(milestone.CreatedById);
            return MapToMilestoneResponse(milestone, createdByUser);
        }

        public async Task<IEnumerable<MilestoneResponse>> GetProjectMilestonesAsync(int projectId, string requestingUserId)
        {
            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(projectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            var milestones = await _milestoneRepository.GetByProjectIdAsync(projectId);
            var milestoneResponses = new List<MilestoneResponse>();

            foreach (var milestone in milestones)
            {
                var createdByUser = await _userRepository.GetByIdAsync(milestone.CreatedById);
                milestoneResponses.Add(MapToMilestoneResponse(milestone, createdByUser));
            }

            return milestoneResponses;
        }

        public async Task<MilestoneResponse> CreateMilestoneAsync(int projectId, CreateMilestoneRequest request, string createdByUserId)
        {
            // Check if user has permission to create milestones
            await EnsureUserCanEditMilestonesAsync(projectId, createdByUserId);

            var user = await FindUserByIdOrEmailAsync(createdByUserId);
            if (user == null)
            {
                throw new ArgumentException("Invalid user ID or email", nameof(createdByUserId));
            }

            // Validate project exists
            var project = await _projectRepository.GetByIdAsync(projectId);
            if (project == null)
            {
                throw new ArgumentException("Project not found.");
            }

            var milestone = new ProjectMilestone
            {
                ProjectId = projectId,
                Title = request.Title,
                Description = request.Description,
                TargetDate = request.TargetDate,
                Status = ParseMilestoneStatus(request.Status),
                CreatedById = user.UserId,
                CreatedAt = DateTime.Now
            };

            var createdMilestone = await _milestoneRepository.AddAsync(milestone);
            return MapToMilestoneResponse(createdMilestone, user);
        }

        public async Task<MilestoneResponse> UpdateMilestoneAsync(int id, UpdateMilestoneRequest request, string requestingUserId)
        {
            var milestone = await _milestoneRepository.GetByIdAsync(id);
            if (milestone == null)
            {
                throw new ArgumentException("Milestone not found.");
            }

            // Check if user has permission to edit milestones
            await EnsureUserCanEditMilestonesAsync(milestone.ProjectId, requestingUserId);

            // Update milestone properties
            milestone.Title = request.Title;
            milestone.Description = request.Description;
            milestone.TargetDate = request.TargetDate;
            
            var newStatus = ParseMilestoneStatus(request.Status);
            if (milestone.Status != newStatus)
            {
                milestone.Status = newStatus;
                if (newStatus == MilestoneStatus.Completed)
                {
                    milestone.CompletedAt = DateTime.Now;
                }
                else
                {
                    milestone.CompletedAt = null;
                }
            }

            var updatedMilestone = await _milestoneRepository.UpdateAsync(milestone);
            var createdByUser = await _userRepository.GetByIdAsync(milestone.CreatedById);
            
            return MapToMilestoneResponse(updatedMilestone, createdByUser);
        }

        public async Task DeleteMilestoneAsync(int id, string requestingUserId)
        {
            var milestone = await _milestoneRepository.GetByIdAsync(id);
            if (milestone == null)
            {
                throw new ArgumentException("Milestone not found.");
            }

            // Check if user has permission to delete milestones
            await EnsureUserCanEditMilestonesAsync(milestone.ProjectId, requestingUserId);

            await _milestoneRepository.DeleteAsync(id);
        }

        public async Task<int> GetMilestoneCountAsync(int projectId, string requestingUserId)
        {
            // Check if user is participant in the project
            if (!await IsUserProjectParticipantAsync(projectId, requestingUserId))
            {
                throw new UnauthorizedAccessException("User is not a participant in this project.");
            }

            return await _milestoneRepository.GetMilestoneCountByProjectIdAsync(projectId);
        }
    }
} 