using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using ProjectHub.Infrastructure.Services;

namespace ProjectHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(IUserRepository userRepository, PasswordService passwordService, IJwtTokenService jwtTokenService) : ControllerBase
    {
        private readonly IUserRepository userRepository = userRepository;
        private readonly PasswordService passwordService = passwordService;
        private readonly IJwtTokenService jwtTokenService = jwtTokenService;

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest dto)
        {
            var existingUser = await this.userRepository.GetByUsernameAsync(dto.Name);
            if (existingUser != null)
                return BadRequest("Username already taken");

            var existingEmail = await this.userRepository.GetByEmailAsync(dto.Email);
            if (existingEmail != null)
                return BadRequest("Email already registered");

            var user = new User
            {
                UserName = dto.Name,
                Email = dto.Email,
            };

            user.PasswordHash = this.passwordService.HashPassword(user, dto.Password);

            await this.userRepository.AddUserAsync(user);
            await this.userRepository.SaveChangesAsync();

            return Ok("User registered successfully");
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest dto)
        {
            var user = await userRepository.GetByUsernameAsync(dto.Name);
            if (user == null)
                return Unauthorized("Invalid username or password");

            if (!passwordService.VerifyPassword(user, user.PasswordHash, dto.Password))
                return Unauthorized("Invalid username or password");

            if (string.IsNullOrWhiteSpace(user.Email))
                return BadRequest("User has no associated email for token generation");

            var token = jwtTokenService.GenerateToken(user);
            return Ok(new { Token = token });
        }
    }
}
