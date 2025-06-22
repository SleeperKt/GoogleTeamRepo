using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Core.DataTransferObjects;
using ProjectHub.Core.Interfaces;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;

namespace ProjectHub.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/projects/{projectId:int}/settings")]
    public class ProjectSettingsController : ControllerBase
    {
        private readonly IProjectSettingsService _projectSettingsService;
        private readonly IProjectService _projectService;

        public ProjectSettingsController(IProjectSettingsService projectSettingsService, IProjectService projectService)
        {
            _projectSettingsService = projectSettingsService;
            _projectService = projectService;
        }

        private string GetCurrentUserEmail()
        {
            return User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? string.Empty;
        }

        // Project Settings Endpoints
        [HttpGet]
        public async Task<IActionResult> GetProjectSettings(int projectId)
        {
            try
            {
                var settings = await _projectSettingsService.GetProjectSettingsAsync(projectId, GetCurrentUserEmail());
                return Ok(settings);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPut]
        public async Task<IActionResult> UpdateProjectSettings(int projectId, [FromBody] UpdateProjectSettingsRequest request)
        {
            try
            {
                var settings = await _projectSettingsService.UpdateProjectSettingsAsync(projectId, request, GetCurrentUserEmail());
                return Ok(settings);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // Project Labels Endpoints
        [HttpGet("labels")]
        public async Task<IActionResult> GetProjectLabels(int projectId)
        {
            try
            {
                var labels = await _projectSettingsService.GetProjectLabelsAsync(projectId, GetCurrentUserEmail());
                return Ok(labels);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost("labels")]
        public async Task<IActionResult> CreateProjectLabel(int projectId, [FromBody] CreateProjectLabelRequest request)
        {
            try
            {
                var label = await _projectSettingsService.CreateProjectLabelAsync(projectId, request, GetCurrentUserEmail());
                return CreatedAtAction(nameof(GetProjectLabels), new { projectId }, label);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPut("labels/{labelId:int}")]
        public async Task<IActionResult> UpdateProjectLabel(int projectId, int labelId, [FromBody] UpdateProjectLabelRequest request)
        {
            try
            {
                var label = await _projectSettingsService.UpdateProjectLabelAsync(projectId, labelId, request, GetCurrentUserEmail());
                return Ok(label);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("labels/{labelId:int}")]
        public async Task<IActionResult> DeleteProjectLabel(int projectId, int labelId)
        {
            try
            {
                await _projectSettingsService.DeleteProjectLabelAsync(projectId, labelId, GetCurrentUserEmail());
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpPut("labels/reorder")]
        public async Task<IActionResult> ReorderProjectLabels(int projectId, [FromBody] int[] labelIds)
        {
            try
            {
                await _projectSettingsService.ReorderProjectLabelsAsync(projectId, labelIds, GetCurrentUserEmail());
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // Project Workflow Endpoints
        [HttpGet("workflow")]
        public async Task<IActionResult> GetProjectWorkflowStages(int projectId)
        {
            try
            {
                var stages = await _projectSettingsService.GetProjectWorkflowStagesAsync(projectId, GetCurrentUserEmail());
                return Ok(stages);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPost("workflow")]
        public async Task<IActionResult> CreateWorkflowStage(int projectId, [FromBody] CreateWorkflowStageRequest request)
        {
            try
            {
                var stage = await _projectSettingsService.CreateWorkflowStageAsync(projectId, request, GetCurrentUserEmail());
                return CreatedAtAction(nameof(GetProjectWorkflowStages), new { projectId }, stage);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        [HttpPut("workflow/{stageId:int}")]
        public async Task<IActionResult> UpdateWorkflowStage(int projectId, int stageId, [FromBody] UpdateWorkflowStageRequest request)
        {
            try
            {
                var stage = await _projectSettingsService.UpdateWorkflowStageAsync(projectId, stageId, request, GetCurrentUserEmail());
                return Ok(stage);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
        }

        [HttpDelete("workflow/{stageId:int}")]
        public async Task<IActionResult> DeleteWorkflowStage(int projectId, int stageId)
        {
            try
            {
                await _projectSettingsService.DeleteWorkflowStageAsync(projectId, stageId, GetCurrentUserEmail());
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (InvalidOperationException ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPut("workflow/reorder")]
        public async Task<IActionResult> ReorderWorkflowStages(int projectId, [FromBody] ReorderWorkflowStagesRequest request)
        {
            try
            {
                await _projectSettingsService.ReorderWorkflowStagesAsync(projectId, request, GetCurrentUserEmail());
                return NoContent();
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
            }
        }

        // Public ID route variants
        [HttpGet("~/api/projects/public/{publicId:guid}/settings")]
        public async Task<IActionResult> GetProjectSettingsByPublicId(Guid publicId)
        {
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
                return NotFound();

            return await GetProjectSettings(internalId.Value);
        }

        [HttpPut("~/api/projects/public/{publicId:guid}/settings")]
        public async Task<IActionResult> UpdateProjectSettingsByPublicId(Guid publicId, [FromBody] UpdateProjectSettingsRequest request)
        {
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
                return NotFound();

            return await UpdateProjectSettings(internalId.Value, request);
        }

        [HttpGet("~/api/projects/public/{publicId:guid}/settings/labels")]
        public async Task<IActionResult> GetProjectLabelsByPublicId(Guid publicId)
        {
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
                return NotFound();

            return await GetProjectLabels(internalId.Value);
        }

        [HttpGet("~/api/projects/public/{publicId:guid}/settings/workflow")]
        public async Task<IActionResult> GetProjectWorkflowStagesByPublicId(Guid publicId)
        {
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
                return NotFound();

            return await GetProjectWorkflowStages(internalId.Value);
        }

        [HttpPost("~/api/projects/public/{publicId:guid}/settings/workflow")]
        public async Task<IActionResult> CreateWorkflowStageByPublicId(Guid publicId, [FromBody] CreateWorkflowStageRequest request)
        {
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
                return NotFound();

            return await CreateWorkflowStage(internalId.Value, request);
        }

        [HttpPut("~/api/projects/public/{publicId:guid}/settings/workflow/{stageId:int}")]
        public async Task<IActionResult> UpdateWorkflowStageByPublicId(Guid publicId, int stageId, [FromBody] UpdateWorkflowStageRequest request)
        {
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
                return NotFound();

            return await UpdateWorkflowStage(internalId.Value, stageId, request);
        }

        [HttpDelete("~/api/projects/public/{publicId:guid}/settings/workflow/{stageId:int}")]
        public async Task<IActionResult> DeleteWorkflowStageByPublicId(Guid publicId, int stageId)
        {
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
                return NotFound();

            return await DeleteWorkflowStage(internalId.Value, stageId);
        }

        [HttpPut("~/api/projects/public/{publicId:guid}/settings/workflow/reorder")]
        public async Task<IActionResult> ReorderWorkflowStagesByPublicId(Guid publicId, [FromBody] ReorderWorkflowStagesRequest request)
        {
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
                return NotFound();

            return await ReorderWorkflowStages(internalId.Value, request);
        }
    }
} 