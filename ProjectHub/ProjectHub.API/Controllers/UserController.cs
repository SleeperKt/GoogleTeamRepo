using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Core.Interfaces;
using ProjectHub.Core.DataTransferObjects;

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
                user.Email,
                user.Bio
            });
        }

        [Authorize]
        [HttpPut("me")]
        public async Task<IActionResult> UpdateCurrentUser([FromBody] UpdateUserProfileRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var emailClaim = User.FindFirst("sub")?.Value;
            var username = emailClaim ?? User.Identity?.Name;

            if (string.IsNullOrEmpty(username))
                return Unauthorized("No valid user identity in token.");

            var user = await this.userRepository.GetByEmailAsync(username);
            
            if (user is null)
                user = await this.userRepository.GetByUsernameAsync(username);

            if (user is null)
                return NotFound($"User not found with email: {username}");

            // Check if username is already taken by another user
            if (request.UserName != user.UserName)
            {
                var existingUser = await this.userRepository.GetByUsernameAsync(request.UserName);
                if (existingUser != null && existingUser.UserId != user.UserId)
                    return BadRequest("Username is already taken.");
            }

            // Check if email is already taken by another user
            if (request.Email != user.Email)
            {
                var existingUser = await this.userRepository.GetByEmailAsync(request.Email);
                if (existingUser != null && existingUser.UserId != user.UserId)
                    return BadRequest("Email is already taken.");
            }

            // Update user properties
            user.UserName = request.UserName;
            user.Email = request.Email;
            user.Bio = request.Bio;

            await this.userRepository.UpdateUserAsync(user);
            await this.userRepository.SaveChangesAsync();

            return Ok(new
            {
                user.UserId,
                user.UserName,
                user.Email,
                user.Bio
            });
        }
    }
}

