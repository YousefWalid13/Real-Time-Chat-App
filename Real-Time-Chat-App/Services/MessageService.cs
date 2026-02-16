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

        public async Task<Message> SendMessageAsync(Guid roomId, string senderId, string content)
        {
            // Verify room exists
            var room = await _context.Rooms.FindAsync(roomId);
            if (room == null)
            {
                throw new InvalidOperationException("Room not found");
            }

            // Verify user is a member of the room
            var isMember = await _context.UserRooms
                .AnyAsync(ur => ur.RoomId == roomId && ur.UserId == senderId);

            if (!isMember)
            {
                throw new InvalidOperationException("User is not a member of this room");
            }

            // Create message
            var message = new Message(roomId, senderId, content);

            _context.Messages.Add(message);
            await _context.SaveChangesAsync();

            return message;
        }

        public async Task<Message> EditMessageAsync(Guid messageId, string userId, string newContent)
        {
            var message = await _context.Messages.FindAsync(messageId);

            if (message == null)
            {
                throw new InvalidOperationException("Message not found");
            }

            if (message.SenderId != userId)
            {
                throw new UnauthorizedAccessException("You can only edit your own messages");
            }

            message.Edit(newContent);
            await _context.SaveChangesAsync();

            return message;
        }

        public async Task<Message> DeleteMessageAsync(Guid messageId, string userId)
        {
            var message = await _context.Messages.FindAsync(messageId);

            if (message == null)
            {
                throw new InvalidOperationException("Message not found");
            }

            if (message.SenderId != userId)
            {
                throw new UnauthorizedAccessException("You can only delete your own messages");
            }

            message.Delete();
            await _context.SaveChangesAsync();

            return message;
        }

        public async Task<IEnumerable<Message>> GetRoomMessagesAsync(Guid roomId, int pageNumber = 1, int pageSize = 50)
        {
            return await _context.Messages
                .Where(m => m.RoomId == roomId && !m.IsDeleted)
                .OrderByDescending(m => m.CreatedAtUtc)
                .Skip((pageNumber - 1) * pageSize)
                .Take(pageSize)
                .ToListAsync();
        }
    }
}