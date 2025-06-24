using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.DataTransferObjects
{
    public class CreateProjectLabelRequest
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [Required, MaxLength(7)]
        public string Color { get; set; } = "#3b82f6";
    }
    
    public class UpdateProjectLabelRequest
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [Required, MaxLength(7)]
        public string Color { get; set; } = "#3b82f6";
        
        public int Order { get; set; }
    }
    
    public class ProjectLabelResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int Order { get; set; }
        public DateTime CreatedAt { get; set; }
    }
} 