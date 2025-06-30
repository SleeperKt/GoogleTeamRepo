using NUnitTests.Helpers;
using NUnitTests.TestData;
using NUnitTests.Tools;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

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
        public async Task AddParticipant_ShouldSucceed()
        {
            // First register another user to add as participant
            var registerRequest = UserRequestFactory.CreateRegisterRequest("ParticipantToAdd", "participanttoadd@example.com", "Password123!");
            var registerResponse = await ApiClient.PostAsync("/api/Auth/register", registerRequest);
            Assert.IsTrue(registerResponse.IsSuccessStatusCode, "User registration failed");

            // Get the user ID from profile
            var loginRequest = UserRequestFactory.CreateLoginRequest("ParticipantToAdd", "Password123!");
            var loginResponse = await ApiClient.PostAsync("/api/Auth/login", loginRequest);
            Assert.IsTrue(loginResponse.IsSuccessStatusCode, "User login failed");

            var loginContent = await loginResponse.Content.ReadAsStringAsync();
            var participantToken = JsonHelper.ExtractToken(loginContent);
            Assert.IsNotNull(participantToken, "Participant token not found");

            var participantProfileResponse = await ApiClient.GetAsync("/api/user/me", participantToken);
            var participantProfileContent = await participantProfileResponse.Content.ReadAsStringAsync();
            var participantUserId = JsonHelper.ExtractString(participantProfileContent, "userId");
            Assert.IsNotNull(participantUserId, "Participant user ID not found");

            // Add the participant to the project
            var addRequest = ProjectRequestFactory.AddParticipantRequest(Guid.Parse(participantUserId), ParticipantRole.Editor);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/participants", addRequest, _authToken!);
            var responseContent = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Add Participant StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Add Participant Content: {0}", responseContent);

            Assert.IsTrue(response.IsSuccessStatusCode, "Add participant failed");
            Assert.IsTrue(JsonHelper.HasProperty(responseContent, "participantId") || JsonHelper.ContainsValue(responseContent, "successfully"), "Add participant response should indicate success");
        }

        [Test]
        public async Task UpdateParticipantRole_ShouldSucceed()
        {
            // First register another user to add as participant
            var registerRequest = UserRequestFactory.CreateRegisterRequest("RoleUpdateUser", "roleupdate@example.com", "Password123!");
            var registerResponse = await ApiClient.PostAsync("/api/Auth/register", registerRequest);
            Assert.IsTrue(registerResponse.IsSuccessStatusCode, "User registration failed");

            // Get the user ID from profile
            var loginRequest = UserRequestFactory.CreateLoginRequest("RoleUpdateUser", "Password123!");
            var loginResponse = await ApiClient.PostAsync("/api/Auth/login", loginRequest);
            Assert.IsTrue(loginResponse.IsSuccessStatusCode, "User login failed");

            var loginContent = await loginResponse.Content.ReadAsStringAsync();
            var participantToken = JsonHelper.ExtractToken(loginContent);
            Assert.IsNotNull(participantToken, "Participant token not found");

            var participantProfileResponse = await ApiClient.GetAsync("/api/user/me", participantToken);
            var participantProfileContent = await participantProfileResponse.Content.ReadAsStringAsync();
            var participantUserId = JsonHelper.ExtractString(participantProfileContent, "userId");
            Assert.IsNotNull(participantUserId, "Participant user ID not found");

            // Add the participant to the project
            var addRequest = ProjectRequestFactory.AddParticipantRequest(Guid.Parse(participantUserId), ParticipantRole.Viewer);
            var addResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/participants", addRequest, _authToken!);
            Assert.IsTrue(addResponse.IsSuccessStatusCode, "Add participant failed");

            // Update the participant role
            var updateRequest = ProjectRequestFactory.UpdateParticipantRoleRequest(ParticipantRole.Editor);
            var response = await ApiClient.PutAsync($"/api/Projects/public/{_testProjectId}/participants/{participantUserId}/role", updateRequest, _authToken!);

            SerilogLogger.Logger.Information("Update Participant Role StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Update participant role failed");
        }

        [Test]
        public async Task RemoveParticipant_ShouldSucceed()
        {
            // First register another user to add as participant
            var registerRequest = UserRequestFactory.CreateRegisterRequest("RemoveUser", "removeuser@example.com", "Password123!");
            var registerResponse = await ApiClient.PostAsync("/api/Auth/register", registerRequest);
            Assert.IsTrue(registerResponse.IsSuccessStatusCode, "User registration failed");

            // Get the user ID from profile
            var loginRequest = UserRequestFactory.CreateLoginRequest("RemoveUser", "Password123!");
            var loginResponse = await ApiClient.PostAsync("/api/Auth/login", loginRequest);
            Assert.IsTrue(loginResponse.IsSuccessStatusCode, "User login failed");

            var loginContent = await loginResponse.Content.ReadAsStringAsync();
            var participantToken = JsonHelper.ExtractToken(loginContent);
            Assert.IsNotNull(participantToken, "Participant token not found");

            var participantProfileResponse = await ApiClient.GetAsync("/api/user/me", participantToken);
            var participantProfileContent = await participantProfileResponse.Content.ReadAsStringAsync();
            var participantUserId = JsonHelper.ExtractString(participantProfileContent, "userId");
            Assert.IsNotNull(participantUserId, "Participant user ID not found");

            // Add the participant to the project
            var addRequest = ProjectRequestFactory.AddParticipantRequest(Guid.Parse(participantUserId), ParticipantRole.Viewer);
            var addResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/participants", addRequest, _authToken!);
            Assert.IsTrue(addResponse.IsSuccessStatusCode, "Add participant failed");

            // Remove the participant
            var response = await ApiClient.DeleteAsync($"/api/Projects/public/{_testProjectId}/participants/{participantUserId}", _authToken!);

            SerilogLogger.Logger.Information("Remove Participant StatusCode: {0}", response.StatusCode);

            Assert.IsTrue(response.IsSuccessStatusCode, "Remove participant failed");
        }

        [Test]
        public async Task AddParticipantWithInvalidUserId_ShouldFail()
        {
            var invalidUserId = Guid.NewGuid();
            var addRequest = ProjectRequestFactory.AddParticipantRequest(invalidUserId, ParticipantRole.Editor);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/participants", addRequest, _authToken!);

            SerilogLogger.Logger.Information("Add Participant with Invalid User ID StatusCode: {0}", response.StatusCode);

            // Should fail with 404 Not Found or similar
            Assert.IsFalse(response.IsSuccessStatusCode, "Add participant with invalid user ID should be rejected");
        }

        [Test]
        public async Task AddDuplicateParticipant_ShouldFail()
        {
            // First register another user
            var registerRequest = UserRequestFactory.CreateRegisterRequest("DuplicateUser", "duplicateuser@example.com", "Password123!");
            var registerResponse = await ApiClient.PostAsync("/api/Auth/register", registerRequest);
            Assert.IsTrue(registerResponse.IsSuccessStatusCode, "User registration failed");

            // Get the user ID from profile
            var loginRequest = UserRequestFactory.CreateLoginRequest("DuplicateUser", "Password123!");
            var loginResponse = await ApiClient.PostAsync("/api/Auth/login", loginRequest);
            Assert.IsTrue(loginResponse.IsSuccessStatusCode, "User login failed");

            var loginContent = await loginResponse.Content.ReadAsStringAsync();
            var participantToken = JsonHelper.ExtractToken(loginContent);
            Assert.IsNotNull(participantToken, "Participant token not found");

            var participantProfileResponse = await ApiClient.GetAsync("/api/user/me", participantToken);
            var participantProfileContent = await participantProfileResponse.Content.ReadAsStringAsync();
            var participantUserId = JsonHelper.ExtractString(participantProfileContent, "userId");
            Assert.IsNotNull(participantUserId, "Participant user ID not found");

            // Add the participant first time
            var addRequest1 = ProjectRequestFactory.AddParticipantRequest(Guid.Parse(participantUserId), ParticipantRole.Editor);
            var addResponse1 = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/participants", addRequest1, _authToken!);
            Assert.IsTrue(addResponse1.IsSuccessStatusCode, "First add participant failed");

            // Try to add the same participant again
            var addRequest2 = ProjectRequestFactory.AddParticipantRequest(Guid.Parse(participantUserId), ParticipantRole.Viewer);
            var addResponse2 = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/participants", addRequest2, _authToken!);

            SerilogLogger.Logger.Information("Add Duplicate Participant StatusCode: {0}", addResponse2.StatusCode);

            // Should fail with 409 Conflict or similar
            Assert.IsFalse(addResponse2.IsSuccessStatusCode, "Add duplicate participant should be rejected");
        }

        [Test]
        public async Task RemoveProjectOwner_ShouldFail()
        {
            // Try to remove the project owner (current user)
            var response = await ApiClient.DeleteAsync($"/api/Projects/public/{_testProjectId}/participants/{_testUserId}", _authToken!);

            SerilogLogger.Logger.Information("Remove Project Owner StatusCode: {0}", response.StatusCode);

            // Should fail with 400 Bad Request or similar
            Assert.IsFalse(response.IsSuccessStatusCode, "Remove project owner should be rejected");
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