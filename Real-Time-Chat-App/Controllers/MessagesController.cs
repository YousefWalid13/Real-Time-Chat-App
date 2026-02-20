using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Real_Time_Chat_App.Services;

namespace Real_Time_Chat_App.Controllers
{
    [ApiController]
    [Route("api/messages")]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly IMessageService _messageService;

        public MessagesController(IMessageService messageService)
        {
            _messageService = messageService;
        }

        /// <summary>
        /// GET /api/messages/{roomId}?pageNumber=1&pageSize=50
        /// Returns message history with senderName included.
        /// Shape matches the SignalR ReceiveMessage payload.
        /// </summary>
        [HttpGet("{roomId:int}")]
        public async Task<IActionResult> GetMessages(
            int roomId,
            [FromQuery] int pageNumber = 1,
            [FromQuery] int pageSize = 50)
        {
            var messages = await _messageService.GetRoomMessagesAsync(
                roomId, pageNumber, pageSize);

            // Wrap in { messages: [...] } so ChatPage can read data.messages
            return Ok(new { messages });
        }
    }
}