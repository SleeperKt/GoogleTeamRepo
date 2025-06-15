using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.DataTransferObjects
{
    public class CreateTaskCommentRequest
    {
        [Required]
        [MaxLength(2000, ErrorMessage = "Comment content cannot exceed 2000 characters.")]
        public string Content { get; set; } = string.Empty;
    }
} 