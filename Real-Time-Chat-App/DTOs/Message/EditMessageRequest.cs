using System.ComponentModel.DataAnnotations;

namespace Real_Time_Chat_App.DTOs.Message
{
    public class EditMessageRequest
    {
        [Required]
        [MinLength(1)]
        [MaxLength(2000)]
        public string Content { get; set; } = string.Empty;
    }
}
