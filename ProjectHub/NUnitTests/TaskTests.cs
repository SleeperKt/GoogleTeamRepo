using NUnitTests.Helpers;
using NUnitTests.TestData;
using NUnitTests.Tools;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

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

            // Create a test task for individual operations
            var createTaskRequest = ProjectRequestFactory.CreateTaskRequest("Test Get Task", "For getting tasks");
            var createTaskResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createTaskRequest, _authToken);
            Assert.IsTrue(createTaskResponse.IsSuccessStatusCode, "Test task creation failed");

            var taskContent = await createTaskResponse.Content.ReadAsStringAsync();
            _testTaskId = JsonHelper.ExtractInt(taskContent, "id");
            Assert.IsNotNull(_testTaskId, "Test task ID not found");
        }

        [Test]
        [TestCaseSource(typeof(ProjectTestData), nameof(ProjectTestData.ValidTasks))]
        public async Task CreateTask_ShouldSucceed(string title, string description, ProjectHub.Core.Entities.TaskStatus status, ProjectHub.Core.Entities.TaskStage stage, int priority)
        {
            var createRequest = ProjectRequestFactory.CreateTaskRequest(title, description, status, stage, priority);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createRequest, _authToken!);
            var responseContent = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Create Task StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Create Task Content: {0}", responseContent);

            Assert.IsTrue(response.IsSuccessStatusCode, "Task creation failed");
            Assert.IsTrue(JsonHelper.HasProperty(responseContent, "id"), "Task should have id");
            Assert.IsTrue(JsonHelper.ContainsValue(responseContent, title), "Task title not found in response");
        }

        [Test]
        public async Task CreateTaskWithLabels_ShouldSucceed()
        {
            var labels = new[] { "bug", "urgent" };
            var createRequest = ProjectRequestFactory.CreateTaskRequest("Task with Labels", "Task description", labels: labels);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createRequest, _authToken!);
            var responseContent = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Create Task with Labels StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Create Task with Labels Content: {0}", responseContent);

            Assert.IsTrue(response.IsSuccessStatusCode, "Task with labels creation failed");
            Assert.IsTrue(JsonHelper.HasProperty(responseContent, "labels"), "Task should have labels");
        }

        [Test]
        public async Task GetProjectTasks_ShouldReturnTasks()
        {
            var response = await ApiClient.GetAsync($"/api/Projects/public/{_testProjectId}/tasks", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Project Tasks StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Project Tasks Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get project tasks failed");
            Assert.IsTrue(JsonHelper.HasProperty(content, "tasks") || content.StartsWith("["), "Response should contain tasks");
        }

        [Test]
        public async Task GetTaskActivities_ShouldReturnActivities()
        {
            var response = await ApiClient.GetAsync($"/api/Tasks/{_testTaskId}/activities", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Task Activities StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Task Activities Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get task activities failed");
            Assert.IsTrue(content.StartsWith("[") || JsonHelper.HasProperty(content, "activities"), "Response should contain activities array");
        }

        [Test]
        public async Task ReorderTasks_ShouldSucceed()
        {
            var reorderRequest = new { taskIds = new[] { _testTaskId } };
            var response = await ApiClient.PutAsync($"/api/Projects/public/{_testProjectId}/tasks/reorder", reorderRequest, _authToken!);

            SerilogLogger.Logger.Information("Reorder Task StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Task reorder failed");
        }

        [Test]
        public async Task IndividualTaskEndpointsNotImplemented_ShouldReturnMethodNotAllowed()
        {
            // Test that individual task GET/PUT/DELETE endpoints return 405 (not implemented)
            var getResponse = await ApiClient.GetAsync($"/api/Tasks/{_testTaskId}", _authToken!);
            SerilogLogger.Logger.Information("Get Task StatusCode: {0}", getResponse.StatusCode);
            Assert.AreEqual(405, (int)getResponse.StatusCode, "Get task endpoint should return 405 (not implemented)");

            var updateRequest = ProjectRequestFactory.UpdateTaskRequest("Updated Title", "Updated description");
            var updateResponse = await ApiClient.PutAsync($"/api/Tasks/{_testTaskId}", updateRequest, _authToken!);
            SerilogLogger.Logger.Information("Update Task StatusCode: {0}", updateResponse.StatusCode);
            Assert.AreEqual(405, (int)updateResponse.StatusCode, "Update task endpoint should return 405 (not implemented)");

            var deleteResponse = await ApiClient.DeleteAsync($"/api/Tasks/{_testTaskId}", _authToken!);
            SerilogLogger.Logger.Information("Delete Task StatusCode: {0}", deleteResponse.StatusCode);
            Assert.AreEqual(405, (int)deleteResponse.StatusCode, "Delete task endpoint should return 405 (not implemented)");
        }

        [OneTimeTearDown]
        public async Task Cleanup()
        {
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