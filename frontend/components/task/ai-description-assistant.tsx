"use client"

import { Loader2, Sparkles } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

interface AIDescriptionAssistantProps {
  isGenerating: boolean
  suggestion: string | null
  onGenerate: () => void
  onShorten: () => void
  onExpand: () => void
  onApply: () => void
  onDismiss: () => void
  onRegenerate: () => void
  hasDescription: boolean
}

export function AIDescriptionAssistant({
  isGenerating,
  suggestion,
  onGenerate,
  onShorten,
  onExpand,
  onApply,
  onDismiss,
  onRegenerate,
  hasDescription,
}: AIDescriptionAssistantProps) {
  return (
    <TooltipProvider>
      <div className="border rounded-md p-1.5 bg-violet-50 dark:bg-violet-950/20 mt-1">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <Sparkles className="h-3 w-3 text-violet-500" />
            <h4 className="font-medium text-xs">AI Description Assistant</h4>
          </div>
          <div className="flex items-center gap-1">
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onShorten}
                  disabled={isGenerating || !hasDescription}
                  className="h-5 text-xs px-1.5 py-0"
                >
                  Shorten
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Create a shorter version</p>
              </TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={onExpand}
                  disabled={isGenerating || !hasDescription}
                  className="h-5 text-xs px-1.5 py-0"
                >
                  Expand
                </Button>
              </TooltipTrigger>
              <TooltipContent side="bottom">
                <p className="text-xs">Add more details</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {isGenerating ? (
          <div className="flex items-center justify-center py-2">
            <div className="flex flex-col items-center gap-1">
              <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
              <p className="text-xs text-muted-foreground">Generating...</p>
            </div>
          </div>
        ) : suggestion ? (
          <div className="space-y-1">
            <div className="bg-white dark:bg-gray-800 border rounded-md p-1.5 text-xs whitespace-pre-wrap">
              {suggestion}
            </div>
            <div className="flex items-center justify-end gap-1">
              <Button
                variant="outline"
                size="sm"
                onClick={onDismiss}
                className="h-5 text-xs px-1.5 py-0"
              >
                Dismiss
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={onRegenerate}
                className="h-5 text-xs px-1.5 py-0"
              >
                Regenerate
              </Button>
              <Button
                size="sm"
                className="bg-violet-600 hover:bg-violet-700 text-white h-5 text-xs px-1.5 py-0"
                onClick={onApply}
              >
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <div>
            <Button
              className="w-full bg-violet-600 hover:bg-violet-700 text-white h-6 text-xs"
              onClick={onGenerate}
            >
              <Sparkles className="mr-1 h-3 w-3" />
              Generate with AI
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  )
} 