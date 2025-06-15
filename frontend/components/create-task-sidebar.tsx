"use client"

import React, { useEffect, useRef, useCallback, useMemo } from "react"
import { ArrowLeft, Loader2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { CreateTaskSidebarProps } from "@/lib/types"
import { TASK_TYPES, TASK_STAGES } from "@/lib/task-constants"
import { useTaskForm } from "@/hooks/use-task-form"
import { useProjectParticipants } from "@/hooks/use-project-participants"
import { useAIAssistant } from "@/hooks/use-ai-assistant"
import { 
  AssigneeSelector, 
  LabelSelector, 
  DatePicker, 
  PrioritySelector, 
  AIDescriptionAssistant 
} from "@/components/task"

export function CreateTaskSidebar({
  open,
  onOpenChange,
  initialStage = "To Do",
  onTaskCreated,
  projectPublicId,
  selectedColumnId,
}: CreateTaskSidebarProps) {
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Custom hooks
  const { formData, errors, isSubmitting, updateFormData, handleSubmit, resetForm } = useTaskForm({
    initialStage,
    onTaskCreated,
    onClose: () => onOpenChange(false),
    projectPublicId,
  })

  const { teamMembers } = useProjectParticipants(projectPublicId, open)

  const {
    isGenerating,
    suggestion,
    generateDescription,
    shortenDescription,
    expandDescription,
    applySuggestion,
    dismissSuggestion,
    regenerate,
  } = useAIAssistant()

  // Reset form and focus on title when sidebar opens
  useEffect(() => {
    if (open) {
      resetForm()
      setTimeout(() => titleInputRef.current?.focus(), 100)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open])

  // Handle keyboard shortcuts
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // AI Assistant handlers - memoized to prevent infinite loops
  const handleAIGenerate = useCallback(() => {
    generateDescription(formData.title, formData.stage)
  }, [generateDescription, formData.title, formData.stage])

  const handleAIShorten = useCallback(() => {
    shortenDescription(formData.description)
  }, [shortenDescription, formData.description])

  const handleAIExpand = useCallback(() => {
    expandDescription(formData.description)
  }, [expandDescription, formData.description])

  const handleAIApply = useCallback(() => {
    const suggestion = applySuggestion()
    if (suggestion) {
      updateFormData({ description: suggestion })
    }
  }, [applySuggestion, updateFormData])

  const handleAIRegenerate = useCallback(() => {
    regenerate(formData.title, formData.stage)
  }, [regenerate, formData.title, formData.stage])

  // Memoize hasDescription to prevent unnecessary re-renders
  const hasDescription = useMemo(() => {
    return Boolean(formData.description && formData.description.trim().length > 0)
  }, [formData.description])

  // Convert priority number to string for display
  const getPriorityString = (priority: number) => {
    switch (priority) {
      case 3: return "high"
      case 2: return "medium"  
      case 1: return "low"
      default: return "high"
    }
  }

  // Convert priority string to number for storage
  const getPriorityNumber = (priority: string) => {
    switch (priority) {
      case "high": return 3
      case "medium": return 2
      case "low": return 1
      default: return 3
    }
  }

  if (!open) return null

  return (
    <>
      {/* Sidebar Layout */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[350px] bg-white dark:bg-gray-800 border-l shadow-lg z-50 flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
          "md:w-[350px] sm:w-[320px]",
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Header */}
        <div className="p-2 border-b flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-medium">Create Task</h2>
        </div>

        {/* Form Content */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-4">
            {/* Task Title */}
            <div className="space-y-2">
              <Label htmlFor="title" className="flex items-center">
                Task Title <span className="text-red-500 ml-1">*</span>
              </Label>
              <Input
                id="title"
                ref={titleInputRef}
                value={formData.title}
                onChange={(e) => updateFormData({ title: e.target.value })}
                placeholder="Enter task title"
                className={cn(errors.title && "border-red-500")}
              />
              {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
            </div>

            {/* Description with AI Assistant */}
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => updateFormData({ description: e.target.value })}
                placeholder="Enter task description"
                rows={3}
              />

              <AIDescriptionAssistant
                isGenerating={isGenerating}
                suggestion={suggestion}
                onGenerate={handleAIGenerate}
                onShorten={handleAIShorten}
                onExpand={handleAIExpand}
                onApply={handleAIApply}
                onDismiss={dismissSuggestion}
                onRegenerate={handleAIRegenerate}
                hasDescription={hasDescription}
              />
            </div>

            {/* Type and Status */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select value={formData.type} onValueChange={(value) => updateFormData({ type: value })}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_TYPES.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={formData.stage} onValueChange={(value) => updateFormData({ stage: value })}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    {TASK_STAGES.map((stage) => (
                      <SelectItem key={stage.id} value={stage.name}>
                        {stage.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Assignee and Labels */}
            <div className="grid grid-cols-2 gap-4">
              <AssigneeSelector
                teamMembers={teamMembers}
                value={formData.assigneeId || null}
                onChange={(value) => updateFormData({ assigneeId: value || undefined })}
              />

              <LabelSelector
                value={formData.labels}
                onChange={(labels) => updateFormData({ labels })}
              />
            </div>

            {/* Due Date and Priority */}
            <div className="grid grid-cols-2 gap-4">
              <DatePicker
                value={formData.dueDate}
                onChange={(dueDate) => updateFormData({ dueDate })}
                label="Due Date"
                placeholder="Set due date"
              />

              <PrioritySelector
                value={getPriorityString(formData.priority)}
                onChange={(priority) => updateFormData({ priority: getPriorityNumber(priority) })}
              />
            </div>

            {/* Estimate */}
            <div className="space-y-2">
              <Label htmlFor="estimate">Estimate (hours)</Label>
              <Input
                id="estimate"
                type="number"
                min="0"
                step="0.5"
                value={formData.estimate || ""}
                onChange={(e) => updateFormData({ estimate: e.target.value ? Number(e.target.value) : undefined })}
                placeholder="Enter estimate"
              />
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Backdrop */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 z-40 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => onOpenChange(false)}
      />
    </>
  )
}
