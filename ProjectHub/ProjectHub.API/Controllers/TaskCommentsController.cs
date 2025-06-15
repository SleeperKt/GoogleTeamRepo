using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Interfaces;
using System;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectHub.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/projects/public/{publicId:guid}/tasks/{taskId}/comments")]
    public class TaskCommentsController : ControllerBase
    {
        private readonly ITaskService _taskService;
        private readonly IProjectService _projectService;

        public TaskCommentsController(ITaskService taskService, IProjectService projectService)
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
        public async Task<IActionResult> GetTaskComments(Guid publicId, int taskId)
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
                var comments = await _taskService.GetTaskCommentsAsync(taskId, userId);
                return Ok(comments);
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
                return StatusCode(500, "An error occurred while retrieving task comments.");
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddTaskComment(Guid publicId, int taskId, [FromBody] CreateTaskCommentRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

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
                var comment = await _taskService.AddCommentAsync(taskId, request, userId);
                return CreatedAtAction(nameof(GetTaskComments), new { publicId, taskId }, comment);
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
                return StatusCode(500, "An error occurred while adding the comment.");
            }
        }

        [HttpGet("count")]
        public async Task<IActionResult> GetTaskCommentCount(Guid publicId, int taskId)
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
                var count = await _taskService.GetTaskCommentCountAsync(taskId, userId);
                return Ok(new { count });
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
                return StatusCode(500, "An error occurred while retrieving comment count.");
            }
        }
    }
} 