using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
    public class ProjectWorkflowStage
    {
        public int Id { get; set; }
        
        [Required]
        public int ProjectId { get; set; }
        
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(7)] // Hex color code
        public string Color { get; set; } = "#6b7280";
        
        public int Order { get; set; } = 0;
        
        public bool IsDefault { get; set; } = false;
        
        public bool IsCompleted { get; set; } = false;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
    }
} 