namespace ChatApp.Domain.Entities;

public class Message
{
    public int Id { get; private set; }
    public int RoomId { get; private set; }
    public string SenderId { get; private set; } = default!;
    public string Content { get; private set; } = default!;
    public DateTime CreatedAtUtc { get; private set; }
    public bool IsEdited { get; private set; }
    public bool IsDeleted { get; private set; }

    private Message() { } // For EF

    public Message(int roomId, string senderId, string content)
    {
        if (string.IsNullOrWhiteSpace(content))
            throw new ArgumentException("Message content cannot be empty.");

        if (content.Length > 2000)
            throw new ArgumentException("Message is too long.");


        RoomId = roomId;
        SenderId = senderId;
        Content = content;
        CreatedAtUtc = DateTime.UtcNow;
        IsEdited = false;
        IsDeleted = false;
    }

    public void Edit(string newContent)
    {
        if (IsDeleted)
            throw new InvalidOperationException("Cannot edit deleted message.");

        if (string.IsNullOrWhiteSpace(newContent))
            throw new ArgumentException("Message cannot be empty.");

        Content = newContent;
        IsEdited = true;
    }

    public void Delete()
    {
        IsDeleted = true;
    }
}
