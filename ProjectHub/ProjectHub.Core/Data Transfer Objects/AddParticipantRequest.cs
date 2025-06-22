using ProjectHub.Core.Entities;
using System;

namespace ProjectHub.Core.DataTransferObjects
{
    public class AddParticipantRequest
    {
        public Guid UserId { get; set; }
        public ParticipantRole Role { get; set; } = ParticipantRole.Editor;
    }
} 