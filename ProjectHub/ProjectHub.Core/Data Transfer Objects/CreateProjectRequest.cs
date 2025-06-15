using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.DataTransferObjects
{
    public class CreateProjectRequest
    {
        [Required, MaxLength(100)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(500)]
        public string Description { get; set; } = string.Empty;
    }
} 