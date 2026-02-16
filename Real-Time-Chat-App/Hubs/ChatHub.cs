using ChatApp.Domain.Entities;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Real_Time_Chat_App.Data;
using Real_Time_Chat_App.Services;
using System.Collections.Concurrent;

namespace Real_Time_Chat_App.Hubs
{
    public class ChatHub : Hub
    {
        private readonly ChatDbContext _context;
        private readonly IMessageService _messageService;
        private static readonly ConcurrentDictionary<string, HashSet<string>> _onlineUsers = new();

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
                var connection = new UserConnection
                {
                    UserId = userId,
                    ConnectionId = Context.ConnectionId,
                    ConnectedAtUtc = DateTime.UtcNow
                };

                _context.UserConnections.Add(connection);
                await _context.SaveChangesAsync();

                _onlineUsers.AddOrUpdate(
                    userId,
                    new HashSet<string> { Context.ConnectionId },
                    (key, existingSet) =>
                    {
                        existingSet.Add(Context.ConnectionId);
                        return existingSet;
                    });

                var userRooms = await _context.UserRooms
                    .Where(ur => ur.UserId == userId)
                    .Select(ur => ur.RoomId.ToString())
                    .ToListAsync();

                foreach (var roomId in userRooms)
                {
                    await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
                }

                await Clients.All.SendAsync("UserConnected", new
                {
                    userId,
                    connectionId = Context.ConnectionId,
                    timestamp = DateTime.UtcNow
                });

                await Clients.Caller.SendAsync("OnlineUsers", GetOnlineUsersList());
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

                var userId = connection.UserId;

                if (_onlineUsers.TryGetValue(userId, out var connections))
                {
                    connections.Remove(Context.ConnectionId);

                    if (connections.Count == 0)
                    {
                        _onlineUsers.TryRemove(userId, out _);

                        await Clients.All.SendAsync("UserDisconnected", new
                        {
                            userId,
                            timestamp = DateTime.UtcNow
                        });
                    }
                }
            }

            await base.OnDisconnectedAsync(exception);
        }

        public async Task GetOnlineUsers()
        {
            await Clients.Caller.SendAsync("OnlineUsers", GetOnlineUsersList());
        }

        public async Task GetRoomOnlineUsers(int roomId)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            var isMember = await _context.UserRooms
                .AnyAsync(r => r.RoomId == roomId && r.UserId == userId);

            if (!isMember)
                throw new HubException("Not authorized for this room");

            var roomMembers = await _context.UserRooms
                .Where(ur => ur.RoomId == roomId)
                .Select(ur => ur.UserId)
                .ToListAsync();

            var onlineInRoom = roomMembers
                .Where(u => _onlineUsers.ContainsKey(u))
                .ToList();

            await Clients.Caller.SendAsync("RoomOnlineUsers", new
            {
                roomId,
                onlineUsers = onlineInRoom,
                count = onlineInRoom.Count
            });
        }

        public async Task SendMessage(int roomId, string content)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            var isMember = await _context.UserRooms
                .AnyAsync(r => r.RoomId == roomId && r.UserId == userId);

            if (!isMember)
                throw new HubException("Not authorized for this room");

            var message = await _messageService.SendMessageAsync(roomId, userId, content);

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

        public async Task JoinRoom(int roomId)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            var room = await _context.Rooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null)
                throw new HubException("Room not found");

            if (!room.Members.Any(m => m.UserId == userId))
            {
                room.AddMember(userId);
                await _context.SaveChangesAsync();
            }

            await Groups.AddToGroupAsync(Context.ConnectionId, roomId.ToString());

            await Clients.Group(roomId.ToString()).SendAsync("UserJoinedRoom", new
            {
                roomId,
                userId,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task LeaveRoom(int roomId)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            var isMember = await _context.UserRooms
                .AnyAsync(r => r.RoomId == roomId && r.UserId == userId);

            if (!isMember)
                throw new HubException("Not authorized for this room");

            var room = await _context.Rooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room != null)
            {
                room.RemoveMember(userId);
                await _context.SaveChangesAsync();
            }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomId.ToString());

            await Clients.Group(roomId.ToString()).SendAsync("UserLeftRoom", new
            {
                roomId,
                userId,
                timestamp = DateTime.UtcNow
            });
        }

        public async Task EditMessage(int messageId, string newContent)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            var message = await _messageService.EditMessageAsync(messageId, userId, newContent);

            var isMember = await _context.UserRooms
                .AnyAsync(r => r.RoomId == message.RoomId && r.UserId == userId);

            if (!isMember)
                throw new HubException("Not authorized for this room");

            await Clients.Group(message.RoomId.ToString()).SendAsync("MessageEdited", new
            {
                message.Id,
                message.RoomId,
                message.Content,
                message.IsEdited,
                editedAt = DateTime.UtcNow
            });
        }

        public async Task DeleteMessage(int messageId)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            var message = await _messageService.DeleteMessageAsync(messageId, userId);

            var isMember = await _context.UserRooms
                .AnyAsync(r => r.RoomId == message.RoomId && r.UserId == userId);

            if (!isMember)
                throw new HubException("Not authorized for this room");

            await Clients.Group(message.RoomId.ToString()).SendAsync("MessageDeleted", new
            {
                message.Id,
                message.RoomId,
                message.IsDeleted,
                deletedAt = DateTime.UtcNow
            });
        }

        public async Task Typing(int roomId)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            var isMember = await _context.UserRooms
                .AnyAsync(r => r.RoomId == roomId && r.UserId == userId);

            if (!isMember)
                throw new HubException("Not authorized for this room");

            await Clients.OthersInGroup(roomId.ToString())
                .SendAsync("UserTyping", new
                {
                    roomId,
                    userId,
                    timestamp = DateTime.UtcNow
                });
        }

        public async Task StopTyping(int roomId)
        {
            var userId = Context.UserIdentifier;

            if (string.IsNullOrEmpty(userId))
                throw new HubException("User not authenticated");

            var isMember = await _context.UserRooms
                .AnyAsync(r => r.RoomId == roomId && r.UserId == userId);

            if (!isMember)
                throw new HubException("Not authorized for this room");

            await Clients.OthersInGroup(roomId.ToString())
                .SendAsync("UserStoppedTyping", new
                {
                    roomId,
                    userId,
                    timestamp = DateTime.UtcNow
                });
        }

        private List<object> GetOnlineUsersList()
        {
            return _onlineUsers.Select(kvp => new
            {
                userId = kvp.Key,
                connectionCount = kvp.Value.Count,
                isOnline = true
            }).ToList<object>();
        }
    }
}