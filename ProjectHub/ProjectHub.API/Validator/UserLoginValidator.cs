using FluentValidation;
using ProjectHub.Core.DataTransferObjects;

namespace ProjectHub.API.Validator
{
    public class UserLoginValidator : AbstractValidator<LoginRequest>
    {
        public UserLoginValidator()
        {
            RuleFor(x => x.Name).NotEmpty();
            RuleFor(x => x.Password).NotEmpty();
        }
    }
}
