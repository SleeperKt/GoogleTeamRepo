using ProjectHub.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface IProjectService
    {
        Task<Project> GetProjectByIdAsync(int id);
        Task<IEnumerable<Project>> GetProjectsByOwnerAsync(string ownerId);
        Task<Project> CreateProjectAsync(Project project, string ownerId);
        Task UpdateProjectAsync(Project project, string currentUserId);
        Task DeleteProjectAsync(int id, string currentUserId);
    }
} 