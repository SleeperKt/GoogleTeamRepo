using System;

namespace ProjectHub.Core.DataTransferObjects
{
    public class MilestoneResponse
    {
        public int Id { get; set; }
        public int ProjectId { get; set; }
        public string Title { get; set; } = string.Empty;
        public string? Description { get; set; }
        public DateTime TargetDate { get; set; }
        public string Status { get; set; } = string.Empty;
        public Guid CreatedById { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? CompletedAt { get; set; }
        public bool IsOverdue { get; set; }
        public int DaysUntilDue { get; set; }
    }
} 