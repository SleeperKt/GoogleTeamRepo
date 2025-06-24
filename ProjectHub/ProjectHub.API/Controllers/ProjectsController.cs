using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using ProjectHub.Core.DataTransferObjects;
using System.Security.Claims;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;
using System.Linq;

namespace ProjectHub.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;
        private readonly ITaskService _taskService;
        private readonly IProjectSettingsService _projectSettingsService;

        public ProjectsController(IProjectService projectService, ITaskService taskService, IProjectSettingsService projectSettingsService)
        {
            _projectService = projectService;
            _taskService = taskService;
            _projectSettingsService = projectSettingsService;
        }
        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }
        
        private string GetCurrentUserEmail()
        {
            return User.FindFirstValue(ClaimTypes.Email) ?? User.FindFirstValue(JwtRegisteredClaimNames.Email) ?? string.Empty;
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetProject(int id)
        {
            var userEmail = GetCurrentUserEmail();
            var hasAccess = await _projectService.UserHasAccessAsync(id, userEmail);
            if (!hasAccess)
            {
                return StatusCode(403);
            }
            var project = await _projectService.GetProjectByIdAsync(id);
            if (project == null)
            {
                return NotFound();
            }
            return Ok(project);
        }
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var userEmail = GetCurrentUserEmail();
            var projects = await _projectService.GetProjectsByUserAsync(userEmail);
            return Ok(projects);
        }

        [HttpGet("public/{publicId:guid}")]
        public async Task<IActionResult> GetProjectByPublicId(Guid publicId)
        {
            var userEmail = GetCurrentUserEmail();
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
                return NotFound();
            var hasAccess = await _projectService.UserHasAccessAsync(internalId.Value, userEmail);
            if (!hasAccess)
                return StatusCode(403);
            var project = await _projectService.GetProjectByPublicIdAsync(publicId);
            return Ok(project);
        }

        [HttpPost]
        public async Task<IActionResult> CreateProject([FromBody] CreateProjectRequest request)
        {            
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }
            
            // Create Project entity from the request
            var project = new Project
            {
                Name = request.Name,
                Description = request.Description,
                Status = request.Status,
                Priority = request.Priority
            };
            
            var userEmail = GetCurrentUserEmail();
            var createdProject = await _projectService.CreateProjectAsync(project, userEmail);
            return CreatedAtAction(nameof(GetProjectByPublicId), new { publicId = createdProject.PublicId }, createdProject);
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateProject(int id, [FromBody] Project project)
        {
            if (id != project.Id)
            {
                return BadRequest("Project ID mismatch.");
            }

            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userEmail = GetCurrentUserEmail();
            try
            {
                await _projectService.UpdateProjectAsync(project, userEmail);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403);
            }
            catch (Exception ex) when (ex.Message.Contains("Project not found")) // TODO: лучше использовать кастомные исключения
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id:int}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var userEmail = GetCurrentUserEmail();
            try
            {
                await _projectService.DeleteProjectAsync(id, userEmail);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403);
            }
            catch (Exception ex) when (ex.Message.Contains("Project not found")) // TODO: аналогично, лучше кастомные исключения
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpGet("public/{publicId:guid}/board")]
        public async Task<IActionResult> GetProjectBoard(Guid publicId)
        {
            var userEmail = GetCurrentUserEmail();
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
                return NotFound();
            var hasAccess = await _projectService.UserHasAccessAsync(internalId.Value, userEmail);
            if (!hasAccess)
                return StatusCode(403);

            // Get workflow stages for the project
            var workflowStages = await _projectSettingsService.GetProjectWorkflowStagesAsync(internalId.Value, userEmail);
            
            // Get all tasks for the project
            var allTasks = await _taskService.GetProjectTasksAsync(internalId.Value, GetCurrentUserId(), null);
            
            // Order workflow stages and build columns dynamically
            var stagesList = workflowStages.OrderBy(s => s.Order).ToList();

            var columns = stagesList.Select((stage, index) => new
            {
                id = $"stage_{stage.Id}",
                title = stage.Name,
                color = stage.Color,
                order = stage.Order,
                isCompleted = stage.IsCompleted,
                stageId = stage.Id,
                // Include tasks whose TaskStatus integer value corresponds to this stage index (index + 1)
                tasks = allTasks.Where(task =>
                {
                    int statusValue = (int)task.Status; // TaskStatus enum values start at 1

                    // Treat values outside the current stages list as belonging to the first stage
                    if (statusValue < 1 || statusValue > stagesList.Count)
                    {
                        return index == 0;
                    }

                    // Match if (statusValue – 1) equals current stage index
                    return (statusValue - 1) == index;
                }).ToArray()
            }).ToArray();

            var boardData = new
            {
                projectId = publicId,
                columns = columns
            };

            return Ok(boardData);
        }

        [HttpDelete("public/{publicId:guid}")]
        public async Task<IActionResult> DeleteProjectByPublicId(Guid publicId)
        {
            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
            {
                return NotFound();
            }

            var userEmail = GetCurrentUserEmail();
            try
            {
                await _projectService.DeleteProjectAsync(internalId.Value, userEmail);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403);
            }
            catch (Exception ex) when (ex.Message.Contains("Project not found"))
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpPut("public/{publicId:guid}")]
        public async Task<IActionResult> UpdateProjectByPublicId(Guid publicId, [FromBody] UpdateProjectRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var internalId = await _projectService.GetInternalIdByPublicIdAsync(publicId);
            if (internalId == null)
            {
                return NotFound();
            }

            var project = await _projectService.GetProjectByIdAsync(internalId.Value);
            if (project == null)
            {
                return NotFound();
            }

            // Update allowed fields
            project.Name = request.Name;
            project.Description = request.Description;
            if (request.Status.HasValue)
                project.Status = request.Status.Value;
            if (request.Priority.HasValue)
                project.Priority = request.Priority.Value;

            var userEmail = GetCurrentUserEmail();
            try
            {
                await _projectService.UpdateProjectAsync(project, userEmail);
            }
            catch (UnauthorizedAccessException)
            {
                return StatusCode(403);
            }
            catch (Exception ex) when (ex.Message.Contains("Project not found"))
            {
                return NotFound();
            }

            return NoContent();
        }
    }
} 