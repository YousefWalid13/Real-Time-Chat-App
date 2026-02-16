using ChatApp.Domain.Entities;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Http.HttpResults;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Hosting;
using Real_Time_Chat_App.Data;
using Real_Time_Chat_App.DTOs.Rooms;
using StackExchange.Redis;
using System.ComponentModel.DataAnnotations;
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

            var myRooms = await _context.UserRooms
                .Where(ur => ur.UserId == userId)
                .Include(ur => ur.RoomId)
                .Select(ur => new
                {
                    roomId = ur.RoomId,
                    joinedAt = ur.JoinedAtUtc
                })
                .ToListAsync();

            var roomIds = myRooms.Select(r => r.roomId).ToList();

            var rooms = await _context.Rooms
                .Where(r => roomIds.Contains(r.Id))
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.IsGroup,
                    r.CreatedAtUtc,
                    memberCount = r.Members.Count,
                    joinedAt = myRooms.First(mr => mr.roomId == r.Id).joinedAt
                })
                .ToListAsync();

            return Ok(new
            {
                success = true,
                rooms
            });
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
