using Microsoft.AspNetCore.Http;
using ProjectHub.Core.DataTransferObjects;
using System.IO;
using System.Text.Json;
using System.Threading.Tasks;

namespace ProjectHub.API.Middlewares
{
    public class RegisterValidationMiddleware
    {
        private readonly RequestDelegate next;

        public RegisterValidationMiddleware(RequestDelegate next)
        {
            this.next = next;
        }

        public async Task InvokeAsync(HttpContext context)
        {
            context.Request.EnableBuffering();

            using var reader = new StreamReader(context.Request.Body, leaveOpen: true);
            var body = await reader.ReadToEndAsync();
            context.Request.Body.Position = 0;

            if (string.IsNullOrWhiteSpace(body))
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Request body is empty");
                return;
            }

            RegisterRequest? dto;
            try
            {
                dto = JsonSerializer.Deserialize<RegisterRequest>(body, new JsonSerializerOptions
                {
                    PropertyNameCaseInsensitive = true
                });
            }
            catch
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Invalid JSON format");
                return;
            }

            if (dto == null || string.IsNullOrWhiteSpace(dto.Name) || string.IsNullOrWhiteSpace(dto.Password))
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Username and password are required");
                return;
            }

            if (dto.Password.Length < 6)
            {
                context.Response.StatusCode = 400;
                await context.Response.WriteAsync("Password must be at least 6 characters long");
                return;
            }

            await this.next(context);
        }
    }
}
