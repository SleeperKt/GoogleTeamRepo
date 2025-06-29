import { useState } from "react"
import { AIService } from "@/lib/ai-service"

export interface AIAssistantOptions {
  projectId?: string
  taskType?: string
  priority?: number
  labels?: string[]
  dueDate?: string
  estimatedHours?: number
  currentDescription?: string
}

export function useAIAssistant(options: AIAssistantOptions = {}) {
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  const generateDescription = async (
    title: string, 
    stage: string,
    overrideOptions?: Partial<AIAssistantOptions>
  ) => {
    setIsGenerating(true)
    try {
      const finalOptions = { ...options, ...overrideOptions }
      const result = await AIService.generateDescription({ 
        title, 
        stage,
        projectId: finalOptions.projectId,
        taskType: finalOptions.taskType,
        priority: finalOptions.priority,
        labels: finalOptions.labels,
        dueDate: finalOptions.dueDate,
        estimatedHours: finalOptions.estimatedHours,
        description: finalOptions.currentDescription
      })
      setSuggestion(result)
    } catch (error) {
      console.error("Failed to generate AI description:", error)
      // Show user-friendly error message
      setSuggestion("Failed to generate AI description. Please try again or check your internet connection.")
    } finally {
      setIsGenerating(false)
    }
  }

  const shortenDescription = async (description: string) => {
    if (!description) return

    setIsGenerating(true)
    try {
      const result = await AIService.shortenDescription(description)
      setSuggestion(result)
    } catch (error) {
      console.error("Failed to shorten description:", error)
      setSuggestion("Failed to shorten description. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const expandDescription = async (description: string) => {
    if (!description) return

    setIsGenerating(true)
    try {
      const result = await AIService.expandDescription(description)
      setSuggestion(result)
    } catch (error) {
      console.error("Failed to expand description:", error)
      setSuggestion("Failed to expand description. Please try again.")
    } finally {
      setIsGenerating(false)
    }
  }

  const applySuggestion = () => {
    const currentSuggestion = suggestion
    setSuggestion(null)
    return currentSuggestion
  }

  const dismissSuggestion = () => {
    setSuggestion(null)
  }

  const regenerate = (
    title: string, 
    stage: string,
    overrideOptions?: Partial<AIAssistantOptions>
  ) => {
    setSuggestion(null)
    generateDescription(title, stage, overrideOptions)
  }

  return {
    isGenerating,
    suggestion,
    generateDescription,
    shortenDescription,
    expandDescription,
    applySuggestion,
    dismissSuggestion,
    regenerate,
  }
} 