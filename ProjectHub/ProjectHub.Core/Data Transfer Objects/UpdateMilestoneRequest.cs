using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.DataTransferObjects
{
    public class UpdateMilestoneRequest
    {
        [Required, MaxLength(200)]
        public string Title { get; set; } = string.Empty;
        
        [MaxLength(1000)]
        public string? Description { get; set; }
        
        [Required]
        public DateTime TargetDate { get; set; }
        
        public string Status { get; set; } = "upcoming";
    }
} 