using FluentValidation;
using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;

namespace ProjectHub.API.Validator
{
    public class UpdateProjectRequestValidator : AbstractValidator<UpdateProjectRequest>
    {
        public UpdateProjectRequestValidator()
        {
            RuleFor(x => x.Name)
                .NotEmpty()
                .WithMessage("Project name is required.")
                .MaximumLength(100)
                .WithMessage("Project name cannot exceed 100 characters.");

            RuleFor(x => x.Description)
                .MaximumLength(500)
                .WithMessage("Project description cannot exceed 500 characters.")
                .When(x => x.Description != null);

            RuleFor(x => x.Status)
                .IsInEnum()
                .WithMessage("Invalid project status. Valid values are: Active, OnHold, Completed.")
                .When(x => x.Status.HasValue);

            RuleFor(x => x.Priority)
                .IsInEnum()
                .WithMessage("Invalid project priority. Valid values are: Low, Medium, High, Critical.")
                .When(x => x.Priority.HasValue);
        }
    }
} 