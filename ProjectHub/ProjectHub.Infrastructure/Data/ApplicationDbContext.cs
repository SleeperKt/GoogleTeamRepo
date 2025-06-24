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
        public DbSet<ProjectTask> Tasks { get; set; } = null!;
        public DbSet<TaskComment> TaskComments { get; set; } = null!;
        public DbSet<TaskActivity> TaskActivities { get; set; } = null!;
        public DbSet<ProjectSettings> ProjectSettings { get; set; } = null!;
        public DbSet<ProjectLabel> ProjectLabels { get; set; } = null!;
        public DbSet<ProjectWorkflowStage> ProjectWorkflowStages { get; set; } = null!;
        public DbSet<ProjectInvitation> ProjectInvitations { get; set; } = null!;

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

            modelBuilder.Entity<Project>()
                .Property(p => p.Status)
                .HasConversion<int>()
                .IsRequired();

            modelBuilder.Entity<Project>()
                .Property(p => p.Priority)
                .HasConversion<int>()
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

            // Configure Task entity
            modelBuilder.Entity<ProjectTask>()
                .HasKey(t => t.Id);

            modelBuilder.Entity<ProjectTask>()
                .Property(t => t.Title)
                .HasMaxLength(200)
                .IsRequired();

            modelBuilder.Entity<ProjectTask>()
                .Property(t => t.Description)
                .HasMaxLength(1000);

            modelBuilder.Entity<ProjectTask>()
                .Property(t => t.ProjectId)
                .IsRequired();

            modelBuilder.Entity<ProjectTask>()
                .Property(t => t.Status)
                .IsRequired();

            modelBuilder.Entity<ProjectTask>()
                .Property(t => t.Stage)
                .IsRequired();

            modelBuilder.Entity<ProjectTask>()
                .Property(t => t.CreatedById)
                .IsRequired();

            // Configure TaskComment entity
            modelBuilder.Entity<TaskComment>()
                .HasKey(tc => tc.Id);

            modelBuilder.Entity<TaskComment>()
                .Property(tc => tc.TaskId)
                .IsRequired();

            modelBuilder.Entity<TaskComment>()
                .Property(tc => tc.UserId)
                .IsRequired();

            modelBuilder.Entity<TaskComment>()
                .Property(tc => tc.Content)
                .HasMaxLength(2000)
                .IsRequired();

            // Configure TaskActivity entity
            modelBuilder.Entity<TaskActivity>()
                .HasKey(ta => ta.Id);

            modelBuilder.Entity<TaskActivity>()
                .Property(ta => ta.TaskId)
                .IsRequired();

            modelBuilder.Entity<TaskActivity>()
                .Property(ta => ta.UserId)
                .IsRequired();

            modelBuilder.Entity<TaskActivity>()
                .Property(ta => ta.ActivityType)
                .HasMaxLength(50)
                .IsRequired();

            modelBuilder.Entity<TaskActivity>()
                .Property(ta => ta.Description)
                .HasMaxLength(500);

            modelBuilder.Entity<TaskActivity>()
                .Property(ta => ta.OldValue)
                .HasMaxLength(100);

            modelBuilder.Entity<TaskActivity>()
                .Property(ta => ta.NewValue)
                .HasMaxLength(100);

            // Configure ProjectSettings entity
            modelBuilder.Entity<ProjectSettings>()
                .HasKey(ps => ps.Id);

            modelBuilder.Entity<ProjectSettings>()
                .Property(ps => ps.ProjectId)
                .IsRequired();

            modelBuilder.Entity<ProjectSettings>()
                .HasIndex(ps => ps.ProjectId)
                .IsUnique();

            // Configure ProjectLabel entity
            modelBuilder.Entity<ProjectLabel>()
                .HasKey(pl => pl.Id);

            modelBuilder.Entity<ProjectLabel>()
                .Property(pl => pl.ProjectId)
                .IsRequired();

            modelBuilder.Entity<ProjectLabel>()
                .Property(pl => pl.Name)
                .HasMaxLength(50)
                .IsRequired();

            modelBuilder.Entity<ProjectLabel>()
                .Property(pl => pl.Color)
                .HasMaxLength(7)
                .IsRequired();

            // Configure ProjectWorkflowStage entity
            modelBuilder.Entity<ProjectWorkflowStage>()
                .HasKey(pws => pws.Id);

            modelBuilder.Entity<ProjectWorkflowStage>()
                .Property(pws => pws.ProjectId)
                .IsRequired();

            modelBuilder.Entity<ProjectWorkflowStage>()
                .Property(pws => pws.Name)
                .HasMaxLength(50)
                .IsRequired();

            modelBuilder.Entity<ProjectWorkflowStage>()
                .Property(pws => pws.Color)
                .HasMaxLength(7);

            // Configure ProjectInvitation entity
            modelBuilder.Entity<ProjectInvitation>()
                .HasKey(pi => pi.Id);

            modelBuilder.Entity<ProjectInvitation>()
                .Property(pi => pi.ProjectId)
                .IsRequired();

            modelBuilder.Entity<ProjectInvitation>()
                .Property(pi => pi.InviterId)
                .IsRequired();

            modelBuilder.Entity<ProjectInvitation>()
                .Property(pi => pi.InviteeId)
                .IsRequired();

            modelBuilder.Entity<ProjectInvitation>()
                .Property(pi => pi.Role)
                .HasConversion<int>()
                .IsRequired();

            modelBuilder.Entity<ProjectInvitation>()
                .Property(pi => pi.Status)
                .HasConversion<int>()
                .IsRequired();

            modelBuilder.Entity<ProjectInvitation>()
                .Property(pi => pi.Message)
                .HasMaxLength(500);

            // Create unique index to prevent duplicate pending invitations
            modelBuilder.Entity<ProjectInvitation>()
                .HasIndex(pi => new { pi.ProjectId, pi.InviteeId, pi.Status })
                .HasFilter("Status = 0") // Only for pending invitations
                .IsUnique();

            // Configure navigation properties
            modelBuilder.Entity<ProjectInvitation>()
                .HasOne(pi => pi.Project)
                .WithMany()
                .HasForeignKey(pi => pi.ProjectId)
                .OnDelete(DeleteBehavior.Cascade);

            modelBuilder.Entity<ProjectInvitation>()
                .HasOne(pi => pi.Inviter)
                .WithMany()
                .HasForeignKey(pi => pi.InviterId)
                .OnDelete(DeleteBehavior.Restrict);

            modelBuilder.Entity<ProjectInvitation>()
                .HasOne(pi => pi.Invitee)
                .WithMany()
                .HasForeignKey(pi => pi.InviteeId)
                .OnDelete(DeleteBehavior.Restrict);
        }
    }
}
