using System.ComponentModel.DataAnnotations;

namespace Real_Time_Chat_App.DTOs.Auth
{
    public class ForgetPasswordRequest
    {
        [Required]
        [EmailAddress]
        public string Email { get; set; } = string.Empty;
    }
}
