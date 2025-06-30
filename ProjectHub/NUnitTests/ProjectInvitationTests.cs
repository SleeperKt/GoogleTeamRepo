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
        [TestCaseSource(typeof(ProjectTestData), nameof(ProjectTestData.ValidInvitations))]
        public async Task CreateProjectInvitation_ShouldSucceed(string inviteeEmail, ParticipantRole role, string? message = null)
        {
            var createRequest = ProjectRequestFactory.CreateInvitationRequest(inviteeEmail, role, message);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest, _authToken!);
            var responseContent = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Create Project Invitation StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Create Project Invitation Content: {0}", responseContent);

            Assert.IsTrue(response.IsSuccessStatusCode, "Project invitation creation failed");
            Assert.IsTrue(JsonHelper.HasProperty(responseContent, "invitationId") || JsonHelper.HasProperty(responseContent, "id"), "Invitation should have id");
        }

        [Test]
        public async Task GetProjectInvitations_ShouldReturnInvitations()
        {
            // First create an invitation
            var createRequest = ProjectRequestFactory.CreateInvitationRequest("test@example.com", ParticipantRole.Editor, "Please join our project");
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Invitation creation failed");

            // Get all invitations for the project
            var response = await ApiClient.GetAsync($"/api/Projects/public/{_testProjectId}/invitations", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Project Invitations StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Project Invitations Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get project invitations failed");
            Assert.IsTrue(content.StartsWith("[") || JsonHelper.HasProperty(content, "invitations"), "Response should contain invitations array");
        }

        [Test]
        public async Task CreateInvitationWithDifferentRoles_ShouldSucceed()
        {
            var roles = new[] { ParticipantRole.Editor, ParticipantRole.Viewer };
            var emails = new[] { "editor@example.com", "viewer@example.com" };

            for (int i = 0; i < roles.Length; i++)
            {
                var createRequest = ProjectRequestFactory.CreateInvitationRequest(emails[i], roles[i], $"Invitation for {roles[i]} role");
                var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest, _authToken!);
                
                SerilogLogger.Logger.Information("Create Invitation for {0} StatusCode: {1}", roles[i], response.StatusCode);
                
                Assert.IsTrue(response.IsSuccessStatusCode, $"Invitation creation failed for role: {roles[i]}");
            }
        }

        [Test]
        public async Task CreateInvitationWithInvalidEmail_ShouldFail()
        {
            var createRequest = ProjectRequestFactory.CreateInvitationRequest("invalid-email", ParticipantRole.Editor);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest, _authToken!);

            SerilogLogger.Logger.Information("Create Invitation with Invalid Email StatusCode: {0}", response.StatusCode);

            // Should fail with 400 Bad Request
            Assert.AreEqual(400, (int)response.StatusCode, "Invalid email invitation should be rejected");
        }

        [Test]
        public async Task CreateInvitationToSelf_ShouldFail()
        {
            var createRequest = ProjectRequestFactory.CreateInvitationRequest("invitationtest@example.com", ParticipantRole.Editor);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest, _authToken!);

            SerilogLogger.Logger.Information("Create Invitation to Self StatusCode: {0}", response.StatusCode);

            // Should fail with 400 Bad Request or similar
            Assert.IsFalse(response.IsSuccessStatusCode, "Self-invitation should be rejected");
        }

        [Test]
        public async Task CreateDuplicateInvitation_ShouldFail()
        {
            var email = "duplicate@example.com";
            
            // Create first invitation
            var createRequest1 = ProjectRequestFactory.CreateInvitationRequest(email, ParticipantRole.Editor);
            var response1 = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest1, _authToken!);
            Assert.IsTrue(response1.IsSuccessStatusCode, "First invitation creation failed");

            // Try to create duplicate invitation
            var createRequest2 = ProjectRequestFactory.CreateInvitationRequest(email, ParticipantRole.Viewer);
            var response2 = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest2, _authToken!);

            SerilogLogger.Logger.Information("Create Duplicate Invitation StatusCode: {0}", response2.StatusCode);

            // Should fail with 409 Conflict or similar
            Assert.IsFalse(response2.IsSuccessStatusCode, "Duplicate invitation should be rejected");
        }

        [Test]
        public async Task GetInvitationById_ShouldReturnInvitation()
        {
            // First create an invitation
            var createRequest = ProjectRequestFactory.CreateInvitationRequest("getbyid@example.com", ParticipantRole.Editor);
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Invitation creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var invitationId = JsonHelper.ExtractInt(createContent, "invitationId") ?? JsonHelper.ExtractInt(createContent, "id");
            Assert.IsNotNull(invitationId, "Invitation ID not found");

            // Get the specific invitation
            var response = await ApiClient.GetAsync($"/api/Invitations/{invitationId}", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Invitation by ID StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Invitation by ID Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get invitation by ID failed");
            Assert.IsTrue(JsonHelper.ContainsValue(content, "getbyid@example.com"), "Invitee email not found in response");
        }

        [Test]
        public async Task RespondToInvitation_ShouldSucceed()
        {
            // First create an invitation
            var createRequest = ProjectRequestFactory.CreateInvitationRequest("respond@example.com", ParticipantRole.Editor);
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Invitation creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var invitationId = JsonHelper.ExtractInt(createContent, "invitationId") ?? JsonHelper.ExtractInt(createContent, "id");
            Assert.IsNotNull(invitationId, "Invitation ID not found");

            // Respond to the invitation (accept)
            var respondRequest = new { status = "Accepted" };
            var response = await ApiClient.PutAsync($"/api/Invitations/{invitationId}/respond", respondRequest, _authToken!);

            SerilogLogger.Logger.Information("Respond to Invitation StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Respond to invitation failed");
        }

        [Test]
        public async Task DeleteInvitation_ShouldSucceed()
        {
            // First create an invitation
            var createRequest = ProjectRequestFactory.CreateInvitationRequest("delete@example.com", ParticipantRole.Editor);
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/invitations", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Invitation creation failed");

            var createContent = await createResponse.Content.ReadAsStringAsync();
            var invitationId = JsonHelper.ExtractInt(createContent, "invitationId") ?? JsonHelper.ExtractInt(createContent, "id");
            Assert.IsNotNull(invitationId, "Invitation ID not found");

            // Delete the invitation
            var response = await ApiClient.DeleteAsync($"/api/Invitations/{invitationId}", _authToken!);

            SerilogLogger.Logger.Information("Delete Invitation StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Invitation deletion failed");

            // Verify the invitation is deleted
            var getResponse = await ApiClient.GetAsync($"/api/Invitations/{invitationId}", _authToken!);
            Assert.AreEqual(404, (int)getResponse.StatusCode, "Invitation should not exist after deletion");
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