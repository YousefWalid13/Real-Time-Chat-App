using ChatApp.Domain.Entities;

namespace Real_Time_Chat_App.Services
{
    public interface IMessageService
    {
        Task<Message> SendMessageAsync(Guid roomId, string senderId, string content);
        Task<Message> EditMessageAsync(Guid messageId, string userId, string newContent);
        Task<Message> DeleteMessageAsync(Guid messageId, string userId);
        Task<IEnumerable<Message>> GetRoomMessagesAsync(Guid roomId, int pageNumber = 1, int pageSize = 50);
    }
}