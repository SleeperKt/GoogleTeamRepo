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
    public class ProjectParticipantTests
    {
        private string? _authToken;
        private Guid? _testProjectId;
        private string? _testUserId;

        [OneTimeSetUp]
        public async Task Setup()
        {
            // Register and login a test user
            var registerRequest = UserRequestFactory.CreateRegisterRequest("ParticipantTestUser", "participanttest@example.com", "Password123!");
            var registerResponse = await ApiClient.PostAsync("/api/Auth/register", registerRequest);
            Assert.IsTrue(registerResponse.IsSuccessStatusCode, "User registration failed");

            var loginRequest = UserRequestFactory.CreateLoginRequest("ParticipantTestUser", "Password123!");
            var loginResponse = await ApiClient.PostAsync("/api/Auth/login", loginRequest);
            Assert.IsTrue(loginResponse.IsSuccessStatusCode, "User login failed");

            var loginContent = await loginResponse.Content.ReadAsStringAsync();
            _authToken = JsonHelper.ExtractToken(loginContent);
            Assert.IsNotNull(_authToken, "Auth token not found");

            // Get user ID from profile
            var profileResponse = await ApiClient.GetAsync("/api/user/me", _authToken);
            var profileContent = await profileResponse.Content.ReadAsStringAsync();
            _testUserId = JsonHelper.ExtractString(profileContent, "userId");
            Assert.IsNotNull(_testUserId, "User ID not found");

            // Create a test project for participant operations
            var createProjectRequest = ProjectRequestFactory.CreateProjectRequest("Participant Test Project", "For participant testing");
            var createProjectResponse = await ApiClient.PostAsync("/api/Projects", createProjectRequest, _authToken);
            Assert.IsTrue(createProjectResponse.IsSuccessStatusCode, "Test project creation failed");

            var projectContent = await createProjectResponse.Content.ReadAsStringAsync();
            _testProjectId = JsonHelper.ExtractGuid(projectContent, "publicId");
            Assert.IsNotNull(_testProjectId, "Test project ID not found");
        }

        [Test]
        public async Task GetProjectParticipants_ShouldReturnParticipants()
        {
            var response = await ApiClient.GetAsync($"/api/Projects/public/{_testProjectId}/participants", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Project Participants StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Project Participants Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get project participants failed");
            Assert.IsTrue(content.StartsWith("[") || JsonHelper.HasProperty(content, "participants"), "Response should contain participants array");
        }

        [Test]
        public async Task AddParticipantEndpointsNotImplemented_ShouldReturnMethodNotAllowed()
        {
            // Test that add participant endpoint returns 405 (not implemented)
            var addRequest = ProjectRequestFactory.AddParticipantRequest(Guid.NewGuid(), ParticipantRole.Editor);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/participants", addRequest, _authToken!);

            SerilogLogger.Logger.Information("Add Participant Endpoint StatusCode: {0}", response.StatusCode);

            // Should return 405 since endpoint is not implemented
            Assert.AreEqual(405, (int)response.StatusCode, "Add participant endpoint should return 405 (not implemented)");
        }

        [Test]
        public async Task GetUserProjects_ShouldReturnProjects()
        {
            var response = await ApiClient.GetAsync($"/api/users/{_testUserId}/projects", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get User Projects StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get User Projects Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get user projects failed");
            Assert.IsTrue(content.StartsWith("[") || JsonHelper.HasProperty(content, "projects"), "Response should contain projects array");
        }

        [Test]
        public async Task RemoveProjectOwner_ShouldFail()
        {
            // Try to remove the project owner (current user)
            var response = await ApiClient.DeleteAsync($"/api/Projects/public/{_testProjectId}/participants/{_testUserId}", _authToken!);

            SerilogLogger.Logger.Information("Remove Project Owner StatusCode: {0}", response.StatusCode);

            // Should fail with 404 Not Found or similar
            Assert.AreEqual(404, (int)response.StatusCode, "Remove project owner should be rejected");
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