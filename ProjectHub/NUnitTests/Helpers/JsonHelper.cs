using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;

namespace NUnitTests.Helpers
{
    public static class JsonHelper
    {
        public static string? ExtractToken(string json)
        {
            using var doc = JsonDocument.Parse(json);
            if (doc.RootElement.TryGetProperty("token", out var tokenElement))
            {
                return tokenElement.GetString();
            }
            return null;
        }
    }
}

