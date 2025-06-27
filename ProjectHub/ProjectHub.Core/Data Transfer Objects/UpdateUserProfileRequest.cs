using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.DataTransferObjects
{
    public class UpdateUserProfileRequest
    {
        [Required, MaxLength(50)]
        public string UserName { get; set; } = string.Empty;

        [Required, EmailAddress, MaxLength(100)]
        public string Email { get; set; } = string.Empty;

        [MaxLength(500)]
        public string? Bio { get; set; }
    }
} 