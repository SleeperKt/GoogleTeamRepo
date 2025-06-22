using ProjectHub.Core.DataTransferObjects;

namespace ProjectHub.Core.Interfaces
{
    public interface IProjectSettingsService
    {
        Task<ProjectSettingsResponse?> GetProjectSettingsAsync(int projectId, string userEmail);
        Task<ProjectSettingsResponse> UpdateProjectSettingsAsync(int projectId, UpdateProjectSettingsRequest request, string userEmail);
        Task<IEnumerable<ProjectLabelResponse>> GetProjectLabelsAsync(int projectId, string userEmail);
        Task<ProjectLabelResponse> CreateProjectLabelAsync(int projectId, CreateProjectLabelRequest request, string userEmail);
        Task<ProjectLabelResponse> UpdateProjectLabelAsync(int projectId, int labelId, UpdateProjectLabelRequest request, string userEmail);
        Task DeleteProjectLabelAsync(int projectId, int labelId, string userEmail);
        Task ReorderProjectLabelsAsync(int projectId, int[] labelIds, string userEmail);
        Task<IEnumerable<WorkflowStageResponse>> GetProjectWorkflowStagesAsync(int projectId, string userEmail);
        Task<WorkflowStageResponse> CreateWorkflowStageAsync(int projectId, CreateWorkflowStageRequest request, string userEmail);
        Task<WorkflowStageResponse> UpdateWorkflowStageAsync(int projectId, int stageId, UpdateWorkflowStageRequest request, string userEmail);
        Task DeleteWorkflowStageAsync(int projectId, int stageId, string userEmail);
        Task ReorderWorkflowStagesAsync(int projectId, ReorderWorkflowStagesRequest request, string userEmail);
    }
} 