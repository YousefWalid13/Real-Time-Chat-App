using ChatApp.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Real_Time_Chat_App.Data;
using Real_Time_Chat_App.DTOs.Rooms;
using System.Security.Claims;

namespace Real_Time_Chat_App.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    [Authorize]
    public class RoomsController : ControllerBase
    {
        private readonly ChatDbContext _context;

        public RoomsController(ChatDbContext context)
        {
            _context = context;
        }

        [HttpGet("my-rooms")]
        public async Task<IActionResult> GetMyRooms()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            if (string.IsNullOrEmpty(userId))
                return Unauthorized();

            var rooms = await _context.UserRooms
                .Where(ur => ur.UserId == userId)
                .Select(ur => new
                {
                    id = ur.Room.Id,
                    name = ur.Room.Name,
                    isGroup = ur.Room.IsGroup,
                    createdAtUtc = ur.Room.CreatedAtUtc,
                    memberCount = ur.Room.Members.Count,
                    joinedAt = ur.JoinedAtUtc
                })
                .ToListAsync();

            return Ok(rooms);
        }

        // Add this DELETE endpoint to your existing RoomsController.cs

        [HttpDelete("{id:int}")]
        [Authorize]
        public async Task<IActionResult> DestroyRoom(int id)
        {
            var userId = User.FindFirstValue(ClaimTypes.NameIdentifier);

            var room = await _context.Rooms
                .Include(r => r.Members)
                .Include(r => r.Messages)
                .FirstOrDefaultAsync(r => r.Id == id);

            if (room == null)
                return NotFound(new { message = "Room not found" });

            // Only the creator/owner can destroy the room
            // Assumes Room entity has a CreatedBy or OwnerId field.
            // If you don't have this, remove the check and allow any member to destroy.
            //if (room.CreatedBy != userId)
            //    return Forbid(); // 403

            // Delete all messages first (if no cascade delete configured)
            _context.Messages.RemoveRange(room.Messages);

            // Delete all memberships
            _context.UserRooms.RemoveRange(room.Members);

            // Delete the room itself
            _context.Rooms.Remove(room);

            await _context.SaveChangesAsync();

            return Ok(new { message = "Room destroyed", roomId = id });
        }
        [HttpGet("{roomId}")]
        public async Task<IActionResult> GetRoom(int roomId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var isMember = await _context.UserRooms
                .AnyAsync(ur => ur.RoomId == roomId && ur.UserId == userId);

            if (!isMember)
                return Forbid();

            var room = await _context.Rooms
                .Where(r => r.Id == roomId)
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.IsGroup,
                    r.CreatedAtUtc,
                    members = r.Members.Select(m => new
                    {
                        m.UserId,
                        m.JoinedAtUtc
                    }).ToList()
                })
                .FirstOrDefaultAsync();

            if (room == null)
                return NotFound(new
                {
                    success = false,
                    message = "Room not found"
                });

            return Ok(new
            {
                success = true,
                room
            });
        }

        [HttpPost("create")]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(new
                {
                    success = false,
                    message = "Validation failed",
                    errors = ModelState.Values
                        .SelectMany(v => v.Errors)
                        .Select(e => e.ErrorMessage)
                        .ToList()
                });

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var room = new Room(request.Name, request.IsGroup);
            room.AddMember(userId!);

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRoom), new { roomId = room.Id }, new
            {
                ExpireAtUtc = DateTime.UtcNow.AddHours(1),
                success = true,
                message = "Room created successfully",
                room = new
                {
                    room.Id,
                    room.Name,
                    room.IsGroup,
                    room.CreatedAtUtc
                }
            });
        }

        [HttpPost("{roomId}/join")]
        public async Task<IActionResult> JoinRoom(int roomId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var room = await _context.Rooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null)
                return NotFound(new
                {
                    success = false,
                    message = "Room not found"
                });

            var alreadyMember = room.Members.Any(m => m.UserId == userId);
            if (alreadyMember)
                return BadRequest(new
                {
                    success = false,
                    message = "You are already a member of this room"
                });

            room.AddMember(userId!);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Successfully joined the room",
                room = new
                {
                    room.Id,
                    room.Name,
                    room.IsGroup,
                    room.CreatedAtUtc,
                    memberCount = room.Members.Count
                }
            });
        }

        [HttpPost("{roomId}/leave")]
        public async Task<IActionResult> LeaveRoom(int roomId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var room = await _context.Rooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null)
                return NotFound(new
                {
                    success = false,
                    message = "Room not found"
                });

            var isMember = room.Members.Any(m => m.UserId == userId);
            if (!isMember)
                return BadRequest(new
                {
                    success = false,
                    message = "You are not a member of this room"
                });

            room.RemoveMember(userId!);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Successfully left the room"
            });
        }

        [HttpPost("{roomId}/members")]
        public async Task<IActionResult> AddMember(int roomId, [FromBody] AddMemberRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var isMember = await _context.UserRooms
                .AnyAsync(ur => ur.RoomId == roomId && ur.UserId == userId);

            if (!isMember)
                return Forbid();

            var room = await _context.Rooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null)
                return NotFound();

            room.AddMember(request.UserId);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Member added successfully"
            });
        }

        [HttpDelete("{roomId}/members/{memberId}")]
        public async Task<IActionResult> RemoveMember(int roomId, string memberId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var isMember = await _context.UserRooms
                .AnyAsync(ur => ur.RoomId == roomId && ur.UserId == userId);

            if (!isMember)
                return Forbid();

            var room = await _context.Rooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null)
                return NotFound();

            room.RemoveMember(memberId);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Member removed successfully"
            });
        }

        [HttpDelete("{roomId}")]
        public async Task<IActionResult> DeleteRoom(int roomId)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var room = await _context.Rooms
                .Include(r => r.Members)
                .FirstOrDefaultAsync(r => r.Id == roomId);

            if (room == null)
                return NotFound();

            var isCreator = room.Members.OrderBy(m => m.JoinedAtUtc).First().UserId == userId;

            if (!isCreator)
                return Forbid();

            _context.Rooms.Remove(room);
            await _context.SaveChangesAsync();

            return Ok(new
            {
                success = true,
                message = "Room deleted successfully"
            });
        }
    }


}
