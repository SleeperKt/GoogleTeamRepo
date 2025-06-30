using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NUnitTests.Helpers
{
    public static class UserRequestFactory
    {
        public static object CreateRegisterRequest(string name, string email, string password) => new
        {
            name,
            email,
            password
        };

        public static object CreateLoginRequest(string name, string password) => new
        {
            name,
            password
        };
    }
}