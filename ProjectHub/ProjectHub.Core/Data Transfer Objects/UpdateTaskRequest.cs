using ProjectHub.Core.Entities;
using System;

namespace ProjectHub.Core.DataTransferObjects
{
    public class UpdateTaskRequest
    {
        public string? Title { get; set; }        public string? Description { get; set; }
        public Guid? AssigneeId { get; set; }
        public ProjectHub.Core.Entities.TaskStatus? Status { get; set; }
        public TaskStage? Stage { get; set; }
        public DateTime? DueDate { get; set; }
        public int? EstimatedHours { get; set; }
        public int? Priority { get; set; }
        public string? Type { get; set; }
        public string[]? Labels { get; set; }
        public double? Position { get; set; }
    }
}
