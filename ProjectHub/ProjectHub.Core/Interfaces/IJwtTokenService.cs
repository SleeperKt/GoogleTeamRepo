using ProjectHub.Core.Entities;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Text;
using System.Threading.Tasks;

namespace ProjectHub.Core.Interfaces
{
    public interface IJwtTokenService
    {
        string GenerateToken(User user);
        bool ValidateToken(string token, out string? userId);
    }
}
