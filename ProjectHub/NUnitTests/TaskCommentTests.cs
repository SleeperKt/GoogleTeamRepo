using NUnitTests.Helpers;
using NUnitTests.TestData;
using NUnitTests.Tools;
using NUnit.Framework;
using System;
using System.Threading.Tasks;

namespace NUnitTests
{
    [TestFixture]
    public class TaskCommentTests
    {
        private string? _authToken;
        private Guid? _testProjectId;
        private int? _testTaskId;

        [OneTimeSetUp]
        public async Task Setup()
        {
            // Register and login a test user
            var registerRequest = UserRequestFactory.CreateRegisterRequest("CommentTestUser", "commenttest@example.com", "Password123!");
            var registerResponse = await ApiClient.PostAsync("/api/Auth/register", registerRequest);
            Assert.IsTrue(registerResponse.IsSuccessStatusCode, "User registration failed");

            var loginRequest = UserRequestFactory.CreateLoginRequest("CommentTestUser", "Password123!");
            var loginResponse = await ApiClient.PostAsync("/api/Auth/login", loginRequest);
            Assert.IsTrue(loginResponse.IsSuccessStatusCode, "User login failed");

            var loginContent = await loginResponse.Content.ReadAsStringAsync();
            _authToken = JsonHelper.ExtractToken(loginContent);
            Assert.IsNotNull(_authToken, "Auth token not found");

            // Create a test project for comment operations
            var createProjectRequest = ProjectRequestFactory.CreateProjectRequest("Comment Test Project", "For comment testing");
            var createProjectResponse = await ApiClient.PostAsync("/api/Projects", createProjectRequest, _authToken);
            Assert.IsTrue(createProjectResponse.IsSuccessStatusCode, "Test project creation failed");

            var projectContent = await createProjectResponse.Content.ReadAsStringAsync();
            _testProjectId = JsonHelper.ExtractGuid(projectContent, "publicId");
            Assert.IsNotNull(_testProjectId, "Test project ID not found");

            // Create a test task for comment operations
            var createTaskRequest = ProjectRequestFactory.CreateTaskRequest("Test Task for Comments", "Task for comment testing");
            var createTaskResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks", createTaskRequest, _authToken);
            Assert.IsTrue(createTaskResponse.IsSuccessStatusCode, "Test task creation failed");

            var taskContent = await createTaskResponse.Content.ReadAsStringAsync();
            _testTaskId = JsonHelper.ExtractInt(taskContent, "id");
            Assert.IsNotNull(_testTaskId, "Test task ID not found");
        }

        [Test]
        [TestCaseSource(typeof(ProjectTestData), nameof(ProjectTestData.ValidTaskComments))]
        public async Task CreateTaskComment_ShouldSucceed(string content)
        {
            var createRequest = ProjectRequestFactory.CreateTaskCommentRequest(content);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks/{_testTaskId}/comments", createRequest, _authToken!);
            var responseContent = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Create Task Comment StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Create Task Comment Content: {0}", responseContent);

            Assert.IsTrue(response.IsSuccessStatusCode, "Task comment creation failed");
            Assert.IsTrue(JsonHelper.HasProperty(responseContent, "id"), "Comment should have id");
            Assert.IsTrue(JsonHelper.ContainsValue(responseContent, content), $"Comment content '{content}' not found in response");
        }

        [Test]
        public async Task GetTaskComments_ShouldReturnComments()
        {
            // First create a comment
            var createRequest = ProjectRequestFactory.CreateTaskCommentRequest("Test comment for getting comments");
            var createResponse = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks/{_testTaskId}/comments", createRequest, _authToken!);
            Assert.IsTrue(createResponse.IsSuccessStatusCode, "Comment creation failed");

            // Get all comments for the task
            var response = await ApiClient.GetAsync($"/api/Projects/public/{_testProjectId}/tasks/{_testTaskId}/comments", _authToken!);
            var content = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Get Task Comments StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Get Task Comments Content: {0}", content);

            Assert.IsTrue(response.IsSuccessStatusCode, "Get task comments failed");
            Assert.IsTrue(content.StartsWith("[") || JsonHelper.HasProperty(content, "comments"), "Response should contain comments array");
        }

