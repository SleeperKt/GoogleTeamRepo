import { useState } from "react"
import { AIService } from "@/lib/ai-service"

export function useAIAssistant() {
  const [isGenerating, setIsGenerating] = useState(false)
  const [suggestion, setSuggestion] = useState<string | null>(null)

  const generateDescription = async (title: string, stage: string) => {
    setIsGenerating(true)
    try {
      const result = await AIService.generateDescription({ title, stage })
      setSuggestion(result)
    } catch (error) {
      console.error("Failed to generate AI description:", error)
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

  const regenerate = (title: string, stage: string) => {
    setSuggestion(null)
    generateDescription(title, stage)
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