using Microsoft.Extensions.Configuration;
using Microsoft.IdentityModel.Tokens;
using ProjectHub.Core.Interfaces;
using System;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;
using System.Security.Claims;
using System.Text;

namespace ProjectHub.Infrastructure.Services
{
    public class JwtTokenService : IJwtTokenService
    {
        private readonly string secret;
        private readonly int expiryMinutes;
        private readonly string issuer;
        private readonly string audience;

        public JwtTokenService(IConfiguration config)
        {
            this.secret = config["Jwt:Key"] ?? throw new ArgumentNullException("Jwt:Key must be set in configuration.");
            if (secret.Length < 32)
                throw new ArgumentException("JWT secret key must be at least 32 characters long.");

            this.issuer = config["Jwt:Issuer"] ?? throw new ArgumentNullException("Jwt:Issuer must be set in configuration.");
            this.audience = config["Jwt:Audience"] ?? throw new ArgumentNullException("Jwt:Audience must be set in configuration.");
            this.expiryMinutes = int.Parse(config["Jwt:TokenExpirationInMinutes"] ?? "60");
        }

        public string GenerateToken(string email)
        {
            if (string.IsNullOrWhiteSpace(email))
                throw new ArgumentException("Email must be provided to generate token.");

            var claims = new[]
            {
                new Claim(JwtRegisteredClaimNames.Sub, email),
                new Claim(JwtRegisteredClaimNames.Email, email),
                new Claim(ClaimTypes.NameIdentifier, email),
                new Claim(ClaimTypes.Name, email),
                new Claim(JwtRegisteredClaimNames.Iat, DateTimeOffset.UtcNow.ToUnixTimeSeconds().ToString(), ClaimValueTypes.Integer64)
            };

            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: issuer,
                audience: audience,
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(expiryMinutes),
                signingCredentials: creds);

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public bool ValidateToken(string token, out string? email)
        {
            email = null;

            var tokenHandler = new JwtSecurityTokenHandler();
            var key = Encoding.UTF8.GetBytes(secret);

            try
            {
                var validationParams = new TokenValidationParameters
                {
                    ValidateIssuer = true,
                    ValidateAudience = true,
                    ValidIssuer = issuer,
                    ValidAudience = audience,
                    ValidateIssuerSigningKey = true,
                    IssuerSigningKey = new SymmetricSecurityKey(key),
                    ClockSkew = TimeSpan.Zero
                };

                var principal = tokenHandler.ValidateToken(token, validationParams, out SecurityToken validatedToken);

                email = principal.Claims.FirstOrDefault(x => x.Type == ClaimTypes.NameIdentifier)?.Value;
                return true;
            }
            catch
            {
                return false;
            }
        }
    }
}