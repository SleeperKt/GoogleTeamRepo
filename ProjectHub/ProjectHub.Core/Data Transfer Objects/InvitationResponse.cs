using System;
using ProjectHub.Core.Entities;

namespace ProjectHub.Core.DataTransferObjects
{
    public class InvitationResponse
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public Guid ProjectPublicId { get; set; }
        public string ProjectName { get; set; } = string.Empty;
        public string ProjectDescription { get; set; } = string.Empty;
        public Guid InviterId { get; set; }
        public string InviterName { get; set; } = string.Empty;
        public string InviterEmail { get; set; } = string.Empty;
        public Guid InviteeId { get; set; }
        public string InviteeName { get; set; } = string.Empty;
        public string InviteeEmail { get; set; } = string.Empty;
        public ParticipantRole Role { get; set; }
        public InvitationStatus Status { get; set; }
        public DateTime CreatedAt { get; set; }
        public DateTime? RespondedAt { get; set; }
        public string? Message { get; set; }
    }
} 