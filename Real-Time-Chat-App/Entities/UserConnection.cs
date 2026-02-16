namespace ChatApp.Domain.Entities
{
    public class UserConnection
    {
        public string UserId { get; set; } = default!;
        public string ConnectionId { get; set; } = default!;
        public DateTime ConnectedAtUtc { get; set; }
    }

}
