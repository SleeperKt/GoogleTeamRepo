using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using ProjectHub.Core.Entities;
using ProjectHub.Core.Interfaces;
using ProjectHub.Core.DataTransferObjects;
using System.Security.Claims;
using System.Threading.Tasks;
using System.IdentityModel.Tokens.Jwt;

namespace ProjectHub.API.Controllers
{
    [Authorize]
    [ApiController]
    [Route("api/[controller]")]
    public class ProjectsController : ControllerBase
    {
        private readonly IProjectService _projectService;

        public ProjectsController(IProjectService projectService)
        {
            _projectService = projectService;
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
            var project = await _projectService.GetProjectByIdAsync(id);
            if (project == null)
            {
                return NotFound();
            }
            // можно проверить, имеет ли текущий пользователь доступ к этому проекту,
            return Ok(project);
        }
        [HttpGet]
        public async Task<IActionResult> GetProjects()
        {
            var userEmail = GetCurrentUserEmail();
            var projects = await _projectService.GetProjectsByOwnerAsync(userEmail);
            return Ok(projects);
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
            return CreatedAtAction(nameof(GetProject), new { id = createdProject.Id }, createdProject);
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
    }
} 