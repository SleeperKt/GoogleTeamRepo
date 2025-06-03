using Microsoft.EntityFrameworkCore;
using ProjectHub.Core.Entities;

namespace ProjectHub.Infrastructure.Data
{
    public class ApplicationDbContext : DbContext
    {
        public ApplicationDbContext(DbContextOptions<ApplicationDbContext> options)
            : base(options)
        {
        }

        public DbSet<User> Users { get; set; } = null!;
        public DbSet<Project> Projects { get; set; } = null!;
        public DbSet<ProjectParticipant> ProjectParticipants { get; set; } = null!;

        protected override void OnModelCreating(ModelBuilder modelBuilder)
        {
            base.OnModelCreating(modelBuilder);

            // Configure User entity
            modelBuilder.Entity<User>()
                .HasKey(u => u.UserId);

            modelBuilder.Entity<User>()
                .Property(u => u.UserName)
                .HasMaxLength(50)
                .IsRequired();

            modelBuilder.Entity<User>()
                .Property(u => u.Email)
                .HasMaxLength(100)
                .IsRequired();            // Configure Project entity
            modelBuilder.Entity<Project>()
                .HasKey(p => p.Id);

            modelBuilder.Entity<Project>()
                .Property(p => p.Name)
                .HasMaxLength(100)
                .IsRequired();

            modelBuilder.Entity<Project>()
                .Property(p => p.Description)
                .HasMaxLength(500);

            modelBuilder.Entity<Project>()
                .Property(p => p.OwnerId)
                .IsRequired();

            // Configure ProjectParticipant relationships
            modelBuilder.Entity<ProjectParticipant>()
                .HasKey(pp => pp.Id);

            modelBuilder.Entity<ProjectParticipant>()
                .Property(pp => pp.ProjectId)
                .IsRequired();

            modelBuilder.Entity<ProjectParticipant>()
                .Property(pp => pp.UserId)
                .IsRequired();

            // Create unique index to prevent duplicate participants
            modelBuilder.Entity<ProjectParticipant>()
                .HasIndex(pp => new { pp.ProjectId, pp.UserId })
                .IsUnique();
        }
    }
}