        [Test]
        public async Task CreateMultipleComments_ShouldSucceed()
        {
            var comments = new string[]
            {
                "First comment",
                "Second comment",
                "Third comment with more content"
            };

            foreach (var comment in comments)
            {
                var createRequest = ProjectRequestFactory.CreateTaskCommentRequest(comment);
                var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks/{_testTaskId}/comments", createRequest, _authToken!);
                
                SerilogLogger.Logger.Information("Create Comment '{0}' StatusCode: {1}", comment, response.StatusCode);
                
                Assert.IsTrue(response.IsSuccessStatusCode, $"Comment creation failed for: {comment}");
            }

            // Verify all comments were created by getting them
            var getResponse = await ApiClient.GetAsync($"/api/Projects/public/{_testProjectId}/tasks/{_testTaskId}/comments", _authToken!);
            var content = await getResponse.Content.ReadAsStringAsync();

            Assert.IsTrue(getResponse.IsSuccessStatusCode, "Get comments failed");
            Assert.IsTrue(JsonHelper.ContainsValue(content, "First comment"), "First comment not found");
            Assert.IsTrue(JsonHelper.ContainsValue(content, "Second comment"), "Second comment not found");
            Assert.IsTrue(JsonHelper.ContainsValue(content, "Third comment with more content"), "Third comment not found");
        }

        [Test]
        public async Task CreateCommentWithSpecialCharacters_ShouldSucceed()
        {
            var specialComment = "Comment with special chars: !@#$%^&*()_+-=[]{}|;':\",./<>?";
            var createRequest = ProjectRequestFactory.CreateTaskCommentRequest(specialComment);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks/{_testTaskId}/comments", createRequest, _authToken!);
            var responseContent = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Create Special Comment StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Create Special Comment Content: {0}", responseContent);

            Assert.IsTrue(response.IsSuccessStatusCode, "Special character comment creation failed");
            Assert.IsTrue(JsonHelper.HasProperty(responseContent, "content"), "Comment should have content property");
        }

        [Test]
        public async Task CreateLongComment_ShouldSucceed()
        {
            var longComment = new string('A', 1000); // 1000 character comment
            var createRequest = ProjectRequestFactory.CreateTaskCommentRequest(longComment);
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks/{_testTaskId}/comments", createRequest, _authToken!);
            var responseContent = await response.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Create Long Comment StatusCode: {0}", response.StatusCode);
            SerilogLogger.Logger.Information("Create Long Comment Content Length: {0}", responseContent.Length);

            Assert.IsTrue(response.IsSuccessStatusCode, "Long comment creation failed");
            Assert.IsTrue(JsonHelper.HasProperty(responseContent, "id"), "Comment should have id");
        }

        [Test]
        public async Task CreateEmptyComment_ShouldFail()
        {
            var createRequest = ProjectRequestFactory.CreateTaskCommentRequest("");
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks/{_testTaskId}/comments", createRequest, _authToken!);

            SerilogLogger.Logger.Information("Create Empty Comment StatusCode: {0}", response.StatusCode);

            // Should fail with 400 Bad Request
            Assert.AreEqual(400, (int)response.StatusCode, "Empty comment should be rejected");
        }

        [Test]
        public async Task CreateCommentOnNonExistentTask_ShouldFail()
        {
            var createRequest = ProjectRequestFactory.CreateTaskCommentRequest("Test comment");
            var response = await ApiClient.PostAsync($"/api/Projects/public/{_testProjectId}/tasks/99999/comments", createRequest, _authToken!);

            SerilogLogger.Logger.Information("Create Comment on Non-existent Task StatusCode: {0}", response.StatusCode);

            // Should fail with 404 Not Found
            Assert.AreEqual(404, (int)response.StatusCode, "Comment on non-existent task should be rejected");
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