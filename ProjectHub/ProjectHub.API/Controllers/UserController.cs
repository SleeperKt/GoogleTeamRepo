using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Core.Interfaces;

namespace ProjectHub.API.Controllers
{
    [ApiController]
    [Route("api/user")]
    public class UserController(IUserRepository userRepository) : ControllerBase
    {
        private readonly IUserRepository userRepository = userRepository;        [Authorize]
        [HttpGet("me")]
        public async Task<IActionResult> GetCurrentUser()
        {
            var emailClaim = User.FindFirst("sub")?.Value;
            
            var username = emailClaim ?? User.Identity?.Name;

            if (string.IsNullOrEmpty(username))
                return Unauthorized("No valid user identity in token.");

            var user = await this.userRepository.GetByEmailAsync(username);
            
            if (user is null)
                user = await this.userRepository.GetByUsernameAsync(username);

            if (user is null)
                return NotFound($"User not found with email: {username}");

            return Ok(new
            {
                user.UserId,
                user.UserName,
                user.Email
            });
        }
    }
}

