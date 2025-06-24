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
      if (!projectPublicId) {
        throw new Error("Missing project id")
      }

      // Fetch workflow stages to get dynamic mapping
      let stageToStatusMap: Record<string, number> = {}
      
      try {
        const token = localStorage.getItem('token')
        const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:5062'
        
        const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/settings/workflow`, {
          headers: { 
            'Authorization': `Bearer ${token}`, 
            'Content-Type': 'application/json' 
          },
        })

        if (response.ok) {
          const workflowData = await response.json()
          let stagesArray = []
          
          // Handle .NET serialization format
          if (Array.isArray(workflowData)) {
            stagesArray = workflowData
          } else if (workflowData && workflowData.$values && Array.isArray(workflowData.$values)) {
            stagesArray = workflowData.$values
          }
          
          // Sort stages by order and create mapping based on position
          stagesArray.sort((a: any, b: any) => a.order - b.order)
          
          // Map workflow stage names to TaskStatus enum values (1-based)
          stagesArray.forEach((stage: any, index: number) => {
            stageToStatusMap[stage.name] = index + 1 // TaskStatus enum is 1-based
          })
          
          console.log('🎯 Dynamic stage mapping:', stageToStatusMap)
        }
      } catch (error) {
        console.warn('Failed to fetch workflow stages, using fallback mapping:', error)
      }
      
      // Fallback to default mapping if dynamic mapping failed or is empty
      if (Object.keys(stageToStatusMap).length === 0) {
        stageToStatusMap = {
          "To Do": 1,
          "In Progress": 2,
          "In Review": 3,
          "Review": 3,
          "Done": 4,
        }
        console.log('🎯 Using fallback stage mapping:', stageToStatusMap)
      }

      const statusId = stageToStatusMap[formData.stage] ?? 1
      console.log('🎯 Creating task with stage:', formData.stage, 'mapped to status ID:', statusId)

      const payload: Record<string, any> = {
        title: formData.title,
        description: formData.description,
        assigneeId: formData.assigneeId || null,
        labels: formData.labels.length ? formData.labels : undefined,
        dueDate: formData.dueDate ? new Date(formData.dueDate).toISOString() : undefined,
        priority: formData.priority,
        estimatedHours: formData.estimate ?? undefined,
        type: formData.type,
        status: statusId,
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