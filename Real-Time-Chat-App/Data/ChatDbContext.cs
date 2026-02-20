using ChatApp.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Real_Time_Chat_App.Data
{
    public class ChatDbContext : IdentityDbContext<ApplicationUser>
    {
        public ChatDbContext(DbContextOptions<ChatDbContext> options)
            : base(options)
        {
        }

        public DbSet<Message> Messages => Set<Message>();
        public DbSet<Room> Rooms => Set<Room>();
        public DbSet<UserRoom> UserRooms => Set<UserRoom>();
        public DbSet<UserConnection> UserConnections => Set<UserConnection>();

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // =======================
            // Message
            // =======================
            builder.Entity<Message>(entity =>
            {
                entity.HasKey(m => m.Id);

                entity.Property(m => m.Content)
                      .IsRequired()
                      .HasMaxLength(2000);

                entity.Property(m => m.SenderId)
                      .IsRequired();

                entity.Property(m => m.CreatedAtUtc)
                      .IsRequired();

                entity.HasIndex(m => m.RoomId);
                entity.HasIndex(m => m.CreatedAtUtc);

                entity.HasOne<Room>()
                      .WithMany(r => r.Messages)
                      .HasForeignKey(m => m.RoomId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // =======================
            // Room
            // =======================
            builder.Entity<Room>(entity =>
            {
                entity.HasKey(r => r.Id);

                entity.Property(r => r.Name)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(r => r.IsGroup)
                      .IsRequired();

                entity.Property(r => r.CreatedAtUtc)
                      .IsRequired();
            });

            // =======================
            // UserRoom (Join Table)
            // =======================
            builder.Entity<UserRoom>(entity =>
            {
                entity.HasKey(ur => new { ur.RoomId, ur.UserId });

                entity.Property(ur => ur.JoinedAtUtc)
                      .IsRequired();

                entity.HasOne(ur => ur.Room)
                      .WithMany(r => r.Members)
                      .HasForeignKey(ur => ur.RoomId)
                      .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne(ur => ur.User)
                      .WithMany()
                      .HasForeignKey(ur => ur.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // =======================
            // UserConnection
            // =======================
            builder.Entity<UserConnection>(entity =>
            {
                entity.HasKey(uc => uc.ConnectionId);

                entity.Property(uc => uc.UserId)
                      .IsRequired();

                entity.Property(uc => uc.ConnectionId)
                      .IsRequired()
                      .HasMaxLength(100);

                entity.Property(uc => uc.ConnectedAtUtc)
                      .IsRequired();

                entity.HasIndex(uc => uc.UserId);

                entity.HasOne<ApplicationUser>()
                      .WithMany()
                      .HasForeignKey(uc => uc.UserId)
                      .OnDelete(DeleteBehavior.Cascade);
            });

            // =======================
            // ApplicationUser
            // =======================
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(u => u.CreatedAtUtc)
                      .IsRequired();
            });
        }
    }
}