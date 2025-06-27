using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
    public class ProjectMilestone
    {
        public int Id { get; set; }
        
        [Required]
        public int ProjectId { get; set; }
        
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string? Description { get; set; }
        
        [Required]
        public DateTime TargetDate { get; set; }
        
        [Required]
        public MilestoneStatus Status { get; set; } = MilestoneStatus.Upcoming;
        
        [Required]
        public Guid CreatedById { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime? UpdatedAt { get; set; }
        
        public DateTime? CompletedAt { get; set; }
        
        // Navigation properties
        public Project Project { get; set; } = null!;
    }
    
    public enum MilestoneStatus
    {
        Upcoming = 0,
        InProgress = 1,
        Completed = 2,
        Cancelled = 3
    }
} 