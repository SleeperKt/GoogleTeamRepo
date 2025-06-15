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
    [Route("api/projects/public/{publicId:guid}/tasks/{taskId}/activities")]
    public class TaskActivitiesController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly IProjectService _projectService;

        public TaskActivitiesController(ITaskService taskService, IProjectService projectService)
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
        public async Task<IActionResult> GetTaskActivities(Guid publicId, int taskId)
        {
            try
            {
                var userEmail = GetCurrentUserEmail();
                var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
                if (internalId == null)
                    return NotFound();
                
                var hasAccess = await _projectService.UserHasAccessAsync(internalId.Value, userEmail);
                if (!hasAccess)
                    return Forbid();
                
                var userId = GetCurrentUserId();
                var activities = await _taskService.GetTaskActivitiesAsync(taskId, userId);
                return Ok(activities);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception)
            {
                return StatusCode(500, "An error occurred while retrieving task activities.");
            }
        }
    }
} 