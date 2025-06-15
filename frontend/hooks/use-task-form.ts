import { useState, useEffect, useCallback } from "react"
import { TaskFormData, TaskFormErrors } from "@/lib/types"
import { apiRequest } from "@/lib/api"

interface UseTaskFormProps {
  initialStage?: string
  onTaskCreated?: (task: any) => void
  onClose: () => void
  projectPublicId?: string
}

export function useTaskForm({ initialStage = "To Do", onTaskCreated, onClose, projectPublicId }: UseTaskFormProps) {
  // Form state
  const [formData, setFormData] = useState<TaskFormData>({
    title: "",
    description: "",
    assigneeId: undefined,
    labels: [],
    dueDate: undefined,
    priority: 3, // high priority
    estimate: undefined,
    type: "feature",
    stage: initialStage,
  })

  const [errors, setErrors] = useState<TaskFormErrors>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Reset form when initialStage changes
  useEffect(() => {
    setFormData(prev => ({
      ...prev,
      stage: initialStage,
    }))
  }, [initialStage])

  const updateFormData = useCallback((updates: Partial<TaskFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }, [])

  const validateForm = (): boolean => {
    const newErrors: TaskFormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = useCallback(async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      // Map stage string to TaskStatus enum id
      const stageToStatusMap: Record<string, number> = {
        "To Do": 1,
        "In Progress": 2,
        "Review": 3,
        "Done": 4,
      }

      if (!projectPublicId) {
        throw new Error("Missing project id")
      }

      const payload: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        assigneeId: formData.assigneeId || null,
        labels: formData.labels.length ? formData.labels : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        priority: formData.priority,
        estimatedHours: formData.estimate ?? undefined,
        type: formData.type,
        status: stageToStatusMap[formData.stage] ?? 1,
      }

      const createdTask = await apiRequest<any>(
        `/api/projects/public/${projectPublicId}/tasks`,
        {
          method: "POST",
          body: JSON.stringify(payload),
        }
      )

      if (onTaskCreated) {
        onTaskCreated(createdTask)
      }

      onClose()
    } catch (error) {
      console.error("Failed to create task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }, [formData, onTaskCreated, onClose, projectPublicId])

  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      assigneeId: undefined,
      labels: [],
      dueDate: undefined,
      priority: 3,
      estimate: undefined,
      type: "feature",
      stage: initialStage,
    })
    setErrors({})
  }, [initialStage])

  return {
    formData,
    errors,
    isSubmitting,
    updateFormData,
    handleSubmit,
    resetForm,
  }
} 