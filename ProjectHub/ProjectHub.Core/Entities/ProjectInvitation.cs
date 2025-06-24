using System;
using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.Entities
{
    public enum InvitationStatus
    {
        Pending = 0,
        Accepted = 1,
        Declined = 2,
        Cancelled = 3
    }

    public class ProjectInvitation
    {
        public int Id { get; set; }
        
        [Required]
        public int ProjectId { get; set; }
        
        [Required]
        public Guid InviterId { get; set; } // User who sent the invitation
        
        [Required]
        public Guid InviteeId { get; set; } // User who received the invitation
        
        [Required]
        public ParticipantRole Role { get; set; } = ParticipantRole.Editor;
        
        [Required]
        public InvitationStatus Status { get; set; } = InvitationStatus.Pending;
        
        public DateTime CreatedAt { get; set; } = DateTime.Now;
        
        public DateTime? RespondedAt { get; set; }
        
        [MaxLength(500)]
        public string? Message { get; set; }
        
        // Navigation properties
        public Project? Project { get; set; }
        public User? Inviter { get; set; }
        public User? Invitee { get; set; }
    }
} 