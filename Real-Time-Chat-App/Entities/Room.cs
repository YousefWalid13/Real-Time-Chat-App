namespace ChatApp.Domain.Entities;

public class Room
{
    public Guid Id { get; private set; }
    public string Name { get; private set; } = default!;
    public bool IsGroup { get; private set; }
    public DateTime CreatedAtUtc { get; private set; }

    private readonly List<UserRoom> _members = new();
    public IReadOnlyCollection<UserRoom> Members => _members.AsReadOnly();

    private Room() { }

    public Room(string name, bool isGroup)
    {
        if (string.IsNullOrWhiteSpace(name))
            throw new ArgumentException("Room name cannot be empty.");

        Id = Guid.NewGuid();
        Name = name;
        IsGroup = isGroup;
        CreatedAtUtc = DateTime.UtcNow;
    }

    public void AddMember(string userId)
    {
        if (_members.Any(m => m.UserId == userId))
            return;

        _members.Add(new UserRoom(Id, userId));
    }

    public void RemoveMember(string userId)
    {
        var member = _members.FirstOrDefault(x => x.UserId == userId);
        if (member != null)
            _members.Remove(member);
    }
}
