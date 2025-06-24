using System;
using ProjectHub.Core.Entities;

namespace ProjectHub.Core.DataTransferObjects
{
    public class CreateInvitationRequest
    {
        public string InviteeEmail { get; set; } = string.Empty;
        public ParticipantRole Role { get; set; } = ParticipantRole.Editor;
        public string? Message { get; set; }
    }
} 