using ChatApp.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using Real_Time_Chat_App.Data;
using Real_Time_Chat_App.Services;
using Microsoft.EntityFrameworkCore;

namespace Real_Time_Chat_App.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ChatDbContext _context;
        private readonly IMessageService _messageService;

        public ChatHub(ChatDbContext context, IMessageService messageService)
        {
            _context = context;
            _messageService = messageService;
        }

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;

            if (!string.IsNullOrEmpty(userId))
            {
                // Store connection
                var connection = new UserConnection
                {
                    UserId = userId,
                    ConnectionId = Context.ConnectionId,
                    ConnectedAtUtc = DateTime.UtcNow
                };

                _context.UserConnections.Add(connection);
                await _context.SaveChangesAsync();

                // Get user's rooms and join them
                var userRooms = await _context.UserRooms
                    .Where(ur => ur.UserId == userId)
                    .Select(ur => ur.RoomId.ToString())
                    .ToListAsync();

                foreach (var roomId in userRooms)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
                }

                // Notify others that user is online
                await Clients.All.SendAsync("UserConnected", userId);
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var connection = await _context.UserConnections
                .FirstOrDefaultAsync(c => c.ConnectionId == Context.ConnectionId);

            if (connection != null)
            {
                _context.UserConnections.Remove(connection);
                await _context.SaveChangesAsync();

                // Notify others that user is offline
                await Clients.All.SendAsync("UserDisconnected", connection.UserId);
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task SendMessage(Guid roomId, string content)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User not authenticated");
            }

            // Create and save message
            var message = await _messageService.SendMessageAsync(roomId, userId, content);

            // Send to all users in the room
            await Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", new
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

        public async Task JoinRoom(Guid roomId)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User not authenticated");
            }

            var room = await _context.Rooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null)
            {
                throw new HubException("Room not found");
            }

            // Add user to room if not already a member
            if (!room.Members.Any(m => m.UserId == userId))
            {
                room.AddMember(userId);
                await _context.SaveChangesAsync();
            }

            // Add to SignalR group
            await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());

            // Notify room members
            await Clients.Group(roomId.ToString()).SendAsync("UserJoinedRoom", roomId, userId);
        }

        public async Task LeaveRoom(Guid roomId)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User not authenticated");
            }

            var room = await _context.Rooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room != null)
            {
                room.RemoveMember(userId);
                await _context.SaveChangesAsync();
            }

            // Remove from SignalR group
            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId.ToString());

            // Notify room members
            await Clients.Group(roomId.ToString()).SendAsync("UserLeftRoom", roomId, userId);
        }

        public async Task EditMessage(Guid messageId, string newContent)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User not authenticated");
            }

            var message = await _messageService.EditMessageAsync(messageId, userId, newContent);

            // Notify room members
            await Clients.Group(message.RoomId.ToString()).SendAsync("MessageEdited", new
            {
                message.Id,
                message.RoomId,
                message.Content,
                message.IsEdited
            });
        }

        public async Task DeleteMessage(Guid messageId)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
            {
                throw new HubException("User not authenticated");
            }

            var message = await _messageService.DeleteMessageAsync(messageId, userId);

            // Notify room members
            await Clients.Group(message.RoomId.ToString()).SendAsync("MessageDeleted", new
            {
                message.Id,
                message.RoomId,
                message.IsDeleted
            });
        }

        public async Task Typing(Guid roomId)
        {
            var userId = Context.UserIdentifier;

            if (!string.IsNullOrEmpty(userId))
            {
                await Clients.OthersInGroup(roomId.ToString())
                    .SendAsync("UserTyping", roomId, userId);
            }
        }

        public async Task StopTyping(Guid roomId)
        {
            var userId = Context.UserIdentifier;

            if (!string.IsNullOrEmpty(userId))
            {
                await Clients.OthersInGroup(roomId.ToString())
                    .SendAsync("UserStoppedTyping", roomId, userId);
            }
        }
    }
}