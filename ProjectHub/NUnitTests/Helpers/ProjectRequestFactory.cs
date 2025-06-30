using   ProjectHub.Core.Entities;

namespace NUnitTests.Helpers
{
    public static class ProjectRequestFactory
    {
        public static object CreateProjectRequest(string name, string description = "", ProjectStatus status = ProjectStatus.Active, ProjectPriority priority = ProjectPriority.Medium) => new
        {
            name,
            description,
            status,
            priority
        };

        public static object UpdateProjectRequest(string name, string description = "", ProjectStatus? status = null, ProjectPriority? priority = null) => new
        {
            name,
            description,
            status,
            priority
        };

        public static object CreateTaskRequest(string title, string description = "", Guid? assigneeId = null, ProjectHub.Core.Entities.TaskStatus status = ProjectHub.Core.Entities.TaskStatus.Todo, TaskStage stage = TaskStage.Planning, DateTime? dueDate = null, int? estimatedHours = null, int priority = 1, string type = "task", string[]? labels = null, double? position = null) => new
        {
            title,
            description,
            assigneeId,
            status,
            stage,
            dueDate,
            estimatedHours,
            priority,
            type,
            labels,
            position
        };

        public static object UpdateTaskRequest(string? title = null, string? description = null, Guid? assigneeId = null, ProjectHub.Core.Entities.TaskStatus? status = null, TaskStage? stage = null, DateTime? dueDate = null, int? estimatedHours = null, int? priority = null, string? type = null, string[]? labels = null, double? position = null) => new
        {
            title,
            description,
            assigneeId,
            status,
            stage,
            dueDate,
            estimatedHours,
            priority,
            type,
            labels,
            position
        };

        public static object CreateProjectLabelRequest(string name, string color = "#3b82f6") => new
        {
            name,
            color
        };

        public static object UpdateProjectLabelRequest(string name, string color = "#3b82f6", int order = 0) => new
        {
            name,
            color,
            order
        };

        public static object CreateWorkflowStageRequest(string name, string color = "#6b7280", bool isCompleted = false) => new
        {
            name,
            color,
            isCompleted
        };

        public static object UpdateWorkflowStageRequest(string name, string color = "#6b7280", int order = 0, bool isCompleted = false) => new
        {
            name,
            color,
            order,
            isCompleted
        };

        public static object CreateTaskCommentRequest(string content) => new
        {
            content
        };

        public static object CreateInvitationRequest(string inviteeEmail, ParticipantRole role = ParticipantRole.Editor, string? message = null) => new
        {
            inviteeEmail,
            role,
            message
        };

        public static object AddParticipantRequest(Guid userId, ParticipantRole role = ParticipantRole.Editor) => new
        {
            userId,
            role
        };

        public static object UpdateParticipantRoleRequest(ParticipantRole newRole) => new
        {
            newRole
        };

        public static object TransferOwnershipRequest(string newOwnerEmail, string message = "") => new
        {
            newOwnerEmail,
            message
        };

        public static object UpdateProjectSettingsRequest(string? timezone = null, DateTime? startDate = null, DateTime? endDate = null, bool enableNotifications = true, bool enableTimeTracking = false, bool enableCommentsNotifications = true, bool enableTaskAssignmentNotifications = true, string defaultTaskView = "board", bool allowGuestAccess = false) => new
        {
            timezone,
            startDate,
            endDate,
            enableNotifications,
            enableTimeTracking,
            enableCommentsNotifications,
            enableTaskAssignmentNotifications,
            defaultTaskView,
            allowGuestAccess
        };
    }
} 