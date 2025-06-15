using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
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
    }
}