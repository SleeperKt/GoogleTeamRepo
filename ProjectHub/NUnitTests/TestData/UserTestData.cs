using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NUnitTests.TestData
{
    public static class UserTestData
    {
        public static IEnumerable<TestCaseData> ValidUsers
        {
            get
            {
                yield return new TestCaseData("Example7", "exampleK@gmail.com", "Password123?");
                yield return new TestCaseData("Example8", "exampleF@gmail.com", "Password456!");
            }
        }
    }
}
