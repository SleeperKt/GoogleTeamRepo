using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectHub.Core.Entities
{
    public class User
    {
        public Guid UserId { get; set; }

        [Required]
        public string UserName { get; set; } = string.Empty;

        [Required, EmailAddress]
        public string Email { get; set; } = string.Empty;

        [Required]
        public string PasswordHash { get; set; } = string.Empty;

        public string? OAuthProvider { get; set; }

        public Guid? OAuthId { get; set; }

        public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    }
}
