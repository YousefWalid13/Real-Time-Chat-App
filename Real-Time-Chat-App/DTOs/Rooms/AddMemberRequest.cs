using System.ComponentModel.DataAnnotations;

namespace Real_Time_Chat_App.DTOs.Rooms
{
    public class AddMemberRequest
    {
        [Required]
        public string UserId { get; set; } = string.Empty;
    }
}
