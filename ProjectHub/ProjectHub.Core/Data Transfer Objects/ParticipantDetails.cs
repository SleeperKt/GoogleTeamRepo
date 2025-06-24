using ProjectHub.Core.Entities;
using System;

namespace ProjectHub.Core.DataTransferObjects
{
    public class ParticipantDetails
    {
        public int ParticipantId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Email { get; set; } = string.Empty;
        public ParticipantRole Role { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}
