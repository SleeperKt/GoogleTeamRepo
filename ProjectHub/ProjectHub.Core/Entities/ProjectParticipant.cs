using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
    public class ProjectParticipant
    {
        public int Id { get; set; }
        
        [Required]
        public int ProjectId { get; set; }
        
        [Required]
        public Guid UserId { get; set; }
        
        [Required]
        public ParticipantRole Role { get; set; }
        
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;
    }
}