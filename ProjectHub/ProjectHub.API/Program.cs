using FluentValidation;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using ProjectHub.API.Middlewares;
using ProjectHub.API.Validator;
using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Interfaces;
using ProjectHub.Core.Services;
using ProjectHub.Infrastructure.Data;
using ProjectHub.Infrastructure.Repositories;
using ProjectHub.Infrastructure.Services;
using System.Text;
using System.Text.Json.Serialization;
using Serilog;

// Early initialization of Serilog
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .CreateBootstrapLogger();

try
{
    Log.Information("Starting ProjectHub API application");

    var builder = WebApplication.CreateBuilder(args);

    // Configure Serilog
    builder.Host.UseSerilog((context, services, configuration) =>
        configuration.ReadFrom.Configuration(context.Configuration)
                     .ReadFrom.Services(services)
                     .Enrich.FromLogContext());

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

    // Регистрация сервисов и репозиториев для задач
    builder.Services.AddScoped<ITaskRepository, TaskRepository>();
    builder.Services.AddScoped<ITaskService, TaskService>();

    // Регистрация сервисов и репозиториев для комментариев и активности задач
    builder.Services.AddScoped<ITaskCommentRepository, TaskCommentRepository>();
    builder.Services.AddScoped<ITaskActivityRepository, TaskActivityRepository>();

    // Регистрация сервисов и репозиториев для настроек проектов
    builder.Services.AddScoped<IProjectSettingsRepository, ProjectSettingsRepository>();
    builder.Services.AddScoped<IProjectLabelRepository, ProjectLabelRepository>();
    builder.Services.AddScoped<IProjectWorkflowRepository, ProjectWorkflowRepository>();
    builder.Services.AddScoped<IProjectSettingsService, ProjectSettingsService>();

    // Регистрация сервисов и репозиториев для приглашений
    builder.Services.AddScoped<IProjectInvitationRepository, ProjectInvitationRepository>();
    builder.Services.AddScoped<IProjectInvitationService, ProjectInvitationService>();

    builder.Services.AddControllers().AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.ReferenceHandler = ReferenceHandler.IgnoreCycles;
    });

    builder.Services.AddScoped<IValidator<RegisterRequest>, UserRegisterValidator>();
    builder.Services.AddScoped<IValidator<LoginRequest>, UserLoginValidator>();
    builder.Services.AddScoped<IValidator<CreateTaskRequest>, CreateTaskRequestValidator>();
    builder.Services.AddScoped<IValidator<UpdateTaskRequest>, UpdateTaskRequestValidator>();
    builder.Services.AddScoped<IValidator<TaskReorderRequest>, TaskReorderRequestValidator>();
    builder.Services.AddScoped<IValidator<CreateTaskCommentRequest>, CreateTaskCommentRequestValidator>();

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
            Description = "Enter JWT token :"
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

    builder.Services.AddCors(options =>
    {
        options.AddPolicy("Frontend", policy =>
        {
            policy.WithOrigins("http://localhost:3000")
                  .AllowAnyHeader()
                  .AllowAnyMethod()
                  .AllowCredentials();
        });
    });

    var app = builder.Build();

    // Configure Serilog request logging
    app.UseSerilogRequestLogging(options =>
    {
        options.MessageTemplate = "HTTP {RequestMethod} {RequestPath} responded {StatusCode} in {Elapsed:0.0000} ms";
        options.GetLevel = (httpContext, elapsed, ex) => ex != null
            ? Serilog.Events.LogEventLevel.Error
            : httpContext.Response.StatusCode > 499
                ? Serilog.Events.LogEventLevel.Error
                : Serilog.Events.LogEventLevel.Information;
        options.EnrichDiagnosticContext = (diagnosticContext, httpContext) =>
        {
            diagnosticContext.Set("RequestHost", httpContext.Request.Host.Value);
            diagnosticContext.Set("RequestScheme", httpContext.Request.Scheme);
            diagnosticContext.Set("UserAgent", httpContext.Request.Headers.UserAgent.FirstOrDefault());
        };
    });

    // Apply pending migrations in Development and Docker environments
    if (app.Environment.IsDevelopment() || app.Environment.EnvironmentName == "Docker")
    {
        using var scope = app.Services.CreateScope();
        var context = scope.ServiceProvider.GetRequiredService<ApplicationDbContext>();
        context.Database.Migrate();
        Log.Information("Database migrations applied successfully.");
    }

    // Expose Swagger UI in Development and Docker environments
    if (app.Environment.IsDevelopment() || app.Environment.EnvironmentName == "Docker")
    {
        app.UseSwagger();
        app.UseSwaggerUI(c =>
        {
            c.SwaggerEndpoint("/swagger/v1/swagger.json", "Auth API V1");
            c.RoutePrefix = "swagger";
        });

        Log.Information("Swagger UI enabled at /swagger");
    }

    app.UseRouting();

    // Register global exception handler
    app.UseMiddleware<ExceptionHandlingMiddleware>();

    app.UseCors("Frontend");

    // Use Middlewares
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

    Log.Information("ProjectHub API application started successfully");
    app.Run();
}
catch (Exception ex)
{
    Log.Fatal(ex, "ProjectHub API application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
