using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.DataTransferObjects
{
    public class RegisterRequest
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [Required, EmailAddress, MaxLength(100)]
        public string Email { get; set; } = string.Empty;
        
        [Required]
        public string Password { get; set; } = string.Empty;
    }
}
