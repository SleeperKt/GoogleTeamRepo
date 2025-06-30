using ProjectHub.Core.Entities;

namespace NUnitTests.TestData
{
    public static class ProjectTestData
    {
        public static IEnumerable<TestCaseData> ValidProjects
        {
            get
            {
                yield return new TestCaseData("Test Project 1", "A test project for unit testing", ProjectStatus.Active, ProjectPriority.Medium);
                yield return new TestCaseData("Test Project 2", "Another test project", ProjectStatus.Active, ProjectPriority.High);
                yield return new TestCaseData("Test Project 3", "A low priority project", ProjectStatus.Active, ProjectPriority.Low);
            }
        }

        public static IEnumerable<TestCaseData> ValidTasks
        {
            get
            {
                yield return new TestCaseData("Test Task 1", "A simple test task", ProjectHub.Core.Entities.TaskStatus.Todo, TaskStage.Planning, 1);
                yield return new TestCaseData("Test Task 2", "A task in progress", ProjectHub.Core.Entities.TaskStatus.InProgress, TaskStage.Development, 2);
                yield return new TestCaseData("Test Task 3", "A completed task", ProjectHub.Core.Entities.TaskStatus.Done, TaskStage.Testing, 3);
            }
        }

        public static IEnumerable<TestCaseData> ValidLabels
        {
            get
            {
                yield return new TestCaseData("Bug", "#ef4444");
                yield return new TestCaseData("Feature", "#10b981");
                yield return new TestCaseData("Documentation", "#3b82f6");
                yield return new TestCaseData("Enhancement", "#f59e0b");
            }
        }

        public static IEnumerable<TestCaseData> ValidWorkflowStages
        {
            get
            {
                yield return new TestCaseData("To Do", "#6b7280", false);
                yield return new TestCaseData("In Progress", "#3b82f6", false);
                yield return new TestCaseData("Review", "#f59e0b", false);
                yield return new TestCaseData("Done", "#10b981", true);
            }
        }

        public static IEnumerable<TestCaseData> ValidTaskComments
        {
            get
            {
                yield return new TestCaseData("This is a test comment");
                yield return new TestCaseData("Another test comment with more content");
                yield return new TestCaseData("Comment with special characters: !@#$%^&*()");
            }
        }

        public static IEnumerable<TestCaseData> ValidInvitations
        {
            get
            {
                yield return new TestCaseData("test1@example.com", ParticipantRole.Editor, "Please join our project");
                yield return new TestCaseData("test2@example.com", ParticipantRole.Viewer, "You can view the project");
                yield return new TestCaseData("test3@example.com", ParticipantRole.Editor);
            }
        }
    }
} 