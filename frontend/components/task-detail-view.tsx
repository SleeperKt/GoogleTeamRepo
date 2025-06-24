"use client"

import { useState, useEffect, useRef } from "react"
import {
  ArrowLeft,
  Calendar,
  Check,
  ChevronsUpDown,
  Clock,
  Loader2,
  Sparkles,
  X,
  MessageSquare,
  Paperclip,
  FileText,
  ArrowRight,
  Trash,
  Tag,
} from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar as CalendarComponent } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { apiRequest } from "@/lib/api"
import { useProjectLabels } from "@/hooks/use-project-labels"
import { useProjectWorkflowStages } from "@/hooks/use-project-workflow-stages"
import { useUserPermissions } from "@/hooks/use-user-permissions"
import React from "react"

// Unified team member type used in this component
interface TeamMember {
  id: string | number
  name: string
  email: string
  avatar: string
  initials: string
}

// Labels are now fetched dynamically using the useProjectLabels hook

const priorities = [
  { value: "high", label: "High", color: "text-red-500" },
  { value: "medium", label: "Medium", color: "text-yellow-500" },
  { value: "low", label: "Low", color: "text-blue-500" },
]

// Dynamic statuses are now loaded from useProjectWorkflowStages hook

// Sample activity data
const sampleActivities = [
  {
    id: 1,
    type: "status_change",
    user: { id: 1, name: "System", email: "", avatar: "", initials: "SY" },
    oldValue: "To Do",
    newValue: "In Progress",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2), // 2 hours ago
  },
]

// Sample comments
const sampleComments: any[] = []

// Sample attachments
const sampleAttachments: any[] = []

interface TaskDetailViewProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  task: any
  onTaskUpdated?: (updatedTask: any, isOptimistic?: boolean) => void
  onTaskDeleted?: (taskId: string | number) => void
  onTaskUpdateFailed?: (originalTask: any, attemptedChanges: any) => void
  projectPublicId?: string
  isDragging?: boolean
  readOnly?: boolean
}

// Helper to derive stage string from status value (number or string) using dynamic workflow stages
const mapStatusToStage = (statusValue: any, workflowStages: any[]): string => {
  if (!workflowStages || workflowStages.length === 0) {
    // Fallback to default stage names if no workflow stages are loaded
    if (typeof statusValue === 'number') {
      switch (statusValue) {
        case 1: return 'To Do'
        case 2: return 'In Progress'
        case 3: return 'In Review'
        case 4: return 'Done'
        default: return 'To Do'
      }
    }
    if (typeof statusValue === 'string') {
      const s = statusValue.toLowerCase()
      if (s === 'todo') return 'To Do'
      if (s === 'inprogress') return 'In Progress'
      if (s === 'in review' || s === 'inreview') return 'In Review'
      if (s === 'done') return 'Done'
    }
    return 'To Do'
  }

  // Map status value to workflow stage name based on order
  const sortedStages = [...workflowStages].sort((a, b) => a.order - b.order)
  
  if (typeof statusValue === 'number') {
    // Status values are 1-based, but array indices are 0-based
    const stageIndex = statusValue - 1
    if (stageIndex >= 0 && stageIndex < sortedStages.length) {
      return sortedStages[stageIndex].name
    }
    // If status value is out of range, return first stage
    return sortedStages.length > 0 ? sortedStages[0].name : 'To Do'
  }
  
  if (typeof statusValue === 'string') {
    // Try to find exact match first
    const exactMatch = sortedStages.find(stage => stage.name.toLowerCase() === statusValue.toLowerCase())
    if (exactMatch) return exactMatch.name
    
    // Fallback to partial matching
    const s = statusValue.toLowerCase()
    if (s === 'todo' && sortedStages.length > 0) return sortedStages[0].name
    if (s === 'inprogress' && sortedStages.length > 1) return sortedStages[1].name
    if ((s === 'in review' || s === 'inreview') && sortedStages.length > 2) return sortedStages[2].name
    if (s === 'done' && sortedStages.length > 3) return sortedStages[3].name
  }
  
  // Final fallback
  return sortedStages.length > 0 ? sortedStages[0].name : 'To Do'
}

