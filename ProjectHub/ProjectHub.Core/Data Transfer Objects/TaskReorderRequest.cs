using ProjectHub.Core.Entities;

namespace ProjectHub.Core.DataTransferObjects
{
    public class TaskReorderRequest
    {
        public int Status { get; set; }
        public double Position { get; set; }
    }
} 