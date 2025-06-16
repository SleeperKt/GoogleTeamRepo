using FluentValidation;
using ProjectHub.Core.DataTransferObjects;

namespace ProjectHub.API.Validator
{
    public class CreateTaskRequestValidator : AbstractValidator<CreateTaskRequest>
    {
        public CreateTaskRequestValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty()
                .WithMessage("Task title is required.")
                .MaximumLength(200)
                .WithMessage("Task title cannot exceed 200 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(1000)
                .WithMessage("Task description cannot exceed 1000 characters.");

            RuleFor(x => x.Priority)
                .InclusiveBetween(1, 4)
                .WithMessage("Priority must be between 1 (Low) and 4 (Critical).");

            RuleFor(x => x.EstimatedHours)
                .GreaterThan(0)
                .When(x => x.EstimatedHours.HasValue)
                .WithMessage("Estimated hours must be greater than 0.");

            RuleFor(x => x.DueDate)
                .GreaterThan(DateTime.Now)
                .When(x => x.DueDate.HasValue)
                .WithMessage("Due date must be in the future.");
        }
    }
}
