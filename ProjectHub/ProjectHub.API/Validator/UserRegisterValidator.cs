using FluentValidation;
using ProjectHub.Core.Data_Transfer_Objects;

namespace ProjectHub.API.Validator
{
    public class UserRegisterValidator : AbstractValidator<RegisterRequest>
    {
        public UserRegisterValidator()
        {
            RuleFor(x => x.Name).NotEmpty().MinimumLength(3);
            RuleFor(x => x.Email).NotEmpty().EmailAddress();
            RuleFor(x => x.Password).NotEmpty().MinimumLength(6);
        }
    }

}
