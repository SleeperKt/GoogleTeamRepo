using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Core.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectHub.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/projects/public/{publicId:guid}/activities")]
    public class ProjectActivitiesController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly IProjectService _projectService;

        public ProjectActivitiesController(ITaskService taskService, IProjectService projectService)
        {
            _taskService = taskService;
            _projectService = projectService;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }

        private string GetCurrentUserEmail()
        {
            return User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(System.IdentityModel.Tokens.Jwt.JwtRegisteredClaimNames.Email) ?? string.Empty;
        }

        [HttpGet]
        public async Task<IActionResult> GetProjectActivities(Guid publicId, [FromQuery] int page = 1, [FromQuery] int pageSize = 20, [FromQuery] string? filter = null)
        {
            try
            {
                var userEmail = GetCurrentUserEmail();
                var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
                if (internalId == null)
                    return NotFound("Project not found");
                
                var hasAccess = await _projectService.UserHasAccessAsync(internalId.Value, userEmail);
                if (!hasAccess)
                    return Forbid("Access denied to this project");
                
                var userId = GetCurrentUserId();
                
                // Validate pagination parameters
                if (page < 1) page = 1;
                if (pageSize < 1 || pageSize > 100) pageSize = 20;
                
                var activities = await _taskService.GetProjectActivitiesAsync(internalId.Value, userId, page, pageSize, filter);
                var totalCount = await _taskService.GetProjectActivityCountAsync(internalId.Value, userId, filter);
                
                return Ok(new 
                { 
                    activities = activities,
                    totalCount = totalCount,
                    page = page,
                    pageSize = pageSize,
                    totalPages = (int)Math.Ceiling((double)totalCount / pageSize)
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving project activities: {ex.Message}");
            }
        }
    }
} 