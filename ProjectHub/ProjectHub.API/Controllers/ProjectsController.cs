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

        public ProjectsController(IProjectService projectService, ITaskService taskService)
        {
            _projectService = projectService;
            _taskService = taskService;
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
                return Forbid();
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
            var projects = await _projectService.GetProjectsByOwnerAsync(userEmail);
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
                return Forbid();
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
                Description = request.Description
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
                return Forbid();
            }
            catch (Exception ex) when (ex.Message.Contains("Project not found")) // TODO: лучше использовать кастомные исключения
            {
                return NotFound();
            }

            return NoContent();
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteProject(int id)
        {
            var userEmail = GetCurrentUserEmail();
            try
            {
                await _projectService.DeleteProjectAsync(id, userEmail);
            }
            catch (UnauthorizedAccessException)
            {
                return Forbid();
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
                return Forbid();

            // Get all tasks for the project organized by status
            var allTasks = await _taskService.GetProjectTasksAsync(internalId.Value, GetCurrentUserId(), null);
            
            var boardData = new
            {
                projectId = publicId,
                columns = new[]
                {
                    new { 
                        id = "todo", 
                        title = "To Do", 
                        status = Core.Entities.TaskStatus.Todo,
                        tasks = allTasks.Where(t => t.Status == Core.Entities.TaskStatus.Todo).ToArray()
                    },
                    new { 
                        id = "inprogress", 
                        title = "In Progress", 
                        status = Core.Entities.TaskStatus.InProgress,
                        tasks = allTasks.Where(t => t.Status == Core.Entities.TaskStatus.InProgress).ToArray()
                    },
                    new { 
                        id = "inreview", 
                        title = "In Review", 
                        status = Core.Entities.TaskStatus.InReview,
                        tasks = allTasks.Where(t => t.Status == Core.Entities.TaskStatus.InReview).ToArray()
                    },
                    new { 
                        id = "done", 
                        title = "Done", 
                        status = Core.Entities.TaskStatus.Done,
                        tasks = allTasks.Where(t => t.Status == Core.Entities.TaskStatus.Done).ToArray()
                    }
                }
            };

            return Ok(boardData);
        }
    }
} 