using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using System;
using System.Linq;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectHub.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/projects/{projectId}/participants")]
    public class ProjectParticipantsController : ControllerBase
    {
        private readonly IProjectParticipantService _participantService;

        public ProjectParticipantsController(IProjectParticipantService participantService)
        {
            _participantService = participantService;
        }        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }

        [HttpGet]
        public async Task<IActionResult> GetProjectParticipants(int projectId)
        {
            var userId = GetCurrentUserId();
            try
            {
                var participants = await _participantService.GetProjectParticipantsAsync(projectId, userId);
                var participantResponses = participants.Select(p => new ParticipantResponse
                {
                    UserId = p.User.UserId,
                    UserName = p.User.UserName,
                    Email = p.User.Email,
                    Role = p.Role,
                    JoinedAt = p.JoinedAt
                });
                return Ok(participantResponses);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost]
        public async Task<IActionResult> AddParticipant(int projectId, [FromBody] AddParticipantRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            try
            {
                var participant = await _participantService.AddParticipantAsync(projectId, request.UserId, userId, request.Role);
                return Ok(new { message = "Participant added successfully", participantId = participant.Id });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex) when (ex.Message.Contains("not found"))
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex) when (ex.Message.Contains("already a participant"))
            {
                return Conflict(ex.Message);
            }
        }

        [HttpDelete("{participantUserId}")]
        public async Task<IActionResult> RemoveParticipant(int projectId, string participantUserId)
        {
            var userId = GetCurrentUserId();
            try
            {
                // Try to convert participantUserId to Guid if it's a valid Guid
                if (Guid.TryParse(participantUserId, out Guid guidUserId))
                {
                    await _participantService.RemoveParticipantAsync(projectId, guidUserId, userId);
                }
                else
                {
                    return BadRequest("Invalid participant user ID format.");
                }
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex) when (ex.Message.Contains("not found"))
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex) when (ex.Message.Contains("Cannot remove project owner"))
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("{participantUserId}/role")]
        public async Task<IActionResult> UpdateParticipantRole(int projectId, string participantUserId, [FromBody] UpdateParticipantRoleRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            try
            {
                // Try to convert participantUserId to Guid if it's a valid Guid
                if (Guid.TryParse(participantUserId, out Guid guidUserId))
                {
                    await _participantService.UpdateParticipantRoleAsync(projectId, guidUserId, request.NewRole, userId);
                }
                else
                {
                    return BadRequest("Invalid participant user ID format.");
                }
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex) when (ex.Message.Contains("not found"))
            {
                return NotFound(ex.Message);
            }
            catch (Exception ex) when (ex.Message.Contains("Cannot change owner role"))
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("~/api/users/{userId}/projects")]
        public async Task<IActionResult> GetUserProjects(Guid userId)
        {
            var userProjects = await _participantService.GetUserProjectsAsync(userId);
            var projectResponses = userProjects.Select(pp => new
            {
                pp.Project.Id,
                pp.Project.Name,
                pp.Project.Description,
                pp.Role,
                pp.JoinedAt
            });
            return Ok(projectResponses);
        }
    }
} 