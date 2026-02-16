using System.ComponentModel.DataAnnotations;

namespace Real_Time_Chat_App.DTOs.Rooms
{
    public class CreateRoomRequest
    {
        [Required]
        [MinLength(1)]
        [MaxLength(100)]
        public string Name { get; set; } = string.Empty;

        public bool IsGroup { get; set; }
    }
}
