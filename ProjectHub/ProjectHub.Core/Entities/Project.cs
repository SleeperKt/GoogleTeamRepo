using System;
using System.Collections.Generic;

namespace ProjectHub.Core.Entities
{
    public class Project
    {
        public int Id { get; set; }
        public string Name { get; set; }
        public string Description { get; set; }
        public string? OwnerId { get; set; }
        
        // Navigation property
        public ICollection<ProjectParticipant> Participants { get; set; } = new List<ProjectParticipant>();
    }
} 