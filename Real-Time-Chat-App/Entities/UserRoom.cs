namespace ChatApp.Domain.Entities;

public class UserRoom
{
    public Guid RoomId { get; private set; }
    public string UserId { get; private set; } = default!;
    public DateTime JoinedAtUtc { get; private set; }

    private UserRoom() { }

    public UserRoom(Guid roomId, string userId)
    {
        RoomId = roomId;
        UserId = userId;
        JoinedAtUtc = DateTime.UtcNow;
    }
}