const TaskDetailViewComponent = function TaskDetailView({
  open,
  onOpenChange,
  task: initialTask,
  onTaskUpdated,
  onTaskDeleted,
  onTaskUpdateFailed,
  projectPublicId,
  isDragging = false,
  readOnly = false,
}: TaskDetailViewProps) {
  console.log('🔧 TaskDetailView: Rendered with onTaskUpdated callback:', !!onTaskUpdated);
  
  // Use dynamic labels and workflow stages
  const { labels } = useProjectLabels(projectPublicId)
  const { stages: workflowStages } = useProjectWorkflowStages(projectPublicId)
  const permissions = useUserPermissions(projectPublicId)
  
  // Task state
  const [task, setTask] = useState(initialTask)
  const [title, setTitle] = useState(initialTask?.title || "")
  const [description, setDescription] = useState(initialTask?.description || "")
  const [assignee, setAssignee] = useState<string | number | null>(initialTask?.assigneeId || null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedLabels, setSelectedLabels] = useState<number[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>(
    initialTask?.dueDate ? new Date(initialTask.dueDate) : undefined
  )
  const [priority, setPriority] = useState<string | undefined>(
    initialTask?.priority ? 
      initialTask.priority === 1 ? "low" :
      initialTask.priority === 2 ? "medium" :
      initialTask.priority === 3 ? "high" :
      initialTask.priority === 4 ? "critical" : "medium"
    : undefined
  )
  const [stage, setStage] = useState(
    mapStatusToStage(initialTask?.status, workflowStages)
  )
  const [estimate, setEstimate] = useState<number | undefined>(initialTask?.estimatedHours || undefined)

  // UI state
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)
  const [newComment, setNewComment] = useState("")
  const [comments, setComments] = useState<any[]>([])
  const [activities, setActivities] = useState<any[]>([])
  const [attachments, setAttachments] = useState<any[]>(sampleAttachments)
  const [loadingComments, setLoadingComments] = useState(false)
  const [loadingActivities, setLoadingActivities] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [showAllActivities, setShowAllActivities] = useState(false)
  const [expandedSections, setExpandedSections] = useState<string[]>(["description", "details", "ai"])

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null)
  const commentInputRef = useRef<HTMLTextAreaElement>(null)

  // Initialize selected labels when labels are loaded and task data is available
  useEffect(() => {
    if (!labels || labels.length === 0 || !initialTask?.labels || !Array.isArray(initialTask.labels)) {
      setSelectedLabels([])
      return
    }
    
    const mappedLabels = initialTask.labels
      .map((label: any) => {
        if (!label) return null
        
        // label can be a string (name) or an object with a name field
        const labelName = typeof label === 'string' ? label : (label?.name ?? '')
        if (!labelName || typeof labelName !== 'string') return null
        
        const foundLabel = labels.find((l) => l.name === labelName.trim())
        return foundLabel?.id || null
      })
      .filter((id: any): id is number => typeof id === 'number')
    
    setSelectedLabels(mappedLabels)
  }, [labels, initialTask?.labels])

  // Update task state when initialTask changes
  useEffect(() => {
    setTask(initialTask)
    setTitle(initialTask?.title || "")
    setDescription(initialTask?.description || "")
    setAssignee(initialTask?.assigneeId || null)
    setDueDate(initialTask?.dueDate ? new Date(initialTask.dueDate) : undefined)
    setPriority(initialTask?.priority ? 
      initialTask.priority === 1 ? "low" :
      initialTask.priority === 2 ? "medium" :
      initialTask.priority === 3 ? "high" :
      initialTask.priority === 4 ? "critical" : "medium"
    : undefined)
    setStage(mapStatusToStage(initialTask?.status, workflowStages))
    setEstimate(initialTask?.estimatedHours || undefined)
  }, [initialTask, workflowStages])

  // Update stage when workflow stages are loaded (to fix initial stage selection)
  useEffect(() => {
    if (workflowStages.length > 0 && initialTask?.status) {
      const correctStage = mapStatusToStage(initialTask.status, workflowStages)
      console.log('🔧 TaskDetailView: Setting correct stage:', {
        taskStatus: initialTask.status,
        correctStage,
        availableStages: workflowStages.map(s => ({ id: s.id, name: s.name, order: s.order }))
      })
      setStage(correctStage)
    }
  }, [workflowStages, initialTask?.status])

  // Load project participants when the view opens
  useEffect(() => {
    const loadParticipants = async () => {
      if (!open || !projectPublicId) return

      try {
        const project: { id: number } = await apiRequest(`/api/projects/public/${projectPublicId}`)
        if (!project?.id) return

        const raw = await apiRequest(`/api/projects/${project.id}/participants`)

        const participantArray: Array<any> = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as any)?.$values)
            ? (raw as any).$values
            : []

        const members = participantArray.map((p) => ({
          id: p.userId || p.UserId,
          name: p.userName || p.UserName,
          email: p.email || p.Email || "",
          avatar: "",
          initials: (p.userName || p.UserName || "")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase(),
        }))

        setTeamMembers(members)
      } catch (err) {
        console.error("Failed to load participants for task detail", err)
        setTeamMembers([])
      }
    }

    // Defer loading participants to prevent animation stuttering
    const timeoutId = setTimeout(() => {
      loadParticipants()
    }, 350)
    
    return () => clearTimeout(timeoutId)
  }, [open, projectPublicId])

  // Function to refresh activities
  const refreshActivities = React.useCallback(async () => {
    if (!initialTask?.id || !projectPublicId) return

    try {
      const activitiesData = await apiRequest(`/api/projects/public/${projectPublicId}/tasks/${initialTask.id}/activities`)
      console.log('🔄 Activities refreshed:', activitiesData)
      
      // Handle different response formats
      let activities = []
      if (Array.isArray(activitiesData)) {
        activities = activitiesData
      } else if (activitiesData && Array.isArray((activitiesData as any).$values)) {
        activities = (activitiesData as any).$values
      } else if (activitiesData && (activitiesData as any).activities && Array.isArray((activitiesData as any).activities)) {
        activities = (activitiesData as any).activities
      }
      
      setActivities(activities)
    } catch (err) {
      console.error("Failed to refresh activities", err)
    }
  }, [initialTask?.id, projectPublicId])

  // Throttle the refreshActivities function to prevent excessive calls
  const throttledRefreshActivities = React.useCallback(
    React.useMemo(() => {
      let timeout: NodeJS.Timeout | null = null
      return () => {
        // Skip updates during drag operations to maintain performance
        if (isDragging) return
        
        if (timeout) return
        timeout = setTimeout(() => {
          refreshActivities()
          timeout = null
        }, 300)
      }
    }, [refreshActivities, isDragging]),
    [refreshActivities, isDragging]
  )

  // Load comments and activities when task opens - deferred to prevent animation stuttering
  useEffect(() => {
    if (!open || !initialTask?.id || !projectPublicId) return

    // Defer heavy operations until after the animation completes (300ms)
    const loadTaskData = async () => {
      // Load comments
      setLoadingComments(true)
      try {
        const commentsData = await apiRequest(`/api/projects/public/${projectPublicId}/tasks/${initialTask.id}/comments`)
        
        // Handle different response formats
        let comments = []
        if (Array.isArray(commentsData)) {
          comments = commentsData
        } else if (commentsData && Array.isArray((commentsData as any).$values)) {
          comments = (commentsData as any).$values
        } else if (commentsData && (commentsData as any).comments && Array.isArray((commentsData as any).comments)) {
          comments = (commentsData as any).comments
        }
        
        setComments(comments)
      } catch (err) {
        console.error("Failed to load task comments", err)
        setComments([])
      } finally {
        setLoadingComments(false)
      }

      // Load activities
      setLoadingActivities(true)
      try {
        await refreshActivities()
      } finally {
        setLoadingActivities(false)
      }
    }

    // Delay data loading until animation completes
    const timeoutId = setTimeout(loadTaskData, 350) // Slightly longer than animation duration
    
    return () => clearTimeout(timeoutId)
  }, [open, initialTask?.id, projectPublicId, refreshActivities])

  // Refresh activities when task is updated externally (like via drag & drop)
  useEffect(() => {
    if (!open || !initialTask?.id || isDragging) return // Skip during drag operations
    
    // Use a ref to prevent excessive calls
    const timeoutId = setTimeout(() => {
      throttledRefreshActivities()
    }, 200)

    return () => clearTimeout(timeoutId)
  }, [open, initialTask?.id, initialTask?.status, refreshActivities, isDragging])

  // Periodic activity refresh while detail view is open (every 10 seconds)
  useEffect(() => {
    if (!open || !initialTask?.id || isDragging) return // Skip during drag

    const intervalId = setInterval(() => {
      throttledRefreshActivities()
    }, 10000) // Refresh every 10 seconds

    return () => clearInterval(intervalId)
  }, [open, initialTask?.id, refreshActivities, isDragging])

  // Combine dynamic members with fallback (unique by id)
  const availableMembers = React.useMemo(() => {
    const map = new Map<string | number, any>()
    ;[...teamMembers].forEach((m) => map.set(m.id, m))
    return Array.from(map.values())
  }, [teamMembers])

  // Reset form when task changes
  useEffect(() => {
    console.log('📝 TaskDetailView: Task prop changed, status:', initialTask?.status);
    
    // Skip expensive form updates during drag operations to maintain performance
    if (isDragging) {
      console.log('📝 TaskDetailView: Skipping form update during drag operation');
      return;
    }
    
    if (initialTask) {
      setTask(initialTask)
      setTitle(initialTask.title || "")
      setDescription(initialTask.description || "")
      setAssignee(initialTask.assigneeId || null)
      setSelectedLabels(() => {
        if (!initialTask.labels || !Array.isArray(initialTask.labels)) {
          return []
        }
        
        return initialTask.labels
          .map((label: any) => {
            if (!label) return null
            
            // label can be a string (name) or an object with a name field
            const labelName = typeof label === 'string' ? label : (label?.name ?? '')
            if (!labelName || typeof labelName !== 'string') return null
            
            const foundLabel = labels.find((l) => l.name === labelName.trim())
            return foundLabel?.id || null
          })
          .filter((id: any): id is number => typeof id === 'number')
      })
      setDueDate(initialTask.dueDate ? new Date(initialTask.dueDate) : undefined)
      setPriority(
        initialTask.priority ? 
          initialTask.priority === 1 ? "low" :
          initialTask.priority === 2 ? "medium" :
          initialTask.priority === 3 ? "high" :
          initialTask.priority === 4 ? "critical" : "medium"
        : undefined
      )
      setStage(mapStatusToStage(initialTask.status, workflowStages))
      setEstimate(initialTask.estimatedHours || undefined)
      setHasUnsavedChanges(false)
    }
  }, [initialTask, isDragging, workflowStages, labels])

  // Focus on title input when sidebar opens - defer to prevent animation stuttering
  useEffect(() => {
    if (open) {
      // Use requestAnimationFrame to ensure focus happens after rendering is complete
      requestAnimationFrame(() => {
        setTimeout(() => {
          titleInputRef.current?.focus()
        }, 350) // After animation completes
      })
    }
  }, [open])

  // Helper function to compare arrays
  const arraysEqual = (a: any[], b: any[]) => {
    if (a.length !== b.length) return false
    const sortedA = [...a].sort()
    const sortedB = [...b].sort()
    return sortedA.every((val, idx) => val === sortedB[idx])
  }

  // Mark changes as unsaved when any field changes - optimized with useMemo
  const hasChanges = React.useMemo(() => {
    if (!initialTask) return false
    
    const originalDueDate = initialTask?.dueDate ? new Date(initialTask.dueDate) : undefined
    const originalPriority = initialTask?.priority ? 
      initialTask.priority === 1 ? "low" :
      initialTask.priority === 2 ? "medium" :
      initialTask.priority === 3 ? "high" :
      initialTask.priority === 4 ? "critical" : "medium"
    : undefined
    const originalStage = mapStatusToStage(initialTask?.status, workflowStages)
    
    const dueDateChanged = dueDate?.getTime() !== originalDueDate?.getTime()
    
    const originalLabels = (() => {
      if (!initialTask?.labels || !Array.isArray(initialTask.labels)) {
        return []
      }
      
      return initialTask.labels
        .map((label: any) => {
          if (!label) return null
          
          const labelName = typeof label === 'string' ? label : (label?.name ?? '')
          if (!labelName || typeof labelName !== 'string') return null
          
          const foundLabel = labels.find((l) => l.name === labelName.trim())
          return foundLabel?.id || null
        })
        .filter((id: any): id is number => typeof id === 'number')
    })()
    
    return (
      title !== initialTask?.title ||
      description !== initialTask?.description ||
      assignee !== initialTask?.assigneeId ||
      dueDateChanged ||
      priority !== originalPriority ||
      stage !== originalStage ||
      estimate !== initialTask?.estimatedHours ||
      task?.type !== initialTask?.type ||
      !arraysEqual(selectedLabels, originalLabels)
    )
  }, [title, description, assignee, selectedLabels, dueDate, priority, stage, estimate, initialTask, task, labels, workflowStages])

  // Update unsaved changes state when computed value changes
  useEffect(() => {
    setHasUnsavedChanges(hasChanges)
  }, [hasChanges])

  // Save changes
  const saveChanges = async () => {
    if (!initialTask?.id || !projectPublicId || !onTaskUpdated) return;
    
    // Prevent save operations during drag to maintain performance
    if (isDragging) {
      console.log('📝 TaskDetailView: Skipping save operation during drag');
      return;
    }

    const originalTaskForRevert = JSON.parse(JSON.stringify(initialTask));

    setIsSaving(true);

    // Create dynamic status map from workflow stages
    const statusMap: Record<string, number> = {}
    const sortedStages = [...workflowStages].sort((a, b) => a.order - b.order)
    sortedStages.forEach((stage, index) => {
      statusMap[stage.name] = index + 1 // Status values are 1-based
    })
    
    // Fallback mapping if no workflow stages are available
    if (Object.keys(statusMap).length === 0) {
      statusMap["To Do"] = 1
      statusMap["In Progress"] = 2
      statusMap["In Review"] = 3
      statusMap["Done"] = 4
    }
    const priorityMap: Record<string, number> = {
      low: 1, medium: 2, high: 3, critical: 4,
    };

    const currentAssigneeId = assignee;
    const updatedAssigneeDetails = currentAssigneeId ? teamMembers.find(m => m.id === currentAssigneeId) : null;

    const optimisticUpdatedTask = {
      ...initialTask,
      title,
      description,
      assigneeId: currentAssigneeId,
      assigneeName: updatedAssigneeDetails ? updatedAssigneeDetails.name : (currentAssigneeId === null ? "Unassigned" : initialTask?.assigneeName),
      assignee: updatedAssigneeDetails ? {
        name: updatedAssigneeDetails.name,
        image: updatedAssigneeDetails.avatar,
        initials: updatedAssigneeDetails.initials,
      } : (currentAssigneeId === null ? null : initialTask?.assignee),
      type: task?.type || initialTask?.type,
      labels: selectedLabels
        .map((id) => {
          if (!id || typeof id !== 'number') return null
          const label = labels.find((l) => l.id === id)
          return label?.name || null
        })
        .filter((name): name is string => typeof name === 'string' && name.trim().length > 0),
      dueDate,
      priority: priorityMap[priority || 'medium'] || 2,
      status: statusMap[stage] || 1,
      estimatedHours: estimate,
      comments: comments.length,
      attachments: initialTask?.attachments,
    };

    // Send optimistic update if callback is provided
    if (onTaskUpdated) {
      console.log('🚀 TaskDetailView: Sending optimistic update with status:', optimisticUpdatedTask.status);
      onTaskUpdated(optimisticUpdatedTask, true);
    } else {
      console.warn('❌ TaskDetailView: onTaskUpdated callback is missing!');
    }

    try {
      const payload = {
        title,
        description,
        assigneeId: assignee,
        status: statusMap[stage] || 1,
        dueDate,
        priority: priorityMap[priority || 'medium'] || 2,
        estimatedHours: estimate,
        type: task?.type || 'task',
        labels: selectedLabels
          .map((id) => {
            if (!id || typeof id !== 'number') return null
            const label = labels.find((l) => l.id === id)
            return label?.name || null
          })
          .filter((name): name is string => typeof name === 'string' && name.trim().length > 0),
      };

      const updatedTaskFromAPI = await apiRequest(`/api/projects/public/${projectPublicId}/tasks/${initialTask.id}`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      });

      // Call the success callback with the actual API response
      if (onTaskUpdated && updatedTaskFromAPI) {
        console.log('✅ TaskDetailView: Sending API success update with status:', (updatedTaskFromAPI as any).status);
        onTaskUpdated(updatedTaskFromAPI, false);
      } else {
        console.warn('❌ TaskDetailView: API success callback missing or no API response');
      }

      setTask(optimisticUpdatedTask);
      setHasUnsavedChanges(false);
      onOpenChange(false);

      // Note: Comment count updates are handled in the main task update above

                   // Refresh activities to include any new activities from the task update
      setTimeout(() => {
        refreshActivities()
      }, 100)

    } catch (err) {
      console.error('Failed to save task changes:', err);
      if (onTaskUpdateFailed) {
        onTaskUpdateFailed(originalTaskForRevert, optimisticUpdatedTask);
      }
      setHasUnsavedChanges(true);
    } finally {
      setIsSaving(false);
    }
  };

  // Handle delete task
  const handleDeleteTask = async () => {
    if (!initialTask?.id || !projectPublicId) return

    try {
      // Make API call to delete the task
      await apiRequest(`/api/projects/public/${projectPublicId}/tasks/${initialTask.id}`, {
        method: 'DELETE'
      })

      // Call onTaskDeleted callback on successful deletion
      if (onTaskDeleted) {
        onTaskDeleted(initialTask.id)
      }

      // Close sidebar
      onOpenChange(false)
      setDeleteDialogOpen(false)
    } catch (err) {
      console.error('Failed to delete task:', err)
      // You could show a toast notification here for error feedback
      setDeleteDialogOpen(false)
    }
  }

  // Handle add comment
  const handleAddComment = async () => {
    if (!newComment.trim() || !initialTask?.id || !projectPublicId) return
    
    // Prevent comment operations during drag to maintain performance
    if (isDragging) {
      console.log('📝 TaskDetailView: Skipping add comment during drag');
      return;
    }

    try {
      const commentData = await apiRequest(`/api/projects/public/${projectPublicId}/tasks/${initialTask.id}/comments`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          content: newComment
        })
      })

      // Add the new comment to the list
      const newCommentsArray = [...comments, commentData]
      setComments(newCommentsArray)

      // Notify board page of the new comments count so badge updates
      if (onTaskUpdated && initialTask?.id) {
        try {
          const optimisticTaskUpdate = {
            ...task, // Use current task state, not initialTask
            comments: newCommentsArray.length,
          }
          onTaskUpdated(optimisticTaskUpdate, true)
        } catch (err) {
          console.error('Failed to send optimistic comment count update:', err)
        }
      }

      // Clear the comment input
      setNewComment("")

                   // Refresh activities to include the new comment activity
      setTimeout(() => {
        refreshActivities()
      }, 100)

      // Focus back on comment input
      setTimeout(() => {
        commentInputRef.current?.focus()
      }, 200)
    } catch (err) {
      console.error("Failed to add comment", err)
      // Could show a toast notification here
    }
  }

  // Get assignee name
  const getAssigneeName = () => {
    if (!assignee) return "Unassigned"
    const member = availableMembers.find((member: any) => member.id === assignee)
    if (member) return member.name
    // Fall back to assigneeName from task if member not found in participants
    if (initialTask?.assigneeName) return initialTask.assigneeName
    return "Unassigned"
  }

  // Toggle label selection
  const toggleLabel = (id: number) => {
    setSelectedLabels((prev) => (prev.includes(id) ? prev.filter((labelId) => labelId !== id) : [...prev, id]))
    setHasUnsavedChanges(true)
  }

  // Format timestamp
  const formatTimestamp = (date: Date) => {
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffMins = Math.floor(diffMs / (1000 * 60))
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24))

    // Handle negative differences (future dates) or very small differences
    if (diffMs < 0) {
      return "just now"
    } else if (diffMins < 1) {
      return "just now"
    } else if (diffMins < 60) {
      return `${diffMins} minute${diffMins !== 1 ? "s" : ""} ago`
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`
    } else if (diffDays < 7) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`
    } else {
      // For older dates, show the actual date
      return date.toLocaleDateString()
    }
  }

  // Toggle section expansion
  const toggleSection = (section: string) => {
    setExpandedSections((prev) => (prev.includes(section) ? prev.filter((s) => s !== section) : [...prev, section]))
  }

  // Generate AI description
  const generateAIDescription = () => {
    setIsGeneratingAI(true)

    // Simulate AI generation
    setTimeout(() => {
      // Generate description based on title and stage
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

      setAiSuggestion(aiDesc)
      setIsGeneratingAI(false)
    }, 1500)
  }

  // Apply AI suggestion
  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setDescription(aiSuggestion)
      setAiSuggestion(null)
    }
  }

  // Regenerate AI suggestion
  const regenerateAISuggestion = () => {
    setAiSuggestion(null)
    generateAIDescription()
  }

  // Dismiss AI suggestion
  const dismissAISuggestion = () => {
    setAiSuggestion(null)
  }

  // Shorten description with AI
  const shortenDescription = () => {
    if (!description) return

    setIsGeneratingAI(true)

    // Simulate AI shortening
    setTimeout(() => {
      const shortened =
        description.split("\n\n")[0] +
        "\n\nKey points:\n" +
        description
          .split("\n")
          .filter((line: string) => line.trim().length > 0 && !line.startsWith("Key points:"))
          .slice(1, 4)
          .map((line: string) => (line.length > 40 ? line.substring(0, 40) + "..." : line))
          .join("\n")

      setAiSuggestion(shortened)
      setIsGeneratingAI(false)
    }, 1000)
  }

  // Expand description with AI
  const expandDescription = () => {
    if (!description) return

    setIsGeneratingAI(true)

    // Simulate AI expansion
    setTimeout(() => {
      const expanded =
        description +
        "\n\nAdditional considerations:\n" +
        "1. Ensure cross-browser compatibility\n" +
        "2. Consider performance implications\n" +
        "3. Document any API changes\n" +
        "4. Add appropriate error handling\n" +
        "5. Include accessibility features"

      setAiSuggestion(expanded)
      setIsGeneratingAI(false)
    }, 1000)
  }

  // Animation state management
  const [isAnimating, setIsAnimating] = React.useState(false)
  
  // Track animation state
  React.useEffect(() => {
    if (open) {
      setIsAnimating(true)
      // Clear animation state after animation completes
      const timeoutId = setTimeout(() => setIsAnimating(false), 350)
      return () => clearTimeout(timeoutId)
    } else {
      setIsAnimating(false)
    }
  }, [open])

  // If not open, don't render anything
  if (!open) return null

  return (
    <>
      {/* Sidebar Layout */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[350px] bg-white dark:bg-gray-800 border-l shadow-lg flex flex-col transition-transform duration-300 ease-in-out will-change-transform transform-gpu sidebar-slide hw-accelerate",
          open ? "translate-x-0" : "translate-x-full",
          "md:w-[350px] sm:w-[320px]",
          !open && "no-select-during-animation",
          isDragging ? "z-40 pointer-events-none" : "z-50", // Lower z-index and disable interactions during drag
        )}
        style={{
          pointerEvents: isDragging ? 'none' : 'auto', // Disable all interactions during drag
        }}
      >
        {/* Header with back button and title */}
        <div className="p-2 border-b flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <Input
            ref={titleInputRef}
            value={title}
            onChange={permissions.canEdit ? (e) => setTitle(e.target.value) : undefined}
            className={cn(
              "text-base font-medium border-0 p-0 h-7 focus-visible:ring-0 focus-visible:ring-offset-0",
              !permissions.canEdit && "opacity-60 cursor-not-allowed"
            )}
            placeholder="Task title"
            readOnly={!permissions.canEdit}
          />
          {hasUnsavedChanges && (
            <span className="text-xs text-muted-foreground ml-auto">
              {isSaving ? (
                <span className="flex items-center">
                  <Loader2 className="h-3 w-3 mr-1 animate-spin" />
                  Saving...
                </span>
              ) : (
                "Unsaved"
              )}
            </span>
          )}
        </div>

        {/* Main content area - single scrollable panel */}
        <div className="flex-1 overflow-auto optimized-scroll">
          {isAnimating || isDragging ? (
            // Simplified view during animation or drag to prevent stuttering
            <div className="p-2 space-y-4">
              <div className="space-y-2">
                <div className="h-4 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-20 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
                <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              </div>
              <div className="h-8 bg-gray-200 rounded animate-pulse"></div>
              {isDragging && (
                <div className="text-center text-sm text-muted-foreground py-4">
                  Drag in progress...
                </div>
              )}
            </div>
          ) : (
            <div className="p-2 space-y-4">
            {/* Description Section */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="description" className="text-xs font-medium">
                  Description
                </Label>
              </div>
              <Textarea
                id="description"
                value={description}
                onChange={permissions.canEdit ? (e) => setDescription(e.target.value) : undefined}
                placeholder="Add a detailed description..."
                className={cn(
                  "min-h-[100px] resize-y text-sm",
                  !permissions.canEdit && "opacity-60 cursor-not-allowed"
                )}
                readOnly={!permissions.canEdit}
              />

              {/* AI Assistant - Compact Version */}
              {permissions.canEdit && (
              <div className="border rounded-md p-1.5 bg-violet-50 dark:bg-violet-950/20 mt-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-violet-500" />
                    <h4 className="font-medium text-xs">AI Description Assistant</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={shortenDescription}
                            disabled={isGeneratingAI || !description}
                            className="h-5 text-xs px-1.5 py-0"
                          >
                            Shorten
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">Create a shorter version</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={expandDescription}
                            disabled={isGeneratingAI || !description}
                            className="h-5 text-xs px-1.5 py-0"
                          >
                            Expand
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">Add more details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {isGeneratingAI ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex flex-col items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                      <p className="text-xs text-muted-foreground">Generating...</p>
                    </div>
                  </div>
                ) : aiSuggestion ? (
                  <div className="space-y-1">
                    <div className="bg-white dark:bg-gray-800 border rounded-md p-1.5 text-xs whitespace-pre-wrap">
                      {aiSuggestion}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={dismissAISuggestion}
                        className="h-5 text-xs px-1.5 py-0"
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={regenerateAISuggestion}
                        className="h-5 text-xs px-1.5 py-0"
                      >
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 text-white h-5 text-xs px-1.5 py-0"
                        onClick={applyAISuggestion}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Button
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white h-6 text-xs"
                      onClick={generateAIDescription}
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      Generate with AI
                    </Button>
                  </div>
                )}
              </div>
              )}
            </div>

            {/* Task Details Section */}
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                {/* Type */}
                <div className="space-y-1">
                  <Label htmlFor="type" className="text-xs font-medium">
                    Type
                  </Label>
                  <Select
                    value={task?.type}
                    onValueChange={permissions.canEdit ? (value) => {
                      setTask({ ...task, type: value })
                      setHasUnsavedChanges(true)
                    } : undefined}
                    disabled={!permissions.canEdit}
                  >
                    <SelectTrigger id="type" className={cn("h-8 text-xs", !permissions.canEdit && "opacity-60")}>
                      <SelectValue placeholder="Select type">
                        <div className="flex items-center gap-2">
                          <Badge
                            className={cn(
                              "px-1.5 py-0 h-4 text-[10px]",
                              task?.type === "feature"
                                ? "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
                                : task?.type === "bug"
                                  ? "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
                                  : task?.type === "story"
                                    ? "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
                                    : task?.type === "epic"
                                      ? "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300"
                                      : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
                            )}
                          >
                            {task?.type === "feature"
                              ? "Feature"
                              : task?.type === "bug"
                                ? "Bug"
                                : task?.type === "story"
                                  ? "Story"
                                  : task?.type === "epic"
                                    ? "Epic"
                                    : "Task"}
                          </Badge>
                        </div>
                      </SelectValue>
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="feature">Feature</SelectItem>
                      <SelectItem value="bug">Bug</SelectItem>
                      <SelectItem value="task">Task</SelectItem>
                      <SelectItem value="story">Story</SelectItem>
                      <SelectItem value="epic">Epic</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Status */}
                <div className="space-y-1">
                  <Label htmlFor="status" className="text-xs font-medium">
                    Status
                  </Label>
                  <Select 
                    value={stage} 
                    onValueChange={permissions.canEdit ? (value) => {
                      setStage(value);
                      setHasUnsavedChanges(true);
                    } : undefined}
                    disabled={!permissions.canEdit}
                  >
                    <SelectTrigger id="status" className={cn("h-8 text-xs", !permissions.canEdit && "opacity-60")}>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      {workflowStages.map((stage) => (
                        <SelectItem key={stage.id} value={stage.name} className="text-xs">
                          {stage.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Assignee */}
                <div className="space-y-1">
                  <Label htmlFor="assignee" className="text-xs font-medium">
                    Assignee
                  </Label>
                  <Popover open={!permissions.canEdit ? false : assigneeOpen} onOpenChange={!permissions.canEdit ? undefined : setAssigneeOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={assigneeOpen}
                        className={cn("w-full justify-between h-8 text-xs", !permissions.canEdit && "opacity-60")}
                        disabled={!permissions.canEdit}
                      >
                        <div className="flex items-center gap-2 truncate">
                          {assignee ? (
                            <>
                              <Avatar className="h-5 w-5">
                                <AvatarImage
                                  src={availableMembers.find((member: any) => member.id === assignee)?.avatar}
                                  alt={getAssigneeName()}
                                />
                                <AvatarFallback className="text-[10px]">
                                  {availableMembers.find((member: any) => member.id === assignee)?.initials}
                                </AvatarFallback>
                              </Avatar>
                              <span>{getAssigneeName()}</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground">Unassigned</span>
                          )}
                        </div>
                        <ChevronsUpDown className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search team member..." className="h-8 text-xs" />
                        <CommandList>
                          <CommandEmpty>No team member found.</CommandEmpty>
                          <CommandGroup>
                            <CommandItem
                              onSelect={() => {
                                setAssignee(null)
                                setAssigneeOpen(false)
                                setHasUnsavedChanges(true)
                              }}
                              className="flex items-center gap-2 text-xs"
                            >
                              <div className="h-5 w-5 rounded-full bg-muted flex items-center justify-center">
                                <X className="h-3 w-3" />
                              </div>
                              <span>Unassigned</span>
                              {assignee === null && <Check className="ml-auto h-3 w-3" />}
                            </CommandItem>
                            {availableMembers.map((member) => (
                              <CommandItem
                                key={member.id}
                                onSelect={() => {
                                  setAssignee(member.id)
                                  setAssigneeOpen(false)
                                  setHasUnsavedChanges(true)
                                }}
                                className="flex items-center gap-2 text-xs"
                              >
                                <Avatar className="h-5 w-5">
                                  <AvatarImage src={member.avatar} alt={member.name} />
                                  <AvatarFallback className="text-[10px]">{member.initials}</AvatarFallback>
                                </Avatar>
                                <span>{member.name}</span>
                                {assignee === member.id && <Check className="ml-auto h-3 w-3" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Labels */}
                <div className="space-y-1">
                  <Label htmlFor="labels" className="text-xs font-medium">
                    Labels
                  </Label>
                  <Popover open={!permissions.canEdit ? false : labelsOpen} onOpenChange={!permissions.canEdit ? undefined : setLabelsOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={labelsOpen}
                        className={cn("w-full justify-between h-8 text-xs", !permissions.canEdit && "opacity-60")}
                        id="labels"
                        disabled={!permissions.canEdit}
                      >
                        {selectedLabels.length > 0 ? (
                          <div className="flex items-center gap-1 flex-1 min-w-0">
                            {selectedLabels.length <= 2 ? (
                              selectedLabels.map((id) => {
                                const label = labels.find((l) => l.id === id)
                                if (!label) return null
                                const displayName = label.name.length > 8 ? `${label.name.slice(0, 8)}...` : label.name
                                return (
                                  <TooltipProvider key={label.id}>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Badge className="px-1 py-0 h-4 text-[10px] max-w-[60px] truncate" variant="outline">
                                          {displayName}
                                        </Badge>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{label.name}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>
                                )
                              })
                            ) : (
                              <>
                                {selectedLabels.slice(0, 1).map((id) => {
                                  const label = labels.find((l) => l.id === id)
                                  if (!label) return null
                                  const displayName = label.name.length > 8 ? `${label.name.slice(0, 8)}...` : label.name
                                  return (
                                    <TooltipProvider key={label.id}>
                                      <Tooltip>
                                        <TooltipTrigger asChild>
                                          <Badge className="px-1 py-0 h-4 text-[10px] max-w-[60px] truncate" variant="outline">
                                            {displayName}
                                          </Badge>
                                        </TooltipTrigger>
                                        <TooltipContent>
                                          <p>{label.name}</p>
                                        </TooltipContent>
                                      </Tooltip>
                                    </TooltipProvider>
                                  )
                                })}
                                <Badge className="px-1 py-0 h-4 text-[10px] flex-shrink-0 bg-gray-100 text-gray-600" variant="outline">
                                  +{selectedLabels.length - 1}
                                </Badge>
                              </>
                            )}
                          </div>
                        ) : (
                          <span className="text-muted-foreground">Select labels</span>
                        )}
                        <Tag className="ml-1 h-3 w-3 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                      <Command>
                        <CommandInput placeholder="Search labels..." className="h-8 text-xs" />
                        <CommandList>
                          <CommandEmpty>No label found.</CommandEmpty>
                          <CommandGroup>
                            {labels.map((label) => (
                              <CommandItem
                                key={label.id}
                                onSelect={() => toggleLabel(label.id)}
                                className="flex items-center gap-2 text-xs"
                              >
                                <div className="h-3 w-3 rounded-full" style={{ backgroundColor: label.color }} />
                                <span>{label.name}</span>
                                {selectedLabels.includes(label.id) && <Check className="ml-auto h-3 w-3" />}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Due Date */}
                <div className="space-y-1">
                  <Label htmlFor="due-date" className="text-xs font-medium">
                    Due Date
                  </Label>
                  <Popover open={!permissions.canEdit ? false : dateOpen} onOpenChange={!permissions.canEdit ? undefined : setDateOpen}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        className={cn("w-full justify-start text-left font-normal h-8 text-xs", !permissions.canEdit && "opacity-60")}
                        id="due-date"
                        disabled={!permissions.canEdit}
                      >
                        <Calendar className="mr-2 h-3 w-3" />
                        {dueDate ? format(dueDate, "PPP") : <span className="text-muted-foreground">Set due date</span>}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-auto p-0" align="start">
                      <CalendarComponent
                        mode="single"
                        selected={dueDate}
                        onSelect={permissions.canEdit ? (date) => {
                          setDueDate(date)
                          setDateOpen(false)
                          setHasUnsavedChanges(true)
                        } : undefined}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>

                {/* Priority */}
                <div className="space-y-1">
                  <Label htmlFor="priority" className="text-xs font-medium">
                    Priority
                  </Label>
                  <Select 
                    value={priority} 
                    onValueChange={permissions.canEdit ? (value) => {
                      setPriority(value)
                      setHasUnsavedChanges(true)
                    } : undefined}
                    disabled={!permissions.canEdit}
                  >
                    <SelectTrigger id="priority" className={cn("h-8 text-xs", !permissions.canEdit && "opacity-60")}>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      {priorities.map((p) => (
                        <SelectItem key={p.value} value={p.value} className="text-xs">
                          <div className="flex items-center gap-2">
                            <Clock className={cn("h-3 w-3", p.color)} />
                            <span>{p.label}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Estimate */}
                <div className="space-y-1">
                  <Label htmlFor="estimate" className="text-xs font-medium">
                    Estimate (hours)
                  </Label>
                  <Input
                    id="estimate"
                    type="number"
                    min="0"
                    step="0.5"
                    value={estimate || ""}
                    onChange={permissions.canEdit ? (e) => {
                      setEstimate(Number.parseFloat(e.target.value) || undefined)
                      setHasUnsavedChanges(true)
                    } : undefined}
                    placeholder="Enter estimate"
                    className={cn("h-8 text-xs", !permissions.canEdit && "opacity-60 cursor-not-allowed")}
                    readOnly={!permissions.canEdit}
                  />
                </div>
              </div>
            </div>

            {/* Comments Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-medium">Comments ({comments.length})</h3>
              </div>
              {/* Comment input */}
              {permissions.canEdit && (
                <div className="space-y-2">
                  <Textarea
                    ref={commentInputRef}
                    value={newComment}
                    onChange={(e) => setNewComment(e.target.value)}
                    placeholder="Add a comment..."
                    className="min-h-[80px] resize-y text-sm"
                  />
                  <div className="flex justify-end">
                    <Button
                      onClick={handleAddComment}
                      disabled={!newComment.trim()}
                      className="bg-violet-600 hover:bg-violet-700 text-white h-7 text-xs"
                    >
                      Add Comment
                    </Button>
                  </div>
                </div>
              )}

              {/* Comments list */}
              <div className="space-y-3">
                {loadingComments ? (
                  <div className="text-center py-6">
                    <div className="animate-spin h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-2" />
                    <p className="text-muted-foreground text-xs">Loading comments...</p>
                  </div>
                ) : comments.length === 0 ? (
                  <div className="text-center py-6">
                    <MessageSquare className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                    <p className="text-muted-foreground text-xs">No comments yet</p>
                  </div>
                ) : (
                  comments.map((comment) => (
                    <div key={comment.id} className="border rounded-md p-3">
                      <div className="flex items-center gap-2 mb-1">
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {comment.userName?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium text-xs">{comment.userName || "Unknown"}</div>
                          <div className="text-[10px] text-muted-foreground">
                            {formatTimestamp(new Date(comment.createdAt))}
                          </div>
                        </div>
                      </div>
                      <div className="text-xs whitespace-pre-wrap">{comment.content}</div>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Activity Section */}
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground">Activity</h3>
                {activities.length > 3 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowAllActivities(!showAllActivities)}
                    className="h-6 text-xs text-muted-foreground hover:text-foreground"
                  >
                    {showAllActivities ? 'Show less' : `View all (${activities.length})`}
                  </Button>
                )}
              </div>
              <div className="space-y-3">
                {loadingActivities ? (
                  <div className="text-center py-8">
                    <div className="animate-spin h-6 w-6 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-3" />
                    <p className="text-muted-foreground text-sm">Loading activity...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="text-center py-8">
                    <Clock className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-3" />
                    <p className="text-muted-foreground text-sm">No activity yet</p>
                  </div>
                ) : (
                  <div className="relative border-l-2 border-border pl-6 ml-3 space-y-6">
                    {(showAllActivities ? activities : activities.slice(0, 3)).map((activity) => (
                      <div key={activity.id} className="relative">
                        {/* Timeline dot */}
                        <div className="absolute -left-[25px] top-1 h-3 w-3 rounded-full bg-violet-500 border-2 border-background shadow-sm" />

                        <div className="space-y-1">
                          <div className="flex items-start gap-2">
                            <Avatar className="h-6 w-6 mt-0.5">
                              <AvatarFallback className="text-xs font-medium">
                                {activity.userName?.charAt(0)?.toUpperCase() || "U"}
                              </AvatarFallback>
                            </Avatar>
                            
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-medium text-sm text-foreground">{activity.userName || "Unknown"}</span>

                                {activity.activityType === "status_change" && (
                                  <span className="text-sm text-muted-foreground">
                                    changed status from{" "}
                                    <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
                                      {activity.oldValue}
                                    </Badge>{" "}
                                    to{" "}
                                    <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
                                      {activity.newValue}
                                    </Badge>
                                  </span>
                                )}

                                {activity.activityType === "assignee_change" && (
                                  <span className="text-sm text-muted-foreground">
                                    {activity.oldValue ? (
                                      <>
                                        changed assignee from <span className="font-medium text-foreground">{activity.oldValue}</span> to{" "}
                                        <span className="font-medium text-foreground">{activity.newValue}</span>
                                      </>
                                    ) : (
                                      <>
                                        assigned to <span className="font-medium text-foreground">{activity.newValue}</span>
                                      </>
                                    )}
                                  </span>
                                )}

                                {activity.activityType === "priority_change" && (
                                  <span className="text-sm text-muted-foreground">
                                    changed priority from{" "}
                                    <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
                                      {activity.oldValue}
                                    </Badge>{" "}
                                    to{" "}
                                    <Badge variant="secondary" className="text-xs px-2 py-0.5 font-medium">
                                      {activity.newValue}
                                    </Badge>
                                  </span>
                                )}

                                {activity.activityType === "comment" && <span className="text-sm text-muted-foreground">added a comment</span>}
                                {activity.activityType === "created" && <span className="text-sm text-muted-foreground">created this task</span>}
                                {activity.activityType === "updated" && <span className="text-sm text-muted-foreground">updated this task</span>}
                                {activity.activityType === "deleted" && <span className="text-sm text-muted-foreground">deleted this task</span>}
                                
                                {/* Generic description fallback */}
                                {!["status_change", "assignee_change", "priority_change", "comment", "created", "updated", "deleted"].includes(activity.activityType) && (
                                  <span className="text-sm text-muted-foreground">{activity.description || activity.activityType}</span>
                                )}
                              </div>
                              
                              <div className="text-xs text-muted-foreground mt-1">
                                {formatTimestamp(new Date(activity.createdAt))}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Attachments Section */}
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-sm font-medium">Files ({attachments.length})</h3>
                {permissions.canEdit && (
                  <Button className="bg-violet-600 hover:bg-violet-700 text-white h-7 text-xs">
                    <Paperclip className="mr-1 h-3 w-3" />
                    Upload File
                  </Button>
                )}
              </div>

              {/* Attachments list */}
              <div className="space-y-2">
                {attachments.length === 0 ? (
                  <div className="text-center py-6">
                    <Paperclip className="h-8 w-8 mx-auto text-muted-foreground opacity-50 mb-2" />
                    <p className="text-muted-foreground text-xs">No attachments yet</p>
                  </div>
                ) : (
                  <div className="border rounded-md divide-y">
                    {attachments.map((attachment) => (
                      <div key={attachment.id} className="p-2 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <div className="h-8 w-8 bg-muted rounded-md flex items-center justify-center">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                          </div>
                          <div>
                            <div className="font-medium text-xs">{attachment.name}</div>
                            <div className="text-[10px] text-muted-foreground flex items-center gap-1">
                              <span>{attachment.size}</span>
                              <span>•</span>
                              <span>Uploaded by {attachment.uploadedBy.name}</span>
                              <span>•</span>
                              <span>{formatTimestamp(attachment.timestamp)}</span>
                            </div>
                          </div>
                        </div>
                        <Button variant="ghost" size="icon" className="h-6 w-6">
                          <ArrowRight className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
          )}
        </div>

        {/* Footer with actions */}
        <div className="p-2 border-t mt-auto">
          <div className="flex items-center justify-between gap-2">
            {permissions.canEdit && (
              <Button variant="destructive" onClick={() => setDeleteDialogOpen(true)} size="sm" className="h-7 text-xs">
                <Trash className="mr-1 h-3 w-3" />
                Delete
              </Button>
            )}

            <div className="flex items-center gap-2 ml-auto">
              <Select
                value={stage}
                onValueChange={permissions.canEdit ? (value) => {
                  setStage(value);
                  setHasUnsavedChanges(true);
                } : undefined}
                disabled={!permissions.canEdit}
              >
                <SelectTrigger className={cn("w-[110px] h-7 text-xs", !permissions.canEdit && "opacity-60")}>
                  <SelectValue placeholder="Move to..." />
                </SelectTrigger>
                <SelectContent>
                  {workflowStages.map((stage) => (
                    <SelectItem key={stage.id} value={stage.name} className="text-xs">
                      {stage.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              {permissions.canEdit && (
                <Button
                  onClick={saveChanges}
                  disabled={isSaving || !hasUnsavedChanges}
                  className="bg-violet-600 hover:bg-violet-700 text-white h-7 text-xs"
                >
                  {isSaving ? (
                    <>
                      <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                      Saving
                    </>
                  ) : (
                    "Save"
                  )}
                </Button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 z-40 md:hidden transition-opacity duration-300 ease-in-out will-change-transform",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => onOpenChange(false)}
      />

      {/* Delete confirmation dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the task and all associated data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteTask} className="bg-red-600 hover:bg-red-700 text-white">
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Memoize the component to prevent unnecessary re-renders during drag operations
export const TaskDetailView = React.memo(TaskDetailViewComponent, (prevProps, nextProps) => {
  // During drag operations, be very aggressive about preventing re-renders
  if (nextProps.isDragging || prevProps.isDragging) {
    // Only re-render if the detail view is being opened/closed
    return prevProps.open === nextProps.open && 
           prevProps.task?.id === nextProps.task?.id &&
           prevProps.projectPublicId === nextProps.projectPublicId
  }
  
  // Normal comparison when not dragging - compare all critical props
  return (
    prevProps.open === nextProps.open &&
    prevProps.task?.id === nextProps.task?.id &&
    prevProps.task?.status === nextProps.task?.status &&
    prevProps.task?.title === nextProps.task?.title &&
    prevProps.projectPublicId === nextProps.projectPublicId &&
    prevProps.isDragging === nextProps.isDragging
  )
})
