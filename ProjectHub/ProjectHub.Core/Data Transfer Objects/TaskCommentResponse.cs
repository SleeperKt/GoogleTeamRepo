using System;

namespace ProjectHub.Core.DataTransferObjects
{
    public class TaskCommentResponse
    {
        public int Id { get; set; }
        public int TaskId { get; set; }
        public Guid UserId { get; set; }
        public string UserName { get; set; } = string.Empty;
        public string Content { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
    }
} 