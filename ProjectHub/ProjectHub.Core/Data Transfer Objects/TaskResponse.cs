using ProjectHub.Core.Entities;
using System;

namespace ProjectHub.Core.DataTransferObjects
{
    public class TaskResponse
    {
        public int Id { get; set; }
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public int ProjectId { get; set; }        public Guid? AssigneeId { get; set; }
        public string? AssigneeName { get; set; }
        public ProjectHub.Core.Entities.TaskStatus Status { get; set; }
        public TaskStage Stage { get; set; }
        public Guid CreatedById { get; set; }
        public string CreatedByName { get; set; } = string.Empty;
        public DateTime CreatedAt { get; set; }
        public DateTime? UpdatedAt { get; set; }
        public DateTime? DueDate { get; set; }
        public int? EstimatedHours { get; set; }
        public int Priority { get; set; }
        public string Type { get; set; } = "task";
        public string[]? Labels { get; set; }
        public int? Comments { get; set; }
        public int? Activities { get; set; }
    }
}
