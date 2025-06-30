using Serilog;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace NUnitTests.Tools
{
    public static class SerilogLogger
    {
        public static readonly ILogger Logger = new LoggerConfiguration()
            .MinimumLevel.Debug()
            .WriteTo.Console()
            .WriteTo.File("Logs/test-log.txt", rollingInterval: RollingInterval.Day)
            .CreateLogger();
    }
}
