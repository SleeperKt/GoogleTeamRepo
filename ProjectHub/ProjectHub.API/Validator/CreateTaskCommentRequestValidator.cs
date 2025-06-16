using FluentValidation;
using ProjectHub.Core.DataTransferObjects;

namespace ProjectHub.API.Validator
{
    public class CreateTaskCommentRequestValidator : AbstractValidator<CreateTaskCommentRequest>
    {
        public CreateTaskCommentRequestValidator()
        {
            RuleFor(x => x.Content)
                .NotEmpty()
                .WithMessage("Comment content is required.")
                .MaximumLength(2000)
                .WithMessage("Comment content cannot exceed 2000 characters.");
        }
    }
} 