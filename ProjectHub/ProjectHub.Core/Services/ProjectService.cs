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

        public ProjectService(IProjectRepository projectRepository)
        {
            _projectRepository = projectRepository;
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
            project.OwnerId = ownerId;
            await _projectRepository.AddAsync(project);
            return project; 
        }

        public async Task UpdateProjectAsync(Project project, string currentUserId)
        {
            var existingProject = await _projectRepository.GetByIdAsync(project.Id);
            if (existingProject == null)
            {
                throw new Exception("Project not found.");
            }

            if (existingProject.OwnerId != currentUserId)
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

            if (existingProject.OwnerId != currentUserId)
            {
                throw new UnauthorizedAccessException("User is not authorized to delete this project.");
            }

            await _projectRepository.DeleteAsync(id);
        }
    }
} 