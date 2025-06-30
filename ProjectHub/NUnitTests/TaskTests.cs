using NUnitTests.Helpers;
using NUnitTests.TestData;
using NUnitTests.Tools;
using NUnit.Framework;
using System;
using System.Threading.Tasks;
using ProjectHub.Core.Entities;

namespace NUnitTests
{
    [TestFixture]
    public class TaskTests
    {
        private string? _authToken;
        private Guid? _testProjectId;
        private int? _testTaskId;

        [OneTimeSetUp]
        public async Task Setup()
        {
            // Register and login a test user
            var registerRequest = UserRequestFactory.CreateRegisterRequest("TaskTestUser", "tasktest@example.com", "Password123!");
            var registerResponse = await ApiClient.PostAsync("/api/Auth/register", registerRequest);
            Assert.IsTrue(registerResponse.IsSuccessStatusCode, "User registration failed");

            var loginRequest = UserRequestFactory.CreateLoginRequest("TaskTestUser", "Password123!");
            var loginResponse = await ApiClient.PostAsync("/api/Auth/login", loginRequest);
            Assert.IsTrue(loginResponse.IsSuccessStatusCode, "User login failed");

            var loginContent = await loginResponse.Content.ReadAsStringAsync();
            _authToken = JsonHelper.ExtractToken(loginContent);
            Assert.IsNotNull(_authToken, "Auth token not found");

            // Create a test project for task operations
            var createProjectRequest = ProjectRequestFactory.CreateProjectRequest("Task Test Project", "For task testing");
            var createProjectResponse = await ApiClient.PostAsync("/api/Projects", createProjectRequest, _authToken);
            Assert.IsTrue(createProjectResponse.IsSuccessStatusCode, "Test project creation failed");

            var projectContent = await createProjectResponse.Content.ReadAsStringAsync();
            _testProjectId = JsonHelper.ExtractGuid(projectContent, "publicId");
            Assert.IsNotNull(_testProjectId, "Test project ID not found");
        }

        [Test]
        [TestCaseSource(typeof(ProjectTestData), nameof(ProjectTestData.ValidTasks))]
        public async Task CreateTask_ShouldSucceed(string title, string description, ProjectHub.Core.Entities.TaskStatus status, TaskStage stage, int priority)
        {
            var createRequest = ProjectRequestFactory.CreateTaskRequest(title, description, null, status, stage, null, null, priority);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createRequest, _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Create Task StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Create Task Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Task creation failed");
            Assert.IsTrue(JsonHelper.HasProperty(content, "id"), "Task should have id");
            Assert.IsTrue(JsonHelper.ContainsValue(content, title), $"Task title '{title}' not found in response");

            // Store the task ID for cleanup
            _testTaskId = JsonHelper.ExtractInt(content, "id");
        }

        [Test]
        public async Task CreateTaskWithLabels_ShouldSucceed()
        {
            var labels = new string[] { "bug", "urgent" };
            var createRequest = ProjectRequestFactory.CreateTaskRequest("Task with Labels", "Task description", null, ProjectHub.Core.Entities.TaskStatus.Todo, TaskStage.Planning, null, null, 1, "task", labels);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createRequest, _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Create Task with Labels StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Create Task with Labels Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Task creation with labels failed");
            Assert.IsTrue(JsonHelper.HasProperty(content, "labels"), "Task should have labels property");
        }

