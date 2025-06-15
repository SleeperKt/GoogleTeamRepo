import { useState, useEffect } from "react"
import { TaskFormData, TaskFormErrors } from "@/lib/types"

interface UseTaskFormProps {
  initialStage?: string
  onTaskCreated?: (task: any) => void
  onClose: () => void
}

export function useTaskForm({ initialStage = "To Do", onTaskCreated, onClose }: UseTaskFormProps) {
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

  const updateFormData = (updates: Partial<TaskFormData>) => {
    setFormData(prev => ({ ...prev, ...updates }))
  }

  const validateForm = (): boolean => {
    const newErrors: TaskFormErrors = {}

    if (!formData.title.trim()) {
      newErrors.title = "Title is required"
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async () => {
    if (!validateForm()) {
      return
    }

    setIsSubmitting(true)

    try {
      const newTask = {
        title: formData.title,
        description: formData.description,
        assigneeId: formData.assigneeId,
        labels: formData.labels,
        dueDate: formData.dueDate,
        priority: formData.priority,
        estimate: formData.estimate,
      }

      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))

      if (onTaskCreated) {
        onTaskCreated(newTask)
      }

      onClose()
    } catch (error) {
      console.error("Failed to create task:", error)
    } finally {
      setIsSubmitting(false)
    }
  }

  const resetForm = () => {
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
  }

  return {
    formData,
    errors,
    isSubmitting,
    updateFormData,
    handleSubmit,
    resetForm,
  }
} 