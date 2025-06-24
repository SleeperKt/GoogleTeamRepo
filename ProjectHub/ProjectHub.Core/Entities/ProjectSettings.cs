using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
    public class ProjectSettings
    {
        public int Id { get; set; }
        
        [Required]
        public int ProjectId { get; set; }
        
        [MaxLength(50)]
        public string? Timezone { get; set; }
        
        public DateTime? StartDate { get; set; }
        
        public DateTime? EndDate { get; set; }
        
        public bool EnableNotifications { get; set; } = true;
        
        public bool EnableTimeTracking { get; set; } = false;
        
        public bool EnableCommentsNotifications { get; set; } = true;
        
        public bool EnableTaskAssignmentNotifications { get; set; } = true;
        
        [MaxLength(50)]
        public string DefaultTaskView { get; set; } = "board"; // board, list, calendar
        
        public bool AllowGuestAccess { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime UpdatedAt { get; set; } = DateTime.Now;
    }
} 