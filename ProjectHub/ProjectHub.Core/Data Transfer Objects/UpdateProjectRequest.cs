using System.ComponentModel.DataAnnotations;
using ProjectHub.Core.Entities;

namespace ProjectHub.Core.DataTransferObjects
{
    public class UpdateProjectRequest
    {
        [Required]
        [StringLength(100)]
        public string Name { get; set; } = string.Empty;

        [StringLength(500)]
        public string? Description { get; set; }
        
        public ProjectStatus? Status { get; set; }
        
        public ProjectPriority? Priority { get; set; }
    }
} 