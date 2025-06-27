using FluentValidation;
using ProjectHub.Core.DataTransferObjects;

namespace ProjectHub.API.Validator
{
    public class CreateMilestoneRequestValidator : AbstractValidator<CreateMilestoneRequest>
    {
        public CreateMilestoneRequestValidator()
        {
            RuleFor(x => x.Title)
                .NotEmpty().WithMessage("Milestone title is required.")
                .MaximumLength(200).WithMessage("Milestone title cannot exceed 200 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(1000).WithMessage("Milestone description cannot exceed 1000 characters.");

            RuleFor(x => x.TargetDate)
                .NotEmpty().WithMessage("Target date is required.")
                .GreaterThan(DateTime.Now.AddDays(-1)).WithMessage("Target date cannot be in the past.");

            RuleFor(x => x.Status)
                .NotEmpty().WithMessage("Status is required.")
                .Must(BeValidStatus).WithMessage("Status must be one of: upcoming, in-progress, completed, cancelled.");
        }

        private static bool BeValidStatus(string status)
        {
            var validStatuses = new[] { "upcoming", "in-progress", "completed", "cancelled" };
            return validStatuses.Contains(status?.ToLower());
        }
    }
} 