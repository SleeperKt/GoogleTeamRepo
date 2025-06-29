using System.Text.Json;
using FluentValidation;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using ProjectHub.Core.DataTransferObjects;
using Serilog;
using Serilog.Context;

namespace ProjectHub.API.Middlewares
{
    /// <summary>
    /// Middleware that provides centralized exception handling and returns
    /// errors in a unified JSON format: { code, message, details }.
    /// Enhanced with structured logging using Serilog.
    /// </summary>
    public class ExceptionHandlingMiddleware
    {
        private readonly RequestDelegate _next;
        private readonly ILogger<ExceptionHandlingMiddleware> _logger;
        private static readonly Serilog.ILogger _serilogLogger = Log.ForContext<ExceptionHandlingMiddleware>();

        public ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
        {
            _next = next;
            _logger = logger;
        }

        public async Task Invoke(HttpContext context)
        {
            var correlationId = Guid.NewGuid().ToString();
            
            using (LogContext.PushProperty("CorrelationId", correlationId))
            using (LogContext.PushProperty("RequestPath", context.Request.Path))
            using (LogContext.PushProperty("RequestMethod", context.Request.Method))
            using (LogContext.PushProperty("UserAgent", context.Request.Headers.UserAgent.FirstOrDefault()))
            {
                try
                {
                    await _next(context);
                }
                catch (ValidationException vex)
                {
                    _serilogLogger.Warning(vex, 
                        "Validation error occurred for {RequestMethod} {RequestPath}. Errors: {@ValidationErrors}",
                        context.Request.Method, 
                        context.Request.Path,
                        vex.Errors.Select(e => new { e.PropertyName, e.ErrorMessage }));
                    
                    var validationErrors = vex.Errors.Select(e => new { e.PropertyName, e.ErrorMessage });
                    await WriteResponseAsync(context, StatusCodes.Status400BadRequest, "VALIDATION_ERROR", "Validation error", validationErrors, correlationId);
                }
                catch (UnauthorizedAccessException uaex)
                {
                    _serilogLogger.Warning(uaex, 
                        "Unauthorized access attempt for {RequestMethod} {RequestPath}. Message: {ErrorMessage}",
                        context.Request.Method, 
                        context.Request.Path,
                        uaex.Message);
                    
                    await WriteResponseAsync(context, StatusCodes.Status401Unauthorized, "UNAUTHORIZED", uaex.Message, null, correlationId);
                }
                catch (KeyNotFoundException knfex)
                {
                    _serilogLogger.Warning(knfex, 
                        "Resource not found for {RequestMethod} {RequestPath}. Message: {ErrorMessage}",
                        context.Request.Method, 
                        context.Request.Path,
                        knfex.Message);
                    
                    await WriteResponseAsync(context, StatusCodes.Status404NotFound, "NOT_FOUND", knfex.Message, null, correlationId);
                }
                catch (ArgumentException argEx)
                {
                    _serilogLogger.Warning(argEx, 
                        "Invalid argument provided for {RequestMethod} {RequestPath}. Parameter: {ParameterName}, Message: {ErrorMessage}",
                        context.Request.Method, 
                        context.Request.Path,
                        argEx.ParamName,
                        argEx.Message);
                    
                    await WriteResponseAsync(context, StatusCodes.Status400BadRequest, "INVALID_ARGUMENT", argEx.Message, null, correlationId);
                }
                catch (InvalidOperationException invOpEx)
                {
                    _serilogLogger.Warning(invOpEx, 
                        "Invalid operation attempted for {RequestMethod} {RequestPath}. Message: {ErrorMessage}",
                        context.Request.Method, 
                        context.Request.Path,
                        invOpEx.Message);
                    
                    await WriteResponseAsync(context, StatusCodes.Status409Conflict, "INVALID_OPERATION", invOpEx.Message, null, correlationId);
                }
                catch (Exception ex)
                {
                    _serilogLogger.Error(ex, 
                        "Unhandled exception occurred for {RequestMethod} {RequestPath}. User: {UserId}",
                        context.Request.Method, 
                        context.Request.Path,
                        context.User?.Identity?.Name ?? "Anonymous");
                    
                    await WriteResponseAsync(context, StatusCodes.Status500InternalServerError, "SERVER_ERROR", "Internal server error", null, correlationId);
                }
            }
        }

        private static async Task WriteResponseAsync(HttpContext context, int statusCode, string code, string message, object? details = null, string? correlationId = null)
        {
            context.Response.ContentType = "application/json";
            context.Response.StatusCode = statusCode;

            // Add correlation ID to response headers for debugging
            if (!string.IsNullOrEmpty(correlationId))
            {
                context.Response.Headers.Append("X-Correlation-ID", correlationId);
            }

            var errorResponse = new ErrorResponse
            {
                Code = code,
                Message = message,
                Details = details
            };

            var options = new JsonSerializerOptions
            {
                PropertyNamingPolicy = JsonNamingPolicy.CamelCase,
                WriteIndented = false
            };

            var json = JsonSerializer.Serialize(errorResponse, options);
            
            _serilogLogger.Debug("Error response generated: {StatusCode} {ErrorCode} for correlation {CorrelationId}", 
                statusCode, code, correlationId);
            
            await context.Response.WriteAsync(json);
        }
    }
} 