using ProjectHub.Core.Entities;

namespace ProjectHub.Core.Interfaces
{
    public interface IProjectSettingsRepository
    {
        Task<ProjectSettings?> GetProjectSettingsAsync(int projectId);
        Task<ProjectSettings> CreateProjectSettingsAsync(ProjectSettings settings);
        Task<ProjectSettings> UpdateProjectSettingsAsync(ProjectSettings settings);
        Task DeleteProjectSettingsAsync(int projectId);
    }
    
    public interface IProjectLabelRepository
    {
        Task<IEnumerable<ProjectLabel>> GetProjectLabelsAsync(int projectId);
        Task<ProjectLabel?> GetProjectLabelByIdAsync(int labelId);
        Task<ProjectLabel> CreateProjectLabelAsync(ProjectLabel label);
        Task<ProjectLabel> UpdateProjectLabelAsync(ProjectLabel label);
        Task DeleteProjectLabelAsync(int labelId);
        Task ReorderProjectLabelsAsync(int projectId, int[] labelIds);
    }
    
    public interface IProjectWorkflowRepository
    {
        Task<IEnumerable<ProjectWorkflowStage>> GetProjectWorkflowStagesAsync(int projectId);
        Task<ProjectWorkflowStage?> GetProjectWorkflowStageByIdAsync(int stageId);
        Task<ProjectWorkflowStage> CreateProjectWorkflowStageAsync(ProjectWorkflowStage stage);
        Task<ProjectWorkflowStage> UpdateProjectWorkflowStageAsync(ProjectWorkflowStage stage);
        Task DeleteProjectWorkflowStageAsync(int stageId);
        Task ReorderProjectWorkflowStagesAsync(int projectId, int[] stageIds);
        Task<IEnumerable<ProjectWorkflowStage>> GetOrCreateDefaultWorkflowStagesAsync(int projectId);
    }
} 