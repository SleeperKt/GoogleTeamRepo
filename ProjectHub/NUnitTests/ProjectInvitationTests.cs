using NUnitTests.Helpers;
using NUnitTests.TestData;
using NUnitTests.Tools;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace NUnitTests
{
    [TestFixture]
    public class ProjectInvitationTests
    {
        private string? _authToken;
        private Guid? _testProjectId;

        [OneTimeSetUp]
        public async Task Setup()
        {
            // Register and login a test user
            var registerRequest = UserRequestFactory.CreateRegisterRequest("InvitationTestUser", "invitationtest@example.com", "Password123!");
            var registerResponse = await ApiClient.PostAsync("/api/Auth/register", registerRequest);
            Assert.IsTrue(registerResponse.IsSuccessStatusCode, "User registration failed");

            var loginRequest = UserRequestFactory.CreateLoginRequest("InvitationTestUser", "Password123!");
            var loginResponse = await ApiClient.PostAsync("/api/Auth/login", loginRequest);
            Assert.IsTrue(loginResponse.IsSuccessStatusCode, "User login failed");

            var loginContent = await loginResponse.Content.ReadAsStringAsync();
            _authToken = JsonHelper.ExtractToken(loginContent);
            Assert.IsNotNull(_authToken, "Auth token not found");

            // Create a test project for invitation operations
            var createProjectRequest = ProjectRequestFactory.CreateProjectRequest("Invitation Test Project", "For invitation testing");
            var createProjectResponse = await ApiClient.PostAsync("/api/Projects", createProjectRequest, _authToken);
            Assert.IsTrue(createProjectResponse.IsSuccessStatusCode, "Test project creation failed");

            var projectContent = await createProjectResponse.Content.ReadAsStringAsync();
            _testProjectId = JsonHelper.ExtractGuid(projectContent, "publicId");
            Assert.IsNotNull(_testProjectId, "Test project ID not found");
        }

        [Test]
        public async Task InvitationEndpointsNotImplemented_ShouldReturnNotFound()
        {
            // Test that invitation endpoints return 404 (not implemented)
            var createRequest = ProjectRequestFactory.CreateInvitationRequest("test@example.com", ProjectHub.Core.Entities.ParticipantRole.Editor);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest, _authToken!);

            SerilogLogger.Logger.Information("Invitation Endpoint StatusCode: {0}", response.StatusCode);

            // Should return 404 since endpoint is not implemented
            Assert.AreEqual(404, (int)response.StatusCode, "Invitation endpoint should return 404 (not implemented)");
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