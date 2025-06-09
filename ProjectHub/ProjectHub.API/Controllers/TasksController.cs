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
    [Route("api/projects/{projectId}/tasks")]
    public class TasksController : ControllerBase
    {
        private readonly ITaskService _taskService;

        public TasksController(ITaskService taskService)
        {
            _taskService = taskService;
        }

        private string GetCurrentUserId()
        {
            return User.FindFirstValue(ClaimTypes.NameIdentifier) ?? string.Empty;
        }

        [HttpGet]
        public async Task<IActionResult> GetProjectTasks(int projectId, [FromQuery] TaskFilterRequest? filter = null)
        {
            var userId = GetCurrentUserId();
            try
            {
                var tasks = await _taskService.GetProjectTasksAsync(projectId, userId, filter);
                var totalCount = await _taskService.GetTaskCountAsync(projectId, userId, filter);
                
                return Ok(new 
                { 
                    tasks = tasks, 
                    totalCount = totalCount,
                    pageNumber = filter?.PageNumber ?? 1,
                    pageSize = filter?.PageSize ?? 10
                });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpGet("{id}")]
        public async Task<IActionResult> GetTask(int projectId, int id)
        {
            var userId = GetCurrentUserId();
            try
            {
                var task = await _taskService.GetTaskByIdAsync(id, userId);
                if (task == null)
                {
                    return NotFound("Task not found.");
                }
                
                // Verify task belongs to the specified project
                if (task.ProjectId != projectId)
                {
                    return BadRequest("Task does not belong to the specified project.");
                }

                return Ok(task);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception ex)
            {
                return BadRequest(ex.Message);
            }
        }

        [HttpPost]
        public async Task<IActionResult> CreateTask(int projectId, [FromBody] CreateTaskRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            try
            {
                var task = await _taskService.CreateTaskAsync(projectId, request, userId);
                return CreatedAtAction(nameof(GetTask), new { projectId = projectId, id = task.Id }, task);
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
                return StatusCode(500, "An error occurred while creating the task.");
            }
        }

        [HttpPut("{id}")]
        public async Task<IActionResult> UpdateTask(int projectId, int id, [FromBody] UpdateTaskRequest request)
        {
            if (!ModelState.IsValid)
            {
                return BadRequest(ModelState);
            }

            var userId = GetCurrentUserId();
            try
            {
                var task = await _taskService.UpdateTaskAsync(id, request, userId);
                
                // Verify task belongs to the specified project
                if (task.ProjectId != projectId)
                {
                    return BadRequest("Task does not belong to the specified project.");
                }

                return Ok(task);
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
                return StatusCode(500, "An error occurred while updating the task.");
            }
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> DeleteTask(int projectId, int id)
        {
            var userId = GetCurrentUserId();
            try
            {
                await _taskService.DeleteTaskAsync(id, userId);
                return Ok(new { message = "Task deleted successfully." });
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (ArgumentException ex)
            {
                return NotFound(ex.Message);
            }
            catch (Exception)
            {
                return StatusCode(500, "An error occurred while deleting the task.");
            }
        }

        [HttpGet("~/api/tasks/my")]
        public async Task<IActionResult> GetMyTasks()
        {
            var userId = GetCurrentUserId();
            try
            {
                var tasks = await _taskService.GetMyTasksAsync(userId);
                return Ok(tasks);
            }
            catch (ArgumentException ex)
            {
                return BadRequest(ex.Message);
            }
            catch (Exception)
            {
                return StatusCode(500, "An error occurred while retrieving your tasks.");
            }
        }

        [HttpGet("~/api/tasks/statistics/{projectId}")]
        public async Task<IActionResult> GetTaskStatistics(int projectId)
        {
            var userId = GetCurrentUserId();
            try
            {
                // Get task counts by status
                var todoCount = await _taskService.GetTaskCountAsync(projectId, userId, 
                    new TaskFilterRequest { Status = Core.Entities.TaskStatus.Todo });
                var inProgressCount = await _taskService.GetTaskCountAsync(projectId, userId, 
                    new TaskFilterRequest { Status = Core.Entities.TaskStatus.InProgress });
                var inReviewCount = await _taskService.GetTaskCountAsync(projectId, userId, 
                    new TaskFilterRequest { Status = Core.Entities.TaskStatus.InReview });
                var doneCount = await _taskService.GetTaskCountAsync(projectId, userId, 
                    new TaskFilterRequest { Status = Core.Entities.TaskStatus.Done });
                var cancelledCount = await _taskService.GetTaskCountAsync(projectId, userId, 
                    new TaskFilterRequest { Status = Core.Entities.TaskStatus.Cancelled });

                var statistics = new
                {
                    totalTasks = todoCount + inProgressCount + inReviewCount + doneCount + cancelledCount,
                    byStatus = new
                    {
                        todo = todoCount,
                        inProgress = inProgressCount,
                        inReview = inReviewCount,
                        done = doneCount,
                        cancelled = cancelledCount
                    }
                };

                return Ok(statistics);
            }
            catch (UnauthorizedAccessException ex)
            {
                return Forbid(ex.Message);
            }
            catch (Exception)
            {
                return StatusCode(500, "An error occurred while retrieving task statistics.");
            }
        }
    }
}
