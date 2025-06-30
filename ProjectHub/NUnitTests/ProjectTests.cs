using NUnitTests.Helpers;
using NUnitTests.TestData;
using NUnitTests.Tools;
using NUnit.Framework;
using System.Threading.Tasks;
using ProjectHub.Core.Entities;

namespace NUnitTests
{
    [TestFixture]
    public class ProjectTests
    {
        private string? _authToken;
        private Guid? _testProjectId;

        [OneTimeSetUp]
        public async Task Setup()
        {
            // Register and login a test user
            var registerRequest = UserRequestFactory.CreateRegisterRequest("ProjectTestUser", "projecttest@example.com", "Password123!");
            var registerResponse = await ApiClient.PostAsync("/api/Auth/register", registerRequest);
            Assert.IsTrue(registerResponse.IsSuccessStatusCode, "User registration failed");

            var loginRequest = UserRequestFactory.CreateLoginRequest("ProjectTestUser", "Password123!");
            var loginResponse = await ApiClient.PostAsync("/api/Auth/login", loginRequest);
            Assert.IsTrue(loginResponse.IsSuccessStatusCode, "User login failed");

            var loginContent = await loginResponse.Content.ReadAsStringAsync();
            _authToken = JsonHelper.ExtractToken(loginContent);
            Assert.IsNotNull(_authToken, "Auth token not found");
        }

        [Test]
        [TestCaseSource(typeof(ProjectTestData), nameof(ProjectTestData.ValidProjects))]
        public async Task CreateProject_ShouldSucceed(string name, string description, ProjectStatus status, ProjectPriority priority)
        {
            var createRequest = ProjectRequestFactory.CreateProjectRequest(name, description, status, priority);
            var response = await ApiClient.PostAsync("/api/Projects", createRequest, _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Create Project StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Create Project Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Project creation failed");
            Assert.IsTrue(JsonHelper.HasProperty(content, "publicId"), "Project should have publicId");
            Assert.IsTrue(JsonHelper.ContainsValue(content, name), $"Project name '{name}' not found in response");

            // Store the project ID for cleanup
            _testProjectId = JsonHelper.ExtractGuid(content, "publicId");
        }

        [Test]
        public async Task GetProjects_ShouldReturnUserProjects()
        {
            var response = await ApiClient.GetAsync("/api/Projects", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Projects StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Projects Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get projects failed");
            Assert.IsTrue(content.Contains("projects") || content.StartsWith("["), "Response should contain projects array");
        }

        [Test]
        public async Task GetProjectByPublicId_ShouldReturnProject()
        {
            // First create a project
            var createRequest = ProjectRequestFactory.CreateProjectRequest("Test Get Project", "Test description");
            var createResponse = await ApiClient.PostAsync("/api/Projects", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Project creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var projectId = JsonHelper.ExtractGuid(createContent, "publicId");
            Assert.IsNotNull(projectId, "Project ID not found");

            // Get the project by public ID
            var response = await ApiClient.GetAsync($"/api/Projects/public/{projectId}", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Project StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Project Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get project failed");
            Assert.IsTrue(JsonHelper.ContainsValue(content, "Test Get Project"), "Project name not found in response");
        }

        [Test]
        public async Task UpdateProject_ShouldSucceed()
        {
            // First create a project
            var createRequest = ProjectRequestFactory.CreateProjectRequest("Original Name", "Original description");
            var createResponse = await ApiClient.PostAsync("/api/Projects", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Project creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var projectId = JsonHelper.ExtractGuid(createContent, "publicId");
            Assert.IsNotNull(projectId, "Project ID not found");

            // Update the project
            var updateRequest = ProjectRequestFactory.UpdateProjectRequest("Updated Name", "Updated description", ProjectStatus.Active, ProjectPriority.High);
            var response = await ApiClient.PutAsync($"/api/Projects/public/{projectId}", updateRequest, _authToken!);

            SerilogLogger.Logger.Information("Update Project StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Project update failed");

            // Verify the update
            var getResponse = await ApiClient.GetAsync($"/api/Projects/public/{projectId}", _authToken!);
            var getContent = await getResponse.Content.ReadAsStringAsync();

            Assert.IsTrue(getResponse.IsSuccessStatusCode, "Get updated project failed");
            Assert.IsTrue(JsonHelper.ContainsValue(getContent, "Updated Name"), "Updated project name not found");
            Assert.IsTrue(JsonHelper.ContainsValue(getContent, "Updated description"), "Updated project description not found");
        }

        [Test]
        public async Task DeleteProject_ShouldSucceed()
        {
            // First create a project
            var createRequest = ProjectRequestFactory.CreateProjectRequest("Project to Delete", "Will be deleted");
            var createResponse = await ApiClient.PostAsync("/api/Projects", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Project creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var projectId = JsonHelper.ExtractGuid(createContent, "publicId");
            Assert.IsNotNull(projectId, "Project ID not found");

            // Delete the project
            var response = await ApiClient.DeleteAsync($"/api/Projects/public/{projectId}", _authToken!);

            SerilogLogger.Logger.Information("Delete Project StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Project deletion failed");

            // Verify the project is deleted
            var getResponse = await ApiClient.GetAsync($"/api/Projects/public/{projectId}", _authToken!);
            Assert.AreEqual(404, (int)getResponse.StatusCode, "Project should not exist after deletion");
        }

        [Test]
        public async Task ArchiveProject_ShouldSucceed()
        {
            // First create a project
            var createRequest = ProjectRequestFactory.CreateProjectRequest("Project to Archive", "Will be archived");
            var createResponse = await ApiClient.PostAsync("/api/Projects", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Project creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var projectId = JsonHelper.ExtractGuid(createContent, "publicId");
            Assert.IsNotNull(projectId, "Project ID not found");

            // Archive the project
            var response = await ApiClient.PostAsync($"/api/Projects/public/{projectId}/archive", new { }, _authToken!);

            SerilogLogger.Logger.Information("Archive Project StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Project archiving failed");
        }

        [Test]
        public async Task GetProjectBoard_ShouldReturnBoardData()
        {
            // First create a project
            var createRequest = ProjectRequestFactory.CreateProjectRequest("Board Test Project", "For board testing");
            var createResponse = await ApiClient.PostAsync("/api/Projects", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Project creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var projectId = JsonHelper.ExtractGuid(createContent, "publicId");
            Assert.IsNotNull(projectId, "Project ID not found");

            // Get the project board
            var response = await ApiClient.GetAsync($"/api/Projects/public/{projectId}/board", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Project Board StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Project Board Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get project board failed");
            Assert.IsTrue(JsonHelper.HasProperty(content, "columns"), "Board should have columns");
            Assert.IsTrue(JsonHelper.HasProperty(content, "projectId"), "Board should have projectId");
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