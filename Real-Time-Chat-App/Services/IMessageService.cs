using ChatApp.Domain.Entities;

namespace Real_Time_Chat_App.Services
{
    public interface IMessageService
    {
        Task<Message> SendMessageAsync(int roomId, string senderId, string content);
        Task<Message> EditMessageAsync(int messageId, string userId, string newContent);
        Task<Message> DeleteMessageAsync(int messageId, string userId);

        // Returns MessageDto (includes SenderName) instead of raw Message entity
        Task<IEnumerable<MessageDto>> GetRoomMessagesAsync(
            int roomId,
            int pageNumber = 1,
            int pageSize = 50);
    }
}