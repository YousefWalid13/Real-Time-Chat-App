using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Real_Time_Chat_App.Data;
using ChatApp.Domain.Entities;
using System.Security.Claims;
using System.ComponentModel.DataAnnotations;
using Real_Time_Chat_App.DTOs.Rooms;

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

        [HttpGet]
        public async Task<IActionResult> GetUserRooms()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var rooms = await _context.UserRooms
                .Where(ur => ur.UserId == userId)
                .Include(ur => ur.RoomId)
                .Select(ur => new
                {
                    id = ur.RoomId,
                    joinedAt = ur.JoinedAtUtc
                })
                .ToListAsync();

            var roomDetails = await _context.Rooms
                .Where(r => rooms.Select(x => x.id).Contains(r.Id))
                .Select(r => new
                {
                    r.Id,
                    r.Name,
                    r.IsGroup,
                    r.CreatedAtUtc,
                    memberCount = r.Members.Count
                })
                .ToListAsync();

            return Ok(roomDetails);
        }

        [HttpGet("{roomId}")]
        public async Task<IActionResult> GetRoom(Guid roomId)
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
                return NotFound();

            return Ok(room);
        }

        [HttpPost]
        public async Task<IActionResult> CreateRoom([FromBody] CreateRoomRequest request)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;

            var room = new Room(request.Name, request.IsGroup);
            room.AddMember(userId!);

            _context.Rooms.Add(room);
            await _context.SaveChangesAsync();

            return CreatedAtAction(nameof(GetRoom), new { roomId = room.Id }, new
            {
                room.Id,
                room.Name,
                room.IsGroup,
                room.CreatedAtUtc
            });
        }

        [HttpPost("{roomId}/members")]
        public async Task<IActionResult> AddMember(Guid roomId, [FromBody] AddMemberRequest request)
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
        public async Task<IActionResult> RemoveMember(Guid roomId, string memberId)
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
        public async Task<IActionResult> DeleteRoom(Guid roomId)
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