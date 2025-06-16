using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
    public class TaskComment
    {
        public int Id { get; set; }
        
        [Required]
        public int TaskId { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [Required, MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime? UpdatedAt { get; set; }
        
        // Navigation properties (if needed)
        public ProjectTask Task { get; set; } = null!;
    }
} 