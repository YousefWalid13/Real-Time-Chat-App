namespace ChatApp.Domain.Entities;

public class Room
{
    public int Id { get; set; }

    public string Name { get; set; } = default!;

    public bool IsGroup { get; set; }

    public DateTime CreatedAtUtc { get; set; }

    public DateTime? ExpiresAtUtc { get; set; }

    public ICollection<UserRoom> Members { get; private set; } = new List<UserRoom>();

    public ICollection<Message> Messages { get; private set; } = new List<Message>();

    public Room() { } // EF

    public Room(string name, bool isGroup)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Room name cannot be empty.");

        Name = name;
        IsGroup = isGroup;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void AddMember(string userId)
    {
        if (Members.Any(m => m.UserId == userId))
            return;

        Members.Add(new UserRoom(Id, userId));
    }

    public void RemoveMember(string userId)
    {
        var member = Members.FirstOrDefault(x => x.UserId == userId);
        if (member != null)
            Members.Remove(member);
    }
}