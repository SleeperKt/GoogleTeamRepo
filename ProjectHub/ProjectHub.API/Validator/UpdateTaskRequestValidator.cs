using FluentValidation;
using ProjectHub.Core.DataTransferObjects;

namespace ProjectHub.API.Validator
{
    public class UpdateTaskRequestValidator : AbstractValidator<UpdateTaskRequest>
    {
        public UpdateTaskRequestValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .When(x => !string.IsNullOrEmpty(x.Title))
                .WithMessage("Task title cannot be empty.")
                .MaximumLength(200)
                .When(x => !string.IsNullOrEmpty(x.Title))
                .WithMessage("Task title cannot exceed 200 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(1000)
                .When(x => x.Description != null)
                .WithMessage("Task description cannot exceed 1000 characters.");

            RuleFor(x => x.Priority)
                .InclusiveBetween(1, 4)
                .When(x => x.Priority.HasValue)
                .WithMessage("Priority must be between 1 (Low) and 4 (Critical).");

            RuleFor(x => x.EstimatedHours)
                .GreaterThan(0)
                .When(x => x.EstimatedHours.HasValue)
                .WithMessage("Estimated hours must be greater than 0.");

            RuleFor(x => x.DueDate)
                .GreaterThan(DateTime.UtcNow)
                .When(x => x.DueDate.HasValue)
                .WithMessage("Due date must be in the future.");
        }
    }
}
