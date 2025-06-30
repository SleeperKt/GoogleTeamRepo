using NUnitTests.Helpers;
using NUnitTests.TestData;
using NUnitTests.Tools;
using NUnit.Framework;
using System.Threading.Tasks;

namespace NUnitTests
{
    [TestFixture]
    public class UserTests
    {
        [TestCaseSource(typeof(UserTestData), nameof(UserTestData.ValidUsers))]
        public async Task FullUserFlow_ShouldSucceed(string name, string email, string password)
        {
            // Register
            var registerRequest = UserRequestFactory.CreateRegisterRequest(name, email, password);
            var registerResponse = await ApiClient.PostAsync("/api/Auth/register", registerRequest);
            var registerContent = await registerResponse.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Register StatusCode: {0}", registerResponse.StatusCode);
            SerilogLogger.Logger.Information("Register Content: {0}", registerContent);

            Assert.IsTrue(registerResponse.IsSuccessStatusCode, "Register failed.");
            Assert.IsTrue(registerContent.ToLower().Contains("user registered"), $"Unexpected response: {registerContent}");

            // Login
            var loginRequest = UserRequestFactory.CreateLoginRequest(name, password);
            var loginResponse = await ApiClient.PostAsync("/api/Auth/login", loginRequest);
            var loginContent = await loginResponse.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Login Response: {0}", loginContent);
            Assert.IsTrue(loginResponse.IsSuccessStatusCode, "Login failed.");
            var token = JsonHelper.ExtractToken(loginContent);
            Assert.IsNotNull(token, "Token was not found in login response");

            // Profile
            var profileResponse = await ApiClient.GetAsync("/api/user/me", token!);
            var profileContent = await profileResponse.Content.ReadAsStringAsync();

            SerilogLogger.Logger.Information("Profile Response: {0}", profileContent);
            Assert.IsTrue(profileResponse.IsSuccessStatusCode, "Profile call failed.");
            Assert.IsTrue(profileContent.Contains(email), $"Email not found in profile: {profileContent}");
        }
    }
}
