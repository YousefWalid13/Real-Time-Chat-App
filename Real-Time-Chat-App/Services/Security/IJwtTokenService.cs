using ChatApp.Domain.Entities;

namespace Real_Time_Chat_App.Services.Security
{

    public interface IJwtTokenService
    {
        string GenerateAccessToken(ApplicationUser user, IList<string> roles);

        string GenerateRefreshToken();

    }

}