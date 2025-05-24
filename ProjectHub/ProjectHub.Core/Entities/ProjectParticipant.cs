using System;

namespace ProjectHub.Core.Entities
{
    public class ProjectParticipant
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public Guid UserId { get; set; }
        public ParticipantRole Role { get; set; }
        public DateTime JoinedAt { get; set; } = DateTime.UtcNow;

        // Navigation properties
        public Project Project { get; set; } = null!;
        public User User { get; set; } = null!;
    }
} 