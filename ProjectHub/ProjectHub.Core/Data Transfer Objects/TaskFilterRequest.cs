using ProjectHub.Core.Entities;
using System;

namespace ProjectHub.Core.DataTransferObjects
{    public class TaskFilterRequest
    {
        public ProjectHub.Core.Entities.TaskStatus? Status { get; set; }
        public TaskStage? Stage { get; set; }
        public Guid? AssigneeId { get; set; }
        public int? Priority { get; set; }
        public DateTime? DueDateFrom { get; set; }
        public DateTime? DueDateTo { get; set; }
        public int PageNumber { get; set; } = 1;
        public int PageSize { get; set; } = 10;
    }
}
