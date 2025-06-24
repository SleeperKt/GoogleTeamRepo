using System.ComponentModel.DataAnnotations;
using ProjectHub.Core.Entities;

namespace ProjectHub.Core.DataTransferObjects
{
    public class CreateProjectRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
        
        public ProjectStatus Status { get; set; } = ProjectStatus.Active;
        
        public ProjectPriority Priority { get; set; } = ProjectPriority.Medium;
    }
} 