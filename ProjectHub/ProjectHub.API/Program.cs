using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjectHub.API.Middlewares;
using ProjectHub.API.Validator;
using ProjectHub.Core.Data_Transfer_Objects;
using ProjectHub.Core.Interfaces;
using ProjectHub.Core.Services;
using ProjectHub.Infrastructure.Data;
using ProjectHub.Infrastructure.Repositories;
using ProjectHub.Infrastructure.Services;
using System.Text;
using System.Text.Json.Serialization;

var builder = WebApplication.CreateBuilder(args);

// DbContext и SQLite
builder.Services.AddDbContext<ApplicationDbContext>(options =>
    options.UseSqlite(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<IUserRepository, UserRepository>();
builder.Services.AddScoped<PasswordService>();
builder.Services.AddScoped<IJwtTokenService, JwtTokenService>();

// Регистрация сервисов и репозиториев для проектов
builder.Services.AddScoped<IProjectRepository, ProjectRepository>();
builder.Services.AddScoped<IProjectService, ProjectService>();

// Регистрация сервисов и репозиториев для участников проектов
builder.Services.AddScoped<IProjectParticipantRepository, ProjectParticipantRepository>();
builder.Services.AddScoped<IProjectParticipantService, ProjectParticipantService>();

builder.Services.AddControllers().AddJsonOptions(options =>
{
    options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.Preserve;
});

builder.Services.AddScoped<IValidator<RegisterRequest>, UserRegisterValidator>();
builder.Services.AddScoped<IValidator<LoginRequest>, UserLoginValidator>();

builder.Services.AddEndpointsApiExplorer();
var jwtKey = builder.Configuration["Jwt:Key"];
if (string.IsNullOrWhiteSpace(jwtKey) || jwtKey.Length < 32)
    throw new InvalidOperationException("JWT secret key must be configured and at least 32 characters long.");
builder.Services.AddSwaggerGen(c =>
{
    c.SwaggerDoc("v1", new() { Title = "Auth API", Version = "v1" });

    c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
    {
        Name = "Authorization",
        Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
        Scheme = "bearer",
        BearerFormat = "JWT",
        In = Microsoft.OpenApi.Models.ParameterLocation.Header,
        Description = "Enter JWT token : }"
    });

    c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
    {
        {
            new Microsoft.OpenApi.Models.OpenApiSecurityScheme
            {
                Reference = new Microsoft.OpenApi.Models.OpenApiReference
                {
                    Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                    Id = "Bearer"
                }
            },
            Array.Empty<string>()
        }
    });
});
builder.Services.AddAuthentication("Bearer")
    .AddJwtBearer("Bearer", options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = builder.Configuration["Jwt:Issuer"],
            ValidAudience = builder.Configuration["Jwt:Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
            Encoding.UTF8.GetBytes(builder.Configuration["Jwt:Key"]!)),
            ClockSkew = TimeSpan.Zero
        };
    });

var app = builder.Build();
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth API V1");
    c.RoutePrefix = string.Empty;
});
app.UseRouting();

// ��������� ����� Middlewares
app.UseWhen(context =>
    context.Request.Path.StartsWithSegments("/api/auth/register") &&
    context.Request.Method == "POST",
    appBuilder => appBuilder.UseMiddleware<RegisterValidationMiddleware>());

app.UseWhen(context =>
    context.Request.Path.StartsWithSegments("/api/auth/login") &&
    context.Request.Method == "POST",
    appBuilder => appBuilder.UseMiddleware<LoginValidationMiddleware>());

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();

app.Run();
