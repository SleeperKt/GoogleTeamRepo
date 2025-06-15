using ProjectHub.Core.Entities;
using System;

namespace ProjectHub.Core.DataTransferObjects
{
    public class CreateTaskRequest
    {
        public string Title { get; set; } = string.Empty;
        public string Description { get; set; } = string.Empty;
        public Guid? AssigneeId { get; set; }        public ProjectHub.Core.Entities.TaskStatus Status { get; set; } = ProjectHub.Core.Entities.TaskStatus.Todo;
        public TaskStage Stage { get; set; } = TaskStage.Planning;
        public DateTime? DueDate { get; set; }
        public int? EstimatedHours { get; set; }
        public int Priority { get; set; } = 1;
        public string Type { get; set; } = "task";
    }
}
