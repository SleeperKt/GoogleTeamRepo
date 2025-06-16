export interface AIServiceOptions {
  title: string
  stage: string
}

export class AIService {
  static generateDescription({ title, stage }: AIServiceOptions): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        let aiDesc = ""

        if (title.toLowerCase().includes("authentication")) {
          aiDesc = `Implement a secure user authentication flow that includes:

1. Login form with email/username and password fields
2. Registration process with email verification
3. Password reset functionality
4. OAuth integration with Google and GitHub
5. Session management with JWT tokens
6. Rate limiting to prevent brute force attacks

This task is critical for system security and should follow OWASP security best practices.`
        } else if (title.toLowerCase().includes("navigation")) {
          aiDesc = `Fix the responsive navigation menu on mobile devices by addressing the following issues:

1. Menu doesn't close properly after selection on small screens
2. Dropdown submenus are cut off on certain device widths
3. Hamburger icon animation is inconsistent
4. Touch targets are too small on mobile devices

Test on iOS and Android devices with various screen sizes to ensure consistent behavior.`
        } else if (stage === "In Progress") {
          aiDesc = `This task is currently in development. Key implementation details:

1. Follow the design specifications in the attached mockups
2. Ensure responsive behavior across all device sizes
3. Implement proper error handling and loading states
4. Write unit tests for all new functionality
5. Document any API changes or new components
6. Consider accessibility requirements throughout implementation`
        } else {
          aiDesc = `This task involves ${title.toLowerCase()}. Based on the current stage (${stage}), the following should be considered:

1. Define clear acceptance criteria and expected outcomes
2. Identify dependencies on other tasks or systems
3. Document any technical requirements or constraints
4. Consider potential edge cases and error scenarios
5. Estimate effort required for implementation
6. Plan for testing and validation steps`
        }

        resolve(aiDesc)
      }, 1500)
    })
  }

  static shortenDescription(description: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const shortened =
          description.split("\n\n")[0] +
          "\n\nKey points:\n" +
          description
            .split("\n")
            .filter((line) => line.trim().length > 0 && !line.startsWith("Key points:"))
            .slice(1, 4)
            .map((line) => (line.length > 40 ? line.substring(0, 40) + "..." : line))
            .join("\n")

        resolve(shortened)
      }, 1000)
    })
  }

  static expandDescription(description: string): Promise<string> {
    return new Promise((resolve) => {
      setTimeout(() => {
        const expanded =
          description +
          "\n\nAdditional considerations:\n" +
          "1. Ensure cross-browser compatibility\n" +
          "2. Consider performance implications\n" +
          "3. Document any API changes\n" +
          "4. Add appropriate error handling\n" +
          "5. Include accessibility features"

        resolve(expanded)
      }, 1000)
    })
  }
} 