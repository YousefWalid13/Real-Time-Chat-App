using ChatApp.Domain.Entities;
using Microsoft.AspNetCore.Identity.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore;

namespace Real_Time_Chat_App.Data
{
    public class ChatDbContext : IdentityDbContext<ApplicationUser>
    {
        public ChatDbContext(DbContextOptions<ChatDbContext> options) : base(options)
        {
        }

        public DbSet<Message> Messages { get; set; }
        public DbSet<Room> Rooms { get; set; }
        public DbSet<UserRoom> UserRooms { get; set; }
        public DbSet<UserConnection> UserConnections { get; set; }

        protected override void OnModelCreating(ModelBuilder builder)
        {
            base.OnModelCreating(builder);

            // Configure Message entity
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
            });

            // Configure Room entity
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

                // Configure the collection relationship
                entity.HasMany(r => r.Members)
                    .WithOne()
                    .HasForeignKey(ur => ur.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure UserRoom entity (Many-to-Many join table)
            builder.Entity<UserRoom>(entity =>
            {
                entity.HasKey(ur => new { ur.RoomId, ur.UserId });

                entity.Property(ur => ur.UserId)
                    .IsRequired();

                entity.Property(ur => ur.JoinedAtUtc)
                    .IsRequired();

                // Relationships
                entity.HasOne<Room>()
                    .WithMany(r => r.Members)
                    .HasForeignKey(ur => ur.RoomId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasOne<ApplicationUser>()
                    .WithMany()
                    .HasForeignKey(ur => ur.UserId)
                    .OnDelete(DeleteBehavior.Cascade);

                entity.HasIndex(ur => ur.UserId);
            });

            // Configure UserConnection entity
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

                // Relationship to ApplicationUser
                entity.HasOne<ApplicationUser>()
                    .WithMany()
                    .HasForeignKey(uc => uc.UserId)
                    .OnDelete(DeleteBehavior.Cascade);
            });

            // Configure ApplicationUser
            builder.Entity<ApplicationUser>(entity =>
            {
                entity.Property(u => u.CreatedAtUtc)
                    .IsRequired();
            });
        }
    }
}