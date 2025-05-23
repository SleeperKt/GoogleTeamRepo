using Microsoft.AspNetCore.Http;
using ProjectHub.Core.Interfaces;
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
            }

            var token = authHeader["Bearer ".Length..].Trim();

            if (!jwtService.ValidateToken(token, out var username))
            {
                context.Response.StatusCode = 401;
                await context.Response.WriteAsync("Invalid or expired token");
                return;
            }

            var claims = new[] { new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, username!) };
            var identity = new System.Security.Claims.ClaimsIdentity(claims, "jwt");
            context.User = new System.Security.Claims.ClaimsPrincipal(identity);

            await this.next(context);
        }
    }
}
