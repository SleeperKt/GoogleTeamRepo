using ProjectHub.Core.Entities;

namespace ProjectHub.Core.DataTransferObjects
{
    public class TaskReorderRequest
    {
        public int TaskId { get; set; }
        public ProjectHub.Core.Entities.TaskStatus Status { get; set; }
        public double Position { get; set; }
    }
} 