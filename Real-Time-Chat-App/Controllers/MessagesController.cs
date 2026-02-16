using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Real_Time_Chat_App.Data;
using Real_Time_Chat_App.Services;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using Real_Time_Chat_App.DTOs.Message;

namespace Real_Time_Chat_App.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class MessagesController : ControllerBase
    {
        private readonly ChatDbContext _context;
        private readonly IMessageService _messageService;

        public MessagesController(ChatDbContext context, IMessageService messageService)
        {
            _context = context;
            _messageService = messageService;
        }

        [HttpGet("room/{roomId}")]
        public async Task<IActionResult> GetRoomMessages(Guid roomId, [FromQuery] int page = 1, [FromQuery] int pageSize = 50)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var isMember = await _context.UserRooms
                .AnyAsync(ur => ur.RoomId == roomId && ur.UserId == userId);

            if (!isMember)
                return Forbid();

            var messages = await _messageService.GetRoomMessagesAsync(roomId, page, pageSize);

            return Ok(messages.Select(m => new
            {
                m.Id,
                m.RoomId,
                m.SenderId,
                m.Content,
                m.CreatedAtUtc,
                m.IsEdited,
                m.IsDeleted
            }));
        }

        [HttpGet("{messageId}")]
        public async Task<IActionResult> GetMessage(Guid messageId)
        {
            var message = await _context.Messages.FindAsync(messageId);

            if (message == null)
                return NotFound();

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var isMember = await _context.UserRooms
                .AnyAsync(ur => ur.RoomId == message.RoomId && ur.UserId == userId);

            if (!isMember)
                return Forbid();

            return Ok(new
            {
                message.Id,
                message.RoomId,
                message.SenderId,
                message.Content,
                message.CreatedAtUtc,
                message.IsEdited,
                message.IsDeleted
            });
        }

        [HttpPost]
        public async Task<IActionResult> SendMessage([FromBody] SendMessageRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var message = await _messageService.SendMessageAsync(request.RoomId, userId!, request.Content);

            return CreatedAtAction(nameof(GetMessage), new { messageId = message.Id }, new
            {
                message.Id,
                message.RoomId,
                message.SenderId,
                message.Content,
                message.CreatedAtUtc,
                message.IsEdited,
                message.IsDeleted
            });
        }

        [HttpPut("{messageId}")]
        public async Task<IActionResult> EditMessage(Guid messageId, [FromBody] EditMessageRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var message = await _messageService.EditMessageAsync(messageId, userId!, request.Content);

            return Ok(new
            {
                message.Id,
                message.RoomId,
                message.SenderId,
                message.Content,
                message.CreatedAtUtc,
                message.IsEdited,
                message.IsDeleted
            });
        }

        [HttpDelete("{messageId}")]
        public async Task<IActionResult> DeleteMessage(Guid messageId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var message = await _messageService.DeleteMessageAsync(messageId, userId!);

            return Ok(new
            {
                success = true,
                message = "Message deleted successfully"
            });
        }
    }

   

   
}