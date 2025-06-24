using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.DataTransferObjects
{
    public class TransferOwnershipRequest
    {
        [Required]
        [EmailAddress]
        public string NewOwnerEmail { get; set; } = string.Empty;
        
        public string Message { get; set; } = string.Empty;
    }
} 