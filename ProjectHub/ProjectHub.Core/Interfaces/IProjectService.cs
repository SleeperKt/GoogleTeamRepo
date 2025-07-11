using ProjectHub.Core.Entities;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface IProjectService
    {
        Task<Project?> GetProjectByIdAsync(int id);
        Task<IEnumerable<Project>> GetProjectsByOwnerAsync(string ownerId);
        Task<IEnumerable<Project>> GetProjectsByUserAsync(string userIdOrEmail);
        Task<Project> CreateProjectAsync(Project project, string ownerId);
        Task UpdateProjectAsync(Project project, string currentUserId);
        Task DeleteProjectAsync(int id, string currentUserId);
        Task<bool> UserHasAccessAsync(int projectId, string userEmail);
        Task<Project?> GetProjectByPublicIdAsync(Guid publicId);
        Task<int?> GetInternalIdByPublicIdAsync(Guid publicId);
        Task TransferOwnershipAsync(int projectId, string newOwnerEmail, string currentUserId);
        Task ArchiveProjectAsync(int projectId, string currentUserId);
    }
} 