namespace ChatApp.Domain.Entities;

public class UserRoom
{
    public int RoomId { get; private set; }
    public string UserId { get; private set; } = default!;
    public DateTime JoinedAtUtc { get; private set; }

    private UserRoom() { }

    public UserRoom(int roomId, string userId)
    {
        RoomId = roomId;
        UserId = userId;
        JoinedAtUtc = DateTime.UtcNow;
    }
}