        [Test]
        public async Task GetProjectTasks_ShouldReturnTasks()
        {
            // First create a task
            var createRequest = ProjectRequestFactory.CreateTaskRequest("Test Get Task", "For getting tasks");
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Task creation failed");

            // Get all tasks for the project
            var response = await ApiClient.GetAsync($"/api/Projects/public/{_testProjectId}/tasks", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Project Tasks StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Project Tasks Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get project tasks failed");
            Assert.IsTrue(JsonHelper.HasProperty(content, "tasks"), "Response should have tasks property");
            Assert.IsTrue(JsonHelper.HasProperty(content, "totalCount"), "Response should have totalCount property");
        }

        [Test]
        public async Task GetTask_ShouldReturnTask()
        {
            // First create a task
            var createRequest = ProjectRequestFactory.CreateTaskRequest("Test Get Single Task", "For getting single task");
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Task creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var taskId = JsonHelper.ExtractInt(createContent, "id");
            Assert.IsNotNull(taskId, "Task ID not found");

            // Get the specific task
            var response = await ApiClient.GetAsync($"/api/Projects/public/{_testProjectId}/tasks/{taskId}", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Task StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Task Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get task failed");
            Assert.IsTrue(JsonHelper.ContainsValue(content, "Test Get Single Task"), "Task title not found in response");
        }

        [Test]
        public async Task UpdateTask_ShouldSucceed()
        {
            // First create a task
            var createRequest = ProjectRequestFactory.CreateTaskRequest("Original Task Title", "Original description");
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Task creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var taskId = JsonHelper.ExtractInt(createContent, "id");
            Assert.IsNotNull(taskId, "Task ID not found");

            // Update the task
            var updateRequest = ProjectRequestFactory.UpdateTaskRequest("Updated Task Title", "Updated description", null, ProjectHub.Core.Entities.TaskStatus.InProgress, TaskStage.Development, null, null, 2);
            var response = await ApiClient.PutAsync($"/api/Projects/public/{_testProjectId}/tasks/{taskId}", updateRequest, _authToken!);

            SerilogLogger.Logger.Information("Update Task StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Task update failed");

            // Verify the update
            var getResponse = await ApiClient.GetAsync($"/api/Projects/public/{_testProjectId}/tasks/{taskId}", _authToken!);
            var getContent = await getResponse.Content.ReadAsStringAsync();

            Assert.IsTrue(getResponse.IsSuccessStatusCode, "Get updated task failed");
            Assert.IsTrue(JsonHelper.ContainsValue(getContent, "Updated Task Title"), "Updated task title not found");
            Assert.IsTrue(JsonHelper.ContainsValue(getContent, "Updated description"), "Updated task description not found");
        }

        [Test]
        public async Task DeleteTask_ShouldSucceed()
        {
            // First create a task
            var createRequest = ProjectRequestFactory.CreateTaskRequest("Task to Delete", "Will be deleted");
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Task creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var taskId = JsonHelper.ExtractInt(createContent, "id");
            Assert.IsNotNull(taskId, "Task ID not found");

            // Delete the task
            var response = await ApiClient.DeleteAsync($"/api/Projects/public/{_testProjectId}/tasks/{taskId}", _authToken!);

            SerilogLogger.Logger.Information("Delete Task StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Task deletion failed");

            // Verify the task is deleted
            var getResponse = await ApiClient.GetAsync($"/api/Projects/public/{_testProjectId}/tasks/{taskId}", _authToken!);
            Assert.AreEqual(404, (int)getResponse.StatusCode, "Task should not exist after deletion");
        }

        [Test]
        public async Task ReorderTasks_ShouldSucceed()
        {
            // First create a task
            var createRequest = ProjectRequestFactory.CreateTaskRequest("Task to Reorder", "For reordering test");
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Task creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var taskId = JsonHelper.ExtractInt(createContent, "id");
            Assert.IsNotNull(taskId, "Task ID not found");

            // Reorder the task
            var reorderRequest = new { status = 1, position = 1.5 };
            var response = await ApiClient.PutAsync($"/api/Projects/public/{_testProjectId}/tasks/{taskId}/reorder", reorderRequest, _authToken!);

            SerilogLogger.Logger.Information("Reorder Task StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Task reordering failed");
        }

        [Test]
        public async Task GetTaskActivities_ShouldReturnActivities()
        {
            // First create a task
            var createRequest = ProjectRequestFactory.CreateTaskRequest("Task for Activities", "For activity testing");
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Task creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var taskId = JsonHelper.ExtractInt(createContent, "id");
            Assert.IsNotNull(taskId, "Task ID not found");

            // Get task activities
            var response = await ApiClient.GetAsync($"/api/Projects/public/{_testProjectId}/tasks/{taskId}/activities", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Task Activities StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Task Activities Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get task activities failed");
            Assert.IsTrue(content.StartsWith("[") || JsonHelper.HasProperty(content, "activities"), "Response should contain activities array");
        }

        [OneTimeTearDown]
        public async Task Cleanup()
        {
            // Clean up test task if it exists
            if (_testTaskId.HasValue && _testProjectId.HasValue)
            {
                try
                {
                    await ApiClient.DeleteAsync($"/api/Projects/public/{_testProjectId.Value}/tasks/{_testTaskId.Value}", _authToken!);
                }
                catch
                {
                    // Ignore cleanup errors
                }
            }

            // Clean up test project if it exists
            if (_testProjectId.HasValue)
            {
                try
                {
                    await ApiClient.DeleteAsync($"/api/Projects/public/{_testProjectId.Value}", _authToken!);
                }
                catch
                {
                    // Ignore cleanup errors
                }
            }
        }
    }
} 