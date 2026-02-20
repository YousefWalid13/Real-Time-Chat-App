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
        private static readonly ConcurrentDictionary<string, HashSet<string>> _roomUsers = new();

        public ChatHub(ChatDbContext context, IMessageService messageService)
        {
            _context = context;
            _messageService = messageService;
        }

        // =========================
        // CONNECTION
        // =========================

        public override async Task OnConnectedAsync()
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId)) { await base.OnConnectedAsync(); return; }

            _onlineUsers.AddOrUpdate(userId,
                new HashSet<string> { Context.ConnectionId },
                (_, ex) => { lock (ex) { ex.Add(Context.ConnectionId); } return ex; });

            var roomIds = await _context.UserRooms
                .Where(x => x.UserId == userId)
                .Select(x => x.RoomId.ToString())
                .ToListAsync();

            foreach (var roomId in roomIds)
            {
                await Groups.AddToGroupAsync(Context.ConnectionId, roomId);
                _roomUsers.AddOrUpdate(roomId,
                    new HashSet<string> { userId },
                    (_, ex) => { lock (ex) { ex.Add(userId); } return ex; });
            }

            await base.OnConnectedAsync();
        }

        public override async Task OnDisconnectedAsync(Exception? exception)
        {
            var userId = Context.UserIdentifier;
            if (!string.IsNullOrEmpty(userId) && _onlineUsers.TryGetValue(userId, out var conns))
            {
                lock (conns) { conns.Remove(Context.ConnectionId); }

                if (conns.Count == 0)
                {
                    _onlineUsers.TryRemove(userId, out _);
                    foreach (var kvp in _roomUsers)
                    {
                        bool removed;
                        lock (kvp.Value) { removed = kvp.Value.Remove(userId); }
                        if (removed)
                            await Clients.Group(kvp.Key).SendAsync("UserLeft", new { id = userId });
                    }
                }
            }
            await base.OnDisconnectedAsync(exception);
        }

        // =========================
        // ROOM MANAGEMENT
        // =========================

        public async Task JoinRoom(int roomId)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId)) throw new HubException("Unauthorized");

            var room = await _context.Rooms.Include(r => r.Members).FirstOrDefaultAsync(r => r.Id == roomId);
            if (room == null) throw new HubException("Room not found");

            if (!room.Members.Any(m => m.UserId == userId))
            {
                room.AddMember(userId);
                await _context.SaveChangesAsync();
            }

            var roomKey = roomId.ToString();
            await Groups.AddToGroupAsync(Context.ConnectionId, roomKey);

            var roomSet = _roomUsers.GetOrAdd(roomKey, _ => new HashSet<string>());
            bool isNew;
            lock (roomSet) { isNew = roomSet.Add(userId); }

            if (isNew)
            {
                var sender = await _context.Users.FindAsync(userId);
                await Clients.OthersInGroup(roomKey).SendAsync("UserJoined", new
                {
                    id = userId,
                    username = sender?.UserName ?? userId
                });
            }

            await SendRoomOnlineUsersToCallerAsync(roomId);
        }

        public async Task LeaveRoom(int roomId)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId)) return;

            var roomKey = roomId.ToString();
            if (_roomUsers.TryGetValue(roomKey, out var users))
                lock (users) { users.Remove(userId); }

            await Groups.RemoveFromGroupAsync(Context.ConnectionId, roomKey);
            await Clients.Group(roomKey).SendAsync("UserLeft", new { id = userId });
        }

        /// <summary>
        /// Destroys the room: kicks all members via SignalR, deletes messages + room from DB.
        /// Only the room creator / admin should be allowed to call this (enforce in controller).
        /// </summary>
        public async Task DestroyRoom(int roomId)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId)) throw new HubException("Unauthorized");

            var roomKey = roomId.ToString();

            // Notify ALL members in the room that it has been destroyed
            await Clients.Group(roomKey).SendAsync("RoomDestroyed", new
            {
                roomId = roomId
            });

            // Clean up in-memory tracking
            _roomUsers.TryRemove(roomKey, out _);
        }

        public async Task GetRoomOnlineUsers(int roomId)
        {
            await SendRoomOnlineUsersToCallerAsync(roomId);
        }

        // =========================
        // MESSAGES
        // =========================

        public async Task SendMessage(int roomId, string content)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId)) throw new HubException("Unauthorized");

            var isMember = await _context.UserRooms.AnyAsync(r => r.RoomId == roomId && r.UserId == userId);
            if (!isMember) throw new HubException("Not a member of this room");

            var message = await _messageService.SendMessageAsync(roomId, userId, content);
            var sender = await _context.Users.FindAsync(userId);

            await Clients.Group(roomId.ToString()).SendAsync("ReceiveMessage", new
            {
                id = message.Id,
                roomId = message.RoomId,
                senderId = message.SenderId,
                senderName = sender?.UserName ?? userId,
                content = message.Content,
                createdAtUtc = message.CreatedAtUtc,
                isEdited = message.IsEdited,
                isDeleted = message.IsDeleted,
            });
        }

        // =========================
        // TYPING
        // =========================

        public async Task UserTyping(int roomId)
        {
            var userId = Context.UserIdentifier;
            if (string.IsNullOrEmpty(userId)) return;
            var sender = await _context.Users.FindAsync(userId);
            await Clients.OthersInGroup(roomId.ToString()).SendAsync("UserTyping", sender?.UserName ?? userId);
        }

        // =========================
        // HELPERS
        // =========================

        private async Task SendRoomOnlineUsersToCallerAsync(int roomId)
        {
            var roomKey = roomId.ToString();
            List<string> onlineInRoom;

            if (_roomUsers.TryGetValue(roomKey, out var set))
                lock (set) { onlineInRoom = set.Where(uid => _onlineUsers.ContainsKey(uid)).ToList(); }
            else
                onlineInRoom = new List<string>();

            var users = await _context.Users
                .Where(u => onlineInRoom.Contains(u.Id))
                .Select(u => new { id = u.Id, username = u.UserName })
                .ToListAsync();

            await Clients.Caller.SendAsync("RoomOnlineUsers", new { roomId, onlineUsers = users });
        }
    }
}