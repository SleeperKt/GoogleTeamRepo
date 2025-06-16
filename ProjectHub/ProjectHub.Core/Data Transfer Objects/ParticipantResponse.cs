using ProjectHub.Core.Entities;
using System;

namespace ProjectHub.Core.DataTransferObjects
{
    public class ParticipantResponse
    {
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public ParticipantRole Role { get; set; }
        public DateTime JoinedAt { get; set; }
    }
}