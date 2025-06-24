using FluentValidation;
using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;

namespace ProjectHub.API.Validator
{
    public class TaskReorderRequestValidator : AbstractValidator<TaskReorderRequest>
    {
        public TaskReorderRequestValidator()
        {
            RuleFor(x => x.Status)
                .GreaterThanOrEqualTo(1)
                .WithMessage("Status must be a positive integer value starting from 1.");

            RuleFor(x => x.Position)
                .GreaterThanOrEqualTo(0)
                .WithMessage("Position must be greater than or equal to 0.");
        }
    }
} 