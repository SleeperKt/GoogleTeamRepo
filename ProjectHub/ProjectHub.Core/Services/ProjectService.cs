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

        public async Task<Project> GetProjectByIdAsync(int id)
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
                throw new Exception($"User with email '{ownerId}' not found.");
            }
            
            // Ensure UserId from ownerUser is a valid Guid before using it.
            if (!Guid.TryParse(ownerUser.UserId.ToString(), out _))
            {
                throw new FormatException($"User's UserId '{ownerUser.UserId}' is not a valid GUID.");
            }

            project.OwnerId = ownerId;
            await _projectRepository.AddAsync(project);
            
            // Add owner as a participant with Owner role
            var ownerParticipant = new ProjectParticipant
            {
                ProjectId = project.Id,
                UserId = ownerUser.UserId, 
                Role = ParticipantRole.Owner,
                JoinedAt = DateTime.UtcNow
            };
            await _participantRepository.AddAsync(ownerParticipant);
            
            return project; 
        }

        public async Task UpdateProjectAsync(Project project, string currentUserId)
        {
            var existingProject = await _projectRepository.GetByIdAsync(project.Id);
            if (existingProject == null)
            {
                throw new Exception("Project not found.");
            }

            // Check if user is the owner through participant role
            var userGuid = Guid.Parse(currentUserId);
            var userRole = await _participantRepository.GetUserRoleInProjectAsync(project.Id, userGuid);
            if (userRole != ParticipantRole.Owner)
            {
                throw new UnauthorizedAccessException("User is not authorized to update this project.");
            }

            existingProject.Name = project.Name;
            existingProject.Description = project.Description;
            
            await _projectRepository.UpdateAsync(existingProject);
        }

        public async Task DeleteProjectAsync(int id, string currentUserId)
        {
            var existingProject = await _projectRepository.GetByIdAsync(id);
            if (existingProject == null)
            {
                throw new Exception("Project not found.");
            }

            // Check if user is the owner through participant role
            var userGuid = Guid.Parse(currentUserId);
            var userRole = await _participantRepository.GetUserRoleInProjectAsync(id, userGuid);
            if (userRole != ParticipantRole.Owner)
            {
                throw new UnauthorizedAccessException("User is not authorized to delete this project.");
            }

            await _projectRepository.DeleteAsync(id);
        }
    }
} 