using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
    public class ProjectLabel
    {
        public int Id { get; set; }
        
        [Required]
        public int ProjectId { get; set; }
        
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [Required, MaxLength(7)] // Hex color code
        public string Color { get; set; } = "#3b82f6";
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public int Order { get; set; } = 0;
    }
} 