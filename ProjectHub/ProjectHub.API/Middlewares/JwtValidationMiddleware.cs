using Microsoft.AspNetCore.Http;
using ProjectHub.Core.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace ProjectHub.API.Middlewares
{
    public class JwtValidationMiddleware
    {
        private readonly RequestDelegate next;

        public JwtValidationMiddleware(RequestDelegate next)
        {
            this.next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            var jwtService = context.RequestServices.GetRequiredService<IJwtTokenService>();

            var authHeader = context.Request.Headers["Authorization"].ToString();

            if (string.IsNullOrWhiteSpace(authHeader) || !authHeader.StartsWith("Bearer "))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Missing or invalid Authorization header");
                return;
            }            var token = authHeader["Bearer ".Length..].Trim();

            if (!jwtService.ValidateToken(token, out var userId))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Invalid or expired token");
                return;
            }


            var jwtHandler = new System.IdentityModel.Tokens.Jwt.JwtSecurityTokenHandler();
            if (jwtHandler.CanReadToken(token))
            {
                var jwtToken = jwtHandler.ReadJwtToken(token);
                var email = jwtToken.Claims.FirstOrDefault(c => c.Type == "sub" || c.Type == "email")?.Value;
                var name = jwtToken.Claims.FirstOrDefault(c => c.Type == System.Security.Claims.ClaimTypes.Name)?.Value;

                var claims = new List<System.Security.Claims.Claim>();
                if (!string.IsNullOrEmpty(userId))
                    claims.Add(new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, userId));
                if (!string.IsNullOrEmpty(email))
                {
                    claims.Add(new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, email));
                    claims.Add(new System.Security.Claims.Claim("sub", email));
                }
                if (!string.IsNullOrEmpty(name))
                    claims.Add(new System.Security.Claims.Claim("UserName", name));

                var identity = new System.Security.Claims.ClaimsIdentity(claims, "jwt");
                context.User = new System.Security.Claims.ClaimsPrincipal(identity);
            }
            else 
            {
                var claims = new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.NameIdentifier, userId!) };
                var identity = new System.Security.Claims.ClaimsIdentity(claims, "jwt");
                context.User = new System.Security.Claims.ClaimsPrincipal(identity);
            }

            await this.next(context);
        }
    }
}
