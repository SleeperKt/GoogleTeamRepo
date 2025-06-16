using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Services
{
    public class ProjectService : IProjectService
    {
        private readonly IProjectRepository _projectRepository;
        private readonly IProjectParticipantRepository _participantRepository;
        private readonly IUserRepository _userRepository;

        public ProjectService(IProjectRepository projectRepository, IProjectParticipantRepository participantRepository, IUserRepository userRepository)
        {
            _projectRepository = projectRepository;
            _participantRepository = participantRepository;
            _userRepository = userRepository;
        }

        public async Task<Project?> GetProjectByIdAsync(int id)
        {
            return await _projectRepository.GetByIdAsync(id);
        }

        public async Task<IEnumerable<Project>> GetProjectsByOwnerAsync(string ownerId)
        {
            return await _projectRepository.GetByOwnerIdAsync(ownerId);
        }

        public async Task<Project> CreateProjectAsync(Project project, string ownerId)
        {
            // Fetch the user by email
            var ownerUser = await _userRepository.GetByEmailAsync(ownerId);
            if (ownerUser == null)
            {
                throw new ArgumentException($"User with email '{ownerId}' not found.");
            }
            
            // Ensure UserId from ownerUser is a valid Guid
            if (!Guid.TryParse(ownerUser.UserId.ToString(), out _))
            {
                throw new FormatException($"User's UserId '{ownerUser.UserId}' is not a valid GUID.");
            }

            // Set required properties
            project.OwnerId = ownerId;
            project.CreatedAt = DateTime.Now;
            
            // Validate required fields
            if (string.IsNullOrEmpty(project.Name))
            {
                throw new ArgumentException("Project name cannot be empty");
            }
            
            await _projectRepository.AddAsync(project);
            
            // Add owner as a participant with Owner role
            var ownerParticipant = new ProjectParticipant
            {
                ProjectId = project.Id,
                UserId = ownerUser.UserId, 
                Role = ParticipantRole.Owner,
                JoinedAt = DateTime.Now
            };
            await _participantRepository.AddAsync(ownerParticipant);
            
            return project; 
        }

        public async Task UpdateProjectAsync(Project project, string currentUserId)
        {
            var existingProject = await _projectRepository.GetByIdAsync(project.Id);
            if (existingProject == null)
            {
                throw new ArgumentException("Project not found.");
            }

            // Get the user by email or ID
            var user = await _userRepository.GetByEmailAsync(currentUserId);
            if (user == null && Guid.TryParse(currentUserId, out Guid userId))
            {
                user = await _userRepository.GetByIdAsync(userId);
            }

            if (user == null)
            {
                throw new ArgumentException($"User with ID or email '{currentUserId}' not found.");
            }

            // Check if user is the owner through participant role
            var userRole = await _participantRepository.GetUserRoleInProjectAsync(project.Id, user.UserId);
            if (userRole != ParticipantRole.Owner)
            {
                throw new UnauthorizedAccessException("User is not authorized to update this project.");
            }

            // Update only allowed fields
            existingProject.Name = project.Name;
            existingProject.Description = project.Description;

            await _projectRepository.UpdateAsync(existingProject);
        }

        public async Task DeleteProjectAsync(int id, string currentUserId)
        {
            var existingProject = await _projectRepository.GetByIdAsync(id);
            if (existingProject == null)
            {
                throw new ArgumentException("Project not found.");
            }

            // Get the user by email or ID
            var user = await _userRepository.GetByEmailAsync(currentUserId);
            if (user == null && Guid.TryParse(currentUserId, out Guid userId))
            {
                user = await _userRepository.GetByIdAsync(userId);
            }

            if (user == null)
            {
                throw new ArgumentException($"User with ID or email '{currentUserId}' not found.");
            }

            // Check if user is the owner through participant role
            var userRole = await _participantRepository.GetUserRoleInProjectAsync(id, user.UserId);
            if (userRole != ParticipantRole.Owner)
            {
                throw new UnauthorizedAccessException("User is not authorized to delete this project.");
            }

            await _projectRepository.DeleteAsync(id);
        }

        public async Task<bool> UserHasAccessAsync(int projectId, string userEmail)
        {
            var project = await _projectRepository.GetByIdAsync(projectId);
            if (project == null)
                return false;

            if (project.OwnerId.Equals(userEmail, StringComparison.OrdinalIgnoreCase))
                return true;

            var user = await _userRepository.GetByEmailAsync(userEmail);
            if (user == null)
                return false;

            var role = await _participantRepository.GetUserRoleInProjectAsync(projectId, user.UserId);
            return role != null;
        }

        public async Task<Project?> GetProjectByPublicIdAsync(Guid publicId)
        {
            return await _projectRepository.GetByPublicIdAsync(publicId);
        }

        public async Task<int?> GetInternalIdByPublicIdAsync(Guid publicId)
        {
            return await _projectRepository.GetInternalIdByPublicIdAsync(publicId);
        }
    }
}