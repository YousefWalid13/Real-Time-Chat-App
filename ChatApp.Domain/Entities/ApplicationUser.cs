using Microsoft.AspNetCore.Identity;

namespace ChatApp.Domain.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
    }

}
