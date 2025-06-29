import { apiRequest } from './api'

export interface AIServiceOptions {
  title: string
  stage: string
  projectId?: string
  taskType?: string
  priority?: number
  labels?: string[]
  dueDate?: string
  estimatedHours?: number
  description?: string
}

// AI Service Response interface
interface AIResponse {
  success: boolean
  content: string
  usage_info?: {
    model: string
    prompt_tokens: number
    completion_tokens: number
  }
  error?: string
}

// Task context for AI requests (simplified)
interface TaskContext {
  title: string
  description: string
  stage: string
  task_type: string
  priority: number
  labels: string[]
  due_date?: string
  estimated_hours?: number
}

// AI Generate Request interface (simplified)
interface AIGenerateRequest {
  task: TaskContext
}

// AI Process Request interface
interface AIProcessRequest {
  content: string
  context?: Record<string, any>
}

// Configuration for stage actions
interface StageConfig {
  keywords: string[]
  action: string
}

// Configuration for task type guidance
interface TaskTypeConfig {
  keywords: string[]
  guidance: string
}

// Stage configuration
const STAGE_CONFIGS: StageConfig[] = [
  {
    keywords: ['to do', 'todo', 'planned', 'backlog'],
    action: 'Plan and begin implementation. Review requirements, identify dependencies, and create detailed approach.'
  },
  {
    keywords: ['progress', 'development', 'working', 'active'],
    action: 'Continue active development. Focus on core implementation, testing, and ensuring quality standards.'
  },
  {
    keywords: ['review', 'testing', 'qa'],
    action: 'Complete final review process. Address feedback, ensure acceptance criteria are met.'
  },
  {
    keywords: ['done', 'completed', 'finished'],
    action: 'Task completed successfully. Verify deliverables and update documentation.'
  },
  {
    keywords: ['cancelled', 'canceled'],
    action: 'Task cancelled. Archive related work and update project documentation.'
  }
]

// Task type configuration
const TASK_TYPE_CONFIGS: TaskTypeConfig[] = [
  {
    keywords: ['api', 'endpoint'],
    guidance: 'Technical: Design RESTful endpoints, implement error handling, add validation, write tests, update docs.'
  },
  {
    keywords: ['ui', 'component', 'frontend'],
    guidance: 'Technical: Create responsive components, implement state management, ensure accessibility, add tests.'
  },
  {
    keywords: ['database', 'db', 'migration'],
    guidance: 'Technical: Design schema, create migrations, implement validation, add indexing, test integrity.'
  },
  {
    keywords: ['bug', 'fix', 'issue'],
    guidance: 'Technical: Identify root cause, implement targeted fix, add regression tests, verify in environments.'
  }
]

// Default configurations
const DEFAULT_TASK_GUIDANCE = 'Technical: Define acceptance criteria, break into subtasks, identify dependencies, implement with testing.'
const DEFAULT_ACCEPTANCE_CRITERIA = 'Acceptance: Requirements met, code tested, documentation updated, quality maintained.'
const MAX_DESCRIPTION_LENGTH = 400
const TRUNCATE_LENGTH = 380

export class AIService {
  private static readonly AI_BASE_URL = process.env.NEXT_PUBLIC_AI_API_URL || 'http://localhost:8000'

  /**
   * Generate a task description using simplified context
   */
  static async generateDescription({
    title,
    stage,
    taskType = 'task',
    priority = 1,
    labels = [],
    dueDate,
    estimatedHours,
    description = ''
  }: AIServiceOptions): Promise<string> {
    try {
      const taskContext: TaskContext = {
        title,
        description,
        stage,
        task_type: taskType,
        priority,
        labels,
        due_date: dueDate,
        estimated_hours: estimatedHours
      }

      const request: AIGenerateRequest = {
        task: taskContext
      }

      const response = await fetch(`${this.AI_BASE_URL}/generate-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`AI Service error: ${response.status}`)
      }

      const result: AIResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to generate description')
      }

      return result.content
    } catch (error) {
      console.error('AI Service Error:', error)
      // Fallback to a basic description if AI service fails
      return this.getFallbackDescription(title, stage, description)
    }
  }

  /**
   * Shorten an existing task description
   */
  static async shortenDescription(description: string): Promise<string> {
    try {
      const request: AIProcessRequest = {
        content: description
      }

      const response = await fetch(`${this.AI_BASE_URL}/shorten-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`AI Service error: ${response.status}`)
      }

      const result: AIResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to shorten description')
      }

