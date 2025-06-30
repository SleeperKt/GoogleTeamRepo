using Newtonsoft.Json;
using Newtonsoft.Json.Linq;
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
        public static string? ExtractToken(string jsonResponse)
        {
            try
            {
                var json = JObject.Parse(jsonResponse);
                return json["token"]?.ToString();
            }
            catch
            {
                return null;
            }
        }

        public static T? ExtractData<T>(string jsonResponse, string propertyName = "data")
        {
            try
            {
                var json = JObject.Parse(jsonResponse);
                var dataToken = json[propertyName];
                if (dataToken != null)
                {
                    return dataToken.ToObject<T>();
                }
                return default(T);
            }
            catch
            {
                return default(T);
            }
        }

        public static Guid? ExtractGuid(string jsonResponse, string propertyName)
        {
            try
            {
                var json = JObject.Parse(jsonResponse);
                var value = json[propertyName]?.ToString();
                if (Guid.TryParse(value, out Guid guid))
                {
                    return guid;
                }
                return null;
            }
            catch
            {
                return null;
            }
        }

        public static int? ExtractInt(string jsonResponse, string propertyName)
        {
            try
            {
                var json = JObject.Parse(jsonResponse);
                var value = json[propertyName]?.ToString();
                if (int.TryParse(value, out int result))
                {
                    return result;
                }
                return null;
            }
            catch
            {
                return null;
            }
        }

        public static string? ExtractString(string jsonResponse, string propertyName)
        {
            try
            {
                var json = JObject.Parse(jsonResponse);
                return json[propertyName]?.ToString();
            }
            catch
            {
                return null;
            }
        }

        public static bool HasProperty(string jsonResponse, string propertyName)
        {
            try
            {
                var json = JObject.Parse(jsonResponse);
                return json[propertyName] != null;
            }
            catch
            {
                return false;
            }
        }

        public static bool ContainsValue(string jsonResponse, string value)
        {
            try
            {
                return jsonResponse.Contains(value, StringComparison.OrdinalIgnoreCase);
            }
            catch
            {
                return false;
            }
        }
    }
}

