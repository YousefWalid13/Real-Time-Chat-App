using Microsoft.AspNetCore.Identity;

namespace ChatApp.Domain.Entities
{
    public class ApplicationUser : IdentityUser
    {
        public string FullName { get; set; } = string.Empty;

        public DateTime CreatedAtUtc { get; set; } = DateTime.UtcNow;
        public ICollection<UserRoom> UserRooms { get; set; } = new List<UserRoom>();
    }

}
