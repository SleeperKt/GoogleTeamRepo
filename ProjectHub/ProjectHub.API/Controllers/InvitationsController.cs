using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using System.Security.Claims;
using System.Threading.Tasks;

namespace ProjectHub.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class InvitationsController : ControllerBase
    {
        private readonly IProjectInvitationService _invitationService;

        public InvitationsController(IProjectInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }

        // GET: api/invitations/received
        [HttpGet("received")]
        public async Task<IActionResult> GetReceivedInvitations([FromQuery] InvitationStatus? status = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"DEBUG: GetReceivedInvitations - UserId: {userId}, Status: {status}");
                var invitations = await _invitationService.GetUserInvitationsAsync(userId, status);
                Console.WriteLine($"DEBUG: GetReceivedInvitations - Found {invitations?.Count() ?? 0} invitations");
                return Ok(invitations);
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"DEBUG: GetReceivedInvitations - ArgumentException: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DEBUG: GetReceivedInvitations - Exception: {ex.Message}");
                return StatusCode(500, ex.Message);
            }
        }

        // GET: api/invitations/sent
        [HttpGet("sent")]
        public async Task<IActionResult> GetSentInvitations([FromQuery] InvitationStatus? status = null)
        {
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"DEBUG: GetSentInvitations - UserId: {userId}, Status: {status}");
                var invitations = await _invitationService.GetSentInvitationsAsync(userId, status);
                Console.WriteLine($"DEBUG: GetSentInvitations - Found {invitations?.Count() ?? 0} invitations");
                return Ok(invitations);
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"DEBUG: GetSentInvitations - ArgumentException: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DEBUG: GetSentInvitations - Exception: {ex.Message}");
                return StatusCode(500, ex.Message);
            }
        }

        // GET: api/invitations/{id}
        [HttpGet("{id}")]
        public async Task<IActionResult> GetInvitation(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                var invitation = await _invitationService.GetInvitationDetailsAsync(id, userId);
                
                if (invitation == null)
                {
                    return NotFound();
                }
                
                return Ok(invitation);
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // POST: api/invitations/{id}/respond
        [HttpPost("{id}/respond")]
        public async Task<IActionResult> RespondToInvitation(int id, [FromBody] RespondToInvitationRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            try
            {
                var userId = GetCurrentUserId();
                var invitation = await _invitationService.RespondToInvitationAsync(id, request.Status, userId);
                return Ok(new { message = "Invitation response recorded successfully", invitation });
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        // DELETE: api/invitations/{id}/cancel
        [HttpDelete("{id}/cancel")]
        public async Task<IActionResult> CancelInvitation(int id)
        {
            try
            {
                var userId = GetCurrentUserId();
                await _invitationService.CancelInvitationAsync(id, userId);
                return NoContent();
            }
            catch (UnauthorizedAccessException ex)
            {
                return StatusCode(403, ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
        }
    }

    // Project-specific invitation endpoints
    [Authorize]
    [ApiController]
    [Route("api/projects/{projectId}/invitations")]
    public class ProjectInvitationsController : ControllerBase
    {
        private readonly IProjectInvitationService _invitationService;

        public ProjectInvitationsController(IProjectInvitationService invitationService)
        {
            _invitationService = invitationService;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }

        // GET: api/projects/{projectId}/invitations
        [HttpGet]
        public async Task<IActionResult> GetProjectInvitations(int projectId)
        {
            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"DEBUG: GetProjectInvitations - ProjectId: {projectId}, UserId: {userId}");
                var invitations = await _invitationService.GetProjectInvitationsAsync(projectId, userId);
                Console.WriteLine($"DEBUG: GetProjectInvitations - Found {invitations?.Count() ?? 0} invitations");
                return Ok(invitations);
            }
            catch (UnauthorizedAccessException ex)
            {
                Console.WriteLine($"DEBUG: GetProjectInvitations - UnauthorizedAccessException: {ex.Message}");
                return StatusCode(403, ex.Message);
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"DEBUG: GetProjectInvitations - ArgumentException: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DEBUG: GetProjectInvitations - Exception: {ex.Message}");
                return StatusCode(500, ex.Message);
            }
        }

        // POST: api/projects/{projectId}/invitations
        [HttpPost]
        public async Task<IActionResult> CreateInvitation(int projectId, [FromBody] CreateInvitationRequest request)
        {
            if (!ModelState.IsValid)
            {
                Console.WriteLine("DEBUG: CreateInvitation - Invalid ModelState");
                return BadRequest(ModelState);
            }

            try
            {
                var userId = GetCurrentUserId();
                Console.WriteLine($"DEBUG: CreateInvitation - ProjectId: {projectId}, UserId: {userId}, InviteeEmail: {request.InviteeEmail}, Role: {request.Role}");
                var invitation = await _invitationService.CreateInvitationAsync(projectId, request, userId);
                Console.WriteLine($"DEBUG: CreateInvitation - Success, InvitationId: {invitation.Id}");
                return CreatedAtAction(
                    nameof(InvitationsController.GetInvitation), 
                    "Invitations",
                    new { id = invitation.Id }, 
                    new { message = "Invitation sent successfully", invitationId = invitation.Id });
            }
            catch (UnauthorizedAccessException ex)
            {
                Console.WriteLine($"DEBUG: CreateInvitation - UnauthorizedAccessException: {ex.Message}");
                return StatusCode(403, ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                Console.WriteLine($"DEBUG: CreateInvitation - InvalidOperationException: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (ArgumentException ex)
            {
                Console.WriteLine($"DEBUG: CreateInvitation - ArgumentException: {ex.Message}");
                return BadRequest(ex.Message);
            }
            catch (Exception ex)
            {
                Console.WriteLine($"DEBUG: CreateInvitation - Exception: {ex.Message}");
                return StatusCode(500, ex.Message);
            }
        }
    }
} 