using ChatApp.Domain.Entities;
using Microsoft.EntityFrameworkCore;
using Real_Time_Chat_App.Data;

namespace Real_Time_Chat_App.Services
{
    public class MessageService : IMessageService
    {
        private readonly ChatDbContext _context;

        public MessageService(ChatDbContext context)
        {
            _context = context;
        }

        public async Task<Message> SendMessageAsync(int roomId, string senderId, string content)
        {
            var room = await _context.Rooms.FindAsync(roomId)
                ?? throw new InvalidOperationException("Room not found");

            var isMember = await _context.UserRooms
                .AnyAsync(ur => ur.RoomId == roomId && ur.UserId == senderId);

            if (!isMember)
                throw new InvalidOperationException("User is not a member of this room");

            var message = new Message(roomId, senderId, content);
            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return message;
        }

        public async Task<Message> EditMessageAsync(int messageId, string userId, string newContent)
        {
            var message = await _context.Messages.FindAsync(messageId)
                ?? throw new InvalidOperationException("Message not found");

            if (message.SenderId != userId)
                throw new UnauthorizedAccessException("You can only edit your own messages");

            message.Edit(newContent);
            await _context.SaveChangesAsync();

            return message;
        }

        public async Task<Message> DeleteMessageAsync(int messageId, string userId)
        {
            var message = await _context.Messages.FindAsync(messageId)
                ?? throw new InvalidOperationException("Message not found");

            if (message.SenderId != userId)
                throw new UnauthorizedAccessException("You can only delete your own messages");

            message.Delete();
            await _context.SaveChangesAsync();

            return message;
        }

        /// <summary>
        /// Returns messages WITH senderName joined from AspNetUsers.
        /// The shape matches the SignalR ReceiveMessage payload so the
        /// frontend can use a single Message component for both sources.
        /// </summary>
        public async Task<IEnumerable<MessageDto>> GetRoomMessagesAsync(
            int roomId,
            int pageNumber = 1,
            int pageSize = 50)
        {
            return await _context.Messages
                .Where(m => m.RoomId == roomId && !m.IsDeleted)
                .OrderBy(m => m.CreatedAtUtc)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                // Join with Users table to get the username
                .Join(
                    _context.Users,
                    msg => msg.SenderId,
                    user => user.Id,
                    (msg, user) => new MessageDto
                    {
                        Id = msg.Id,
                        RoomId = msg.RoomId,
                        SenderId = msg.SenderId,
                        SenderName = user.UserName ?? msg.SenderId,  // ← matches SignalR payload
                        Content = msg.Content,
                        CreatedAtUtc = msg.CreatedAtUtc,
                        IsEdited = msg.IsEdited,
                        IsDeleted = msg.IsDeleted
                    })
                .ToListAsync();
        }
    }

    // ── DTO ───────────────────────────────────────────────────────────────
    // Matches the anonymous object sent by ChatHub.SendMessage so the
    // frontend receives the same shape from REST history and SignalR live.
    public class MessageDto
    {
        public int Id { get; init; }
        public int RoomId { get; init; }
        public string SenderId { get; init; } = "";
        public string SenderName { get; init; } = "";   // ← NEW
        public string Content { get; init; } = "";
        public DateTime CreatedAtUtc { get; init; }
        public bool IsEdited { get; init; }
        public bool IsDeleted { get; init; }
    }
}