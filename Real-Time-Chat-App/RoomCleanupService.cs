using Microsoft.EntityFrameworkCore;
using Real_Time_Chat_App.Data;

namespace Real_Time_Chat_App
{
    public class RoomCleanupService : BackgroundService
    {
        private readonly IServiceScopeFactory _scopeFactory;

        public RoomCleanupService(IServiceScopeFactory scopeFactory)
        {
            _scopeFactory = scopeFactory;
        }

        protected override async Task ExecuteAsync(CancellationToken stoppingToken)
        {
            while (!stoppingToken.IsCancellationRequested)
            {
                using var scope = _scopeFactory.CreateScope();
                var context = scope.ServiceProvider.GetRequiredService<ChatDbContext>();

                var expiredRooms = await context.Rooms
                    .Where(r => r.ExpiresAtUtc != null &&
                                r.ExpiresAtUtc < DateTime.UtcNow)
                    .ToListAsync();

                context.Rooms.RemoveRange(expiredRooms);
                await context.SaveChangesAsync();

                await Task.Delay(TimeSpan.FromMinutes(10), stoppingToken);
            }
        }
    }

}
