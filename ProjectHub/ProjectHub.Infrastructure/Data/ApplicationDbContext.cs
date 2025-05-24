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

            // Configure ProjectParticipant relationships
            modelBuilder.Entity<ProjectParticipant>()
                .HasOne(pp => pp.Project)
                .WithMany(p => p.Participants)
                .HasForeignKey(pp => pp.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectParticipant>()
                .HasOne(pp => pp.User)
                .WithMany(u => u.ProjectParticipations)
                .HasForeignKey(pp => pp.UserId)
                .OnDelete(DeleteBehavior.Cascade);

            // Create unique index to prevent duplicate participants
            modelBuilder.Entity<ProjectParticipant>()
                .HasIndex(pp => new { pp.ProjectId, pp.UserId })
                .IsUnique();
        }
    }
}
