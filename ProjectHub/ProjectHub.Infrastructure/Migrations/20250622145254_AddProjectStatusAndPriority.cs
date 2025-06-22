using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace ProjectHub.Infrastructure.Migrations
{
    /// <inheritdoc />
    public partial class AddProjectStatusAndPriority : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "Priority",
                table: "Projects",
                type: "INTEGER",
                nullable: false,
                defaultValue: 2); // Medium priority

            migrationBuilder.AddColumn<int>(
                name: "Status",
                table: "Projects",
                type: "INTEGER",
                nullable: false,
                defaultValue: 1); // Active status
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "Priority",
                table: "Projects");

            migrationBuilder.DropColumn(
                name: "Status",
                table: "Projects");
        }
    }
}
