using System.ComponentModel.DataAnnotations;

namespace ProjectHub.Core.DataTransferObjects
{
    public class CreateWorkflowStageRequest
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(7)]
        public string Color { get; set; } = "#6b7280";
        
        public bool IsCompleted { get; set; } = false;
    }
    
    public class UpdateWorkflowStageRequest
    {
        [Required, MaxLength(50)]
        public string Name { get; set; } = string.Empty;
        
        [MaxLength(7)]
        public string Color { get; set; } = "#6b7280";
        
        public int Order { get; set; }
        
        public bool IsCompleted { get; set; } = false;
    }
    
    public class ReorderWorkflowStagesRequest
    {
        [Required]
        public int[] StageIds { get; set; } = Array.Empty<int>();
    }
    
    public class WorkflowStageResponse
    {
        public int Id { get; set; }
        public string Name { get; set; } = string.Empty;
        public string Color { get; set; } = string.Empty;
        public int Order { get; set; }
        public bool IsDefault { get; set; }
        public bool IsCompleted { get; set; }
        public DateTime CreatedAt { get; set; }
        public int TaskCount { get; set; } = 0;
    }
} 