using ProjectHub.Core.Entities;

namespace ProjectHub.Core.DataTransferObjects
{
    public class RespondToInvitationRequest
    {
        public InvitationStatus Status { get; set; } // Should be Accepted or Declined
    }
} 