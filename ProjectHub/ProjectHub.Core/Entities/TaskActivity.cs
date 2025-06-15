using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
    public class TaskActivity
    {
        public int Id { get; set; }
        
        [Required]
        public int TaskId { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [Required, MaxLength(50)]
        public string ActivityType { get; set; } = string.Empty; // status_change, assignee_change, comment, created, updated, etc.
        
        [MaxLength(500)]
        public string? Description { get; set; } // Human-readable description of the activity
        
        [MaxLength(100)]
        public string? OldValue { get; set; } // For change tracking
        
        [MaxLength(100)]
        public string? NewValue { get; set; } // For change tracking
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        // Navigation properties (if needed)
        public ProjectTask Task { get; set; } = null!;
    }
} 