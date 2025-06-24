using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
    public enum ProjectStatus
    {
        Active = 1,
        OnHold = 2,
        Completed = 3
    }

    public enum ProjectPriority
    {
        Low = 1,
        Medium = 2,
        High = 3,
        Critical = 4
    }

    public class Project
    {
        public int Id { get; set; }
        
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public string OwnerId { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public Guid PublicId { get; set; } = Guid.NewGuid();
        
        public ProjectStatus Status { get; set; } = ProjectStatus.Active;
        
        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;
    }
}