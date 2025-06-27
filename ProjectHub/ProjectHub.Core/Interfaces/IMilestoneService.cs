using ProjectHub.Core.DataTransferObjects;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface IMilestoneService
    {
        Task<MilestoneResponse?> GetMilestoneByIdAsync(int id, string requestingUserId);
        Task<IEnumerable<MilestoneResponse>> GetProjectMilestonesAsync(int projectId, string requestingUserId);
        Task<MilestoneResponse> CreateMilestoneAsync(int projectId, CreateMilestoneRequest request, string createdByUserId);
        Task<MilestoneResponse> UpdateMilestoneAsync(int id, UpdateMilestoneRequest request, string requestingUserId);
        Task DeleteMilestoneAsync(int id, string requestingUserId);
        Task<int> GetMilestoneCountAsync(int projectId, string requestingUserId);
    }
} 