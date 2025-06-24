using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.DataTransferObjects
{
    public class UpdateProjectSettingsRequest
    {
        [MaxLength(50)]
        public string? Timezone { get; set; }
        
        public DateTime? StartDate { get; set; }
        
        public DateTime? EndDate { get; set; }
        
        public bool EnableNotifications { get; set; } = true;
        
        public bool EnableTimeTracking { get; set; } = false;
        
        public bool EnableCommentsNotifications { get; set; } = true;
        
        public bool EnableTaskAssignmentNotifications { get; set; } = true;
        
        [MaxLength(50)]
        public string DefaultTaskView { get; set; } = "board";
        
        public bool AllowGuestAccess { get; set; } = false;
    }
    
    public class ProjectSettingsResponse
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string? Timezone { get; set; }
        public DateTime? StartDate { get; set; }
        public DateTime? EndDate { get; set; }
        public bool EnableNotifications { get; set; }
        public bool EnableTimeTracking { get; set; }
        public bool EnableCommentsNotifications { get; set; }
        public bool EnableTaskAssignmentNotifications { get; set; }
        public string DefaultTaskView { get; set; } = string.Empty;
        public bool AllowGuestAccess { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime UpdatedAt { get; set; }
    }
} 