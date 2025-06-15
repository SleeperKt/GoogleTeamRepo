using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
    public class ProjectTask
    {
        public int Id { get; set; }
        
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string Description { get; set; } = string.Empty;
        
        [Required]
        public int ProjectId { get; set; }
        
        public Guid? AssigneeId { get; set; }
        
        [Required]
        public TaskStatus Status { get; set; } = TaskStatus.Todo;
        
        [Required]
        public TaskStage Stage { get; set; } = TaskStage.Planning;
        
        [Required]
        public Guid CreatedById { get; set; }
        
        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
        
        public DateTime? UpdatedAt { get; set; }
        
        public DateTime? DueDate { get; set; }
        
        public int? EstimatedHours { get; set; }
        
        public int Priority { get; set; } = 1; // 1=Low, 2=Medium, 3=High, 4=Critical
        
        [MaxLength(50)]
        public string Type { get; set; } = "task"; // task, bug, feature, story, epic
    }
}