      return result.content
    } catch (error) {
      console.error('AI Service Error:', error)
      return this.getFallbackShorten(description)
    }
  }

  /**
   * Expand an existing task description
   */
  static async expandDescription(description: string): Promise<string> {
    try {
      const request: AIProcessRequest = {
        content: description
      }

      const response = await fetch(`${this.AI_BASE_URL}/expand-description`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${this.getAuthToken()}`
        },
        body: JSON.stringify(request)
      })

      if (!response.ok) {
        throw new Error(`AI Service error: ${response.status}`)
      }

      const result: AIResponse = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || 'Failed to expand description')
      }

      return result.content
    } catch (error) {
      console.error('AI Service Error:', error)
      return this.getFallbackExpand(description)
    }
  }

  /**
   * Get authentication token from localStorage
   */
  private static getAuthToken(): string | null {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token')
    }
    return null
  }

  /**
   * Find matching configuration based on keywords
   */
  private static findMatchingConfig<T extends { keywords: string[] }>(
    configs: T[],
    searchText: string
  ): T | null {
    const lowerSearchText = searchText.toLowerCase()
    return configs.find(config => 
      config.keywords.some(keyword => lowerSearchText.includes(keyword))
    ) || null
  }

  /**
   * Get stage-specific action
   */
  private static getStageAction(stage: string): string {
    const config = this.findMatchingConfig(STAGE_CONFIGS, stage)
    return config ? config.action : `Complete this ${stage} task with attention to quality and detail.`
  }

  /**
   * Get task type specific guidance
   */
  private static getTaskTypeGuidance(title: string): string {
    const config = this.findMatchingConfig(TASK_TYPE_CONFIGS, title)
    return config ? config.guidance : DEFAULT_TASK_GUIDANCE
  }

  /**
   * Truncate description to fit database limits
   */
  private static truncateDescription(description: string): string {
    if (description.length <= MAX_DESCRIPTION_LENGTH) {
      return description
    }

    const truncated = description.substring(0, TRUNCATE_LENGTH)
    const lastSpace = truncated.lastIndexOf(' ')
    
    if (lastSpace > 800) {
      return truncated.substring(0, lastSpace) + '...'
    }
    
    return truncated + '...'
  }

  /**
   * Format existing description for inclusion
   */
  private static formatExistingDescription(existingDescription: string): string {
    if (!existingDescription || !existingDescription.trim()) {
      return ''
    }

    const truncated = existingDescription.length > 200 
      ? existingDescription.substring(0, 200) + '...' 
      : existingDescription

    return `Existing: ${truncated}\n\n`
  }

  /**
   * Fallback description generator when AI service is unavailable
   */
  private static getFallbackDescription(title: string, stage: string, existingDescription?: string): string {
    const stageAction = this.getStageAction(stage)
    const taskGuidance = this.getTaskTypeGuidance(title)
    const existingDesc = this.formatExistingDescription(existingDescription || '')
    
    const description = [
      `${title}`,
      ``,
      `Current Stage: ${stage}`,
      ``,
      existingDesc,
      stageAction,
      ``,
      taskGuidance,
      ``,
      DEFAULT_ACCEPTANCE_CRITERIA
    ].join('\n')
    
    return this.truncateDescription(description)
  }

  /**
   * Fallback for shortening descriptions
   */
  private static getFallbackShorten(description: string): string {
    // Simple fallback: take first 100 characters and add ellipsis if needed
    return description.length > 100 ? description.substring(0, 97) + '...' : description
  }

  /**
   * Fallback for expanding descriptions
   */
  private static getFallbackExpand(description: string): string {
    return `${description}\n\nAdditional considerations:\n- Review requirements carefully\n- Test thoroughly before completion\n- Document any changes made`
  }
} 