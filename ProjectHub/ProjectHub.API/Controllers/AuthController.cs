using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using ProjectHub.Infrastructure.Services;
using System.Text.RegularExpressions;
using Serilog;
using Serilog.Context;

namespace ProjectHub.API.Controllers
{
    [ApiController]
    [Route("api/[controller]")]
    public class AuthController(IUserRepository userRepository, PasswordService passwordService, IJwtTokenService jwtTokenService) : ControllerBase
    {
        private readonly IUserRepository userRepository = userRepository;
        private readonly PasswordService passwordService = passwordService;
        private readonly IJwtTokenService jwtTokenService = jwtTokenService;
        private static readonly Serilog.ILogger _logger = Log.ForContext<AuthController>();

        [HttpPost("register")]
        public async Task<IActionResult> Register([FromBody] RegisterRequest dto)
        {
            using (LogContext.PushProperty("Action", "Register"))
            using (LogContext.PushProperty("Username", dto.Name))
            using (LogContext.PushProperty("Email", dto.Email))
            {
                _logger.Information("User registration attempt started for username: {Username}, email: {Email}", 
                    dto.Name, dto.Email);

                try
                {
                    var existingUser = await this.userRepository.GetByUsernameAsync(dto.Name);
                    if (existingUser != null)
                    {
                        _logger.Warning("Registration failed - username already taken: {Username}", dto.Name);
                        return BadRequest("Username already taken");
                    }

                    var existingEmail = await this.userRepository.GetByEmailAsync(dto.Email);
                    if (existingEmail != null)
                    {
                        _logger.Warning("Registration failed - email already registered: {Email}", dto.Email);
                        return BadRequest("Email already registered");
                    }

                    var passwordValidationResult = ValidatePassword(dto.Password);
                    if (!passwordValidationResult.IsValid)
                    {
                        _logger.Warning("Registration failed - password validation error: {ValidationError} for user: {Username}", 
                            passwordValidationResult.ErrorMessage, dto.Name);
                        return BadRequest(passwordValidationResult.ErrorMessage);
                    }

                    var user = new User
                    {
                        UserName = dto.Name,
                        Email = dto.Email,
                    };

                    user.PasswordHash = this.passwordService.HashPassword(user, dto.Password);

                    await this.userRepository.AddUserAsync(user);
                    await this.userRepository.SaveChangesAsync();

                    _logger.Information("User registration completed successfully for username: {Username}, email: {Email}, userId: {UserId}", 
                        dto.Name, dto.Email, user.UserId);

                    return Ok("User registered successfully");
                }
                catch (Exception ex)
                {
                    _logger.Error(ex, "Unexpected error during user registration for username: {Username}, email: {Email}", 
                        dto.Name, dto.Email);
                    throw; // Re-throw to let the global exception handler deal with it
                }
            }
        }

        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginRequest dto)
        {
            using (LogContext.PushProperty("Action", "Login"))
            using (LogContext.PushProperty("Username", dto.Name))
            {
                _logger.Information("User login attempt started for username: {Username}", dto.Name);

                try
                {
                    var user = await userRepository.GetByUsernameAsync(dto.Name);
                    if (user == null)
                    {
                        _logger.Warning("Login failed - user not found: {Username}", dto.Name);
                        return Unauthorized("Invalid username or password");
                    }

                    using (LogContext.PushProperty("UserId", user.UserId))
                    {
                        if (!passwordService.VerifyPassword(user, user.PasswordHash, dto.Password))
                        {
                            _logger.Warning("Login failed - invalid password for user: {Username}, userId: {UserId}", 
                                dto.Name, user.UserId);
                            return Unauthorized("Invalid username or password");
                        }

                        if (string.IsNullOrWhiteSpace(user.Email))
                        {
                            _logger.Error("Login failed - user has no email for token generation: {Username}, userId: {UserId}", 
                                dto.Name, user.UserId);
                            return BadRequest("User has no associated email for token generation");
                        }

                        var token = jwtTokenService.GenerateToken(user);
                        
                        _logger.Information("User login completed successfully for username: {Username}, userId: {UserId}", 
                            dto.Name, user.UserId);

                        return Ok(new { Token = token });
                    }
                }
                catch (Exception ex)
                {
                    _logger.Error(ex, "Unexpected error during user login for username: {Username}", dto.Name);
                    throw; // Re-throw to let the global exception handler deal with it
                }
            }
        }

        private static (bool IsValid, string ErrorMessage) ValidatePassword(string password)
        {
            _logger.Debug("Password validation started with length: {PasswordLength}", password.Length);

            if (password.Length < 6)
            {
                _logger.Debug("Password validation failed - insufficient length: {PasswordLength}", password.Length);
                return (false, "Password must be at least 6 characters long.");
            }
            if (!Regex.IsMatch(password, @"[A-Z]"))
            {
                _logger.Debug("Password validation failed - no uppercase letter");
                return (false, "Password must contain at least one uppercase letter.");
            }
            if (!Regex.IsMatch(password, @"[a-z]"))
            {
                _logger.Debug("Password validation failed - no lowercase letter");
                return (false, "Password must contain at least one lowercase letter.");
            }
            if (!Regex.IsMatch(password, @"\d"))
            {
                _logger.Debug("Password validation failed - no digit");
                return (false, "Password must contain at least one digit.");
            }
            if (!Regex.IsMatch(password, @"[^a-zA-Z0-9]"))
            {
                _logger.Debug("Password validation failed - no special character");
                return (false, "Password must contain at least one non-alphanumeric character.");
            }

            _logger.Debug("Password validation completed successfully");
            return (true, string.Empty);
        }
    }
}
