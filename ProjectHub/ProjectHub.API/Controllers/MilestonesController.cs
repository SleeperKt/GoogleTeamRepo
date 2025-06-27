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
    [Route("api/projects/public/{publicId:guid}/milestones")]
    public class MilestonesController : ControllerBase
    {
        private readonly IMilestoneService _milestoneService;
        private readonly IProjectService _projectService;

        public MilestonesController(IMilestoneService milestoneService, IProjectService projectService)
        {
            _milestoneService = milestoneService;
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
        public async Task<IActionResult> GetProjectMilestones(Guid publicId)
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
                var milestones = await _milestoneService.GetProjectMilestonesAsync(internalId.Value, userId);
                
                return Ok(milestones);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving milestones: {ex.Message}");
            }
        }

        [HttpGet("{milestoneId:int}")]
        public async Task<IActionResult> GetMilestone(Guid publicId, int milestoneId)
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
                var milestone = await _milestoneService.GetMilestoneByIdAsync(milestoneId, userId);
                
                if (milestone == null)
                    return NotFound("Milestone not found");
                
                return Ok(milestone);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"An error occurred while retrieving the milestone: {ex.Message}");
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateMilestone(Guid publicId, [FromBody] CreateMilestoneRequest request)
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
                var milestone = await _milestoneService.CreateMilestoneAsync(internalId.Value, request, userId);
                
                return CreatedAtAction(nameof(GetMilestone), new { publicId, milestoneId = milestone.Id }, milestone);
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
                return StatusCode(500, $"An error occurred while creating the milestone: {ex.Message}");
            }
        }

        [HttpPut("{milestoneId:int}")]
        public async Task<IActionResult> UpdateMilestone(Guid publicId, int milestoneId, [FromBody] UpdateMilestoneRequest request)
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
                var milestone = await _milestoneService.UpdateMilestoneAsync(milestoneId, request, userId);
                
                return Ok(milestone);
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
                return StatusCode(500, $"An error occurred while updating the milestone: {ex.Message}");
            }
        }

        [HttpDelete("{milestoneId:int}")]
        public async Task<IActionResult> DeleteMilestone(Guid publicId, int milestoneId)
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
                await _milestoneService.DeleteMilestoneAsync(milestoneId, userId);
                
                return NoContent();
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
                return StatusCode(500, $"An error occurred while deleting the milestone: {ex.Message}");
            }
        }
    }
} 