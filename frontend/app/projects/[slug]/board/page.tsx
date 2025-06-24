"use client"

import { useState, useRef, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  ArrowDown,
  ArrowUp,
  CheckCircle,
  Clock,
  LayoutGrid,
  MessageSquare,
  MoreHorizontal,
  Paperclip,
  Plus,
  Search,
  SlidersHorizontal,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuCheckboxItem,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import { TaskDetailView } from "@/components/task-detail-view"
import { CreateTaskSidebar } from "@/components/create-task-sidebar"
import { apiRequest } from "@/lib/api"

// Type definitions
interface Task {
  id: number
  title: string
  description?: string
  assigneeId?: string | null
  assigneeName?: string
  assignee?: {
    name: string
    image?: string
    initials: string
  }
  priority: number
  status: string
  type?: string
  labels?: string[]
  comments?: number
  attachments?: number
  dueDate?: string | Date
  estimatedHours?: number
  position: number
}

interface Column {
  id: string
  title: string
  tasks: Task[]
  color?: string
  order?: number
  isCompleted?: boolean
  stageId?: number
  status?: string
}

interface BoardData {
  [key: string]: Column
}

interface ApiResponse {
  projectId: string
  columns: Array<{
    id: string
    title: string
    color?: string
    order?: number
    isCompleted?: boolean
    stageId?: number
    status?: string
    tasks: Task[]
  }>
}

interface Project {
  id: number
  name: string
  description: string
  publicId: string
  createdAt: string
}

// Task types with colors
const taskTypes = {
  feature: {
    label: "Feature",
    color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300 border-blue-200 dark:border-blue-800",
  },
  bug: {
    label: "Bug",
    color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300 border-red-200 dark:border-red-800",
  },
  task: {
    label: "Task",
    color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300 border-gray-200 dark:border-gray-700",
  },
  story: {
    label: "Story",
    color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-green-200 dark:border-green-800",
  },
  epic: {
    label: "Epic",
    color:
      "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300 border-purple-200 dark:border-purple-800",
  },
}

// Priority levels with icons
const priorityLevels = {
  1: { label: "Low", icon: ArrowDown, color: "text-blue-500" },
  2: { label: "Medium", icon: MoreHorizontal, color: "text-yellow-500" },
  3: { label: "High", icon: ArrowUp, color: "text-red-500" },
  4: { label: "Critical", icon: ArrowUp, color: "text-red-600" },
}

// Default icons for stages (can be customized later)
const getStageIcon = (stageIndex: number, isCompleted: boolean) => {
  if (isCompleted) return CheckCircle
  switch (stageIndex) {
    case 0: return Clock
    case 1: return ArrowUp
    case 2: return CheckCircle
    default: return LayoutGrid
  }
}

export default function ProjectBoardPage() {
  const params = useParams()
  const projectId = params.slug as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [boardData, setBoardData] = useState<BoardData>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    type: "all",
    assignee: "all",
    priority: "all",
    label: "all",
  })
  const [viewMode, setViewMode] = useState("detailed") // "detailed" or "compact"
  const [showCompletedTasks, setShowCompletedTasks] = useState(true)
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [draggedTask, setDraggedTask] = useState<{task: Task, columnId: string} | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollDirection, setScrollDirection] = useState<string | null>(null)
  const scrollInterval = useRef<NodeJS.Timeout | null>(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState("")
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  // Fetch board data
  const fetchBoardData = async (filterParams = {}) => {
    if (!projectId) return

    try {
      // Build filter parameters
      const queryParams = new URLSearchParams()
      
      if (searchQuery) queryParams.append('SearchTerm', searchQuery)
      if (filters.assignee !== 'all') queryParams.append('AssigneeName', filters.assignee)
      if (filters.priority !== 'all') queryParams.append('Priority', filters.priority)
      
      const endpoint = `/api/projects/public/${projectId}/board${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
      const data = await apiRequest<ApiResponse>(endpoint)
      
      // Transform API data to match frontend structure
      const transformedData: BoardData = {}

      // Map columns from workflow stages
      data.columns.forEach((column) => {
        transformedData[column.id] = {
          id: column.id,
          title: column.title,
          tasks: column.tasks || [],
          color: column.color,
          order: column.order,
          isCompleted: column.isCompleted,
          stageId: column.stageId,
          status: column.status
        }
      })

      setBoardData(transformedData)
      setLastSynced(new Date().toLocaleTimeString())
      setError(null)
    } catch (err) {
      console.error('Error fetching board data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch board data')
    }
  }

  // Fetch project details
  const fetchProject = async () => {
    if (!projectId) return

    try {
      const projectData = await apiRequest<Project>(`/api/projects/public/${projectId}`)
      setProject(projectData)
    } catch (err) {
      console.error('Error fetching project:', err)
    }
  }

  // Fetch participants for filter dropdown
  const fetchParticipants = async () => {
    if (!projectId) return

    try {
      // For now, we'll get participants from task assignees since there's no public participants endpoint
      // This is handled in getAllAssignees() function
      console.log('Participants will be derived from task assignees')
    } catch (err) {
      console.error('Error fetching participants:', err)
    }
  }

  // Initial data fetch - consolidated to prevent multiple re-renders
  useEffect(() => {
    const initializeBoard = async () => {
      if (!projectId) return
      
      try {
        setLoading(true)
        // Fetch all data in parallel to minimize re-renders
        await Promise.all([
          fetchProject(),
          fetchBoardData(),
          fetchParticipants()
        ])
      } catch (err) {
        console.error('Error initializing board:', err)
      } finally {
        setLoading(false)
      }
    }

    initializeBoard()
  }, [projectId])

  // Listen for workflow changes from settings page
  useEffect(() => {
    const handleWorkflowReordered = (event: CustomEvent) => {
      console.log('🔄 Board: Detected workflow reorder, refreshing board data...')
      fetchBoardData()
    }

    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'workflowChanged') {
        console.log('🔄 Board: Detected workflow change from storage, refreshing board data...')
        fetchBoardData()
      }
    }

    // Listen for same-tab events
    window.addEventListener('workflowReordered', handleWorkflowReordered as EventListener)
    
    // Listen for cross-tab events
    window.addEventListener('storage', handleStorageChange)

    return () => {
      window.removeEventListener('workflowReordered', handleWorkflowReordered as EventListener)
      window.removeEventListener('storage', handleStorageChange)
    }
  }, [fetchBoardData])

  // Refetch when filters change (but not on initial mount)
  useEffect(() => {
    // Skip if this is the initial render (loading is true)
    if (loading) return
    
    const timeoutId = setTimeout(() => {
      if (projectId) {
        fetchBoardData()
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters, projectId, loading])

  // Get all unique labels from tasks
  const getAllLabels = (): string[] => {
    const labels = new Set<string>()
    Object.values(boardData).forEach((column) => {
      column.tasks.forEach((task: Task) => {
        if (task.labels) {
          task.labels.forEach((label: string) => labels.add(label))
        }
      })
    })
    return Array.from(labels)
  }

  // Get all unique assignees from tasks
  const getAllAssignees = (): string[] => {
    const assignees = new Set<string>()
    Object.values(boardData).forEach((column) => {
      column.tasks.forEach((task: Task) => {
        if (task.assigneeName) {
          assignees.add(task.assigneeName)
        }
      })
    })
    return Array.from(assignees)
  }

  // Filter tasks based on current filters
  const filterTasks = (tasks: Task[]) => {
    return tasks.filter((task: Task) => {
      const matchesSearch = !searchQuery || 
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description?.toLowerCase().includes(searchQuery.toLowerCase())
      
      const matchesType = filters.type === "all" || task.type === filters.type
      const matchesAssignee = filters.assignee === "all" || task.assigneeName === filters.assignee
      const matchesPriority = filters.priority === "all" || task.priority.toString() === filters.priority
      const matchesLabel = filters.label === "all" || task.labels?.includes(filters.label)
      
      return matchesSearch && matchesType && matchesAssignee && matchesPriority && matchesLabel
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      type: "all",
      assignee: "all", 
      priority: "all",
      label: "all",
    })
    setSearchQuery("")
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, task: Task, columnId: string) => {
    setDraggedTask({task, columnId})
    
    // Create a more polished drag image
    const dragElement = e.target as HTMLElement
    const clone = dragElement.cloneNode(true) as HTMLElement
    
    // Style the clone for better visual feedback
    clone.style.transform = 'rotate(5deg)'
    clone.style.opacity = '0.8'
    clone.style.boxShadow = '0 10px 25px rgba(0, 0, 0, 0.3)'
    clone.style.border = '2px solid rgb(139, 92, 246)' // violet-500
    clone.style.backgroundColor = 'white'
    clone.style.borderRadius = '8px'
    clone.style.width = dragElement.offsetWidth + 'px'
    clone.style.position = 'absolute'
    clone.style.top = '-1000px'
    clone.style.pointerEvents = 'none'
    clone.style.zIndex = '9999'
    
    // Add it to body temporarily for drag image
    document.body.appendChild(clone)
    
    // Set custom drag image
    e.dataTransfer.setDragImage(clone, dragElement.offsetWidth / 2, 20)
    
    // Clean up clone after drag starts
    setTimeout(() => {
      document.body.removeChild(clone)
    }, 0)
    
    // Apply dragging state to original element
    dragElement.style.opacity = "0.4"
    dragElement.style.transform = "scale(0.95)"
    dragElement.style.transition = "all 0.2s ease"
    dragElement.classList.add('dragging')
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, columnId: string, taskId: number | null = null) => {
    e.preventDefault()
    setDragOverColumn(columnId)
    setDragOverTaskId(taskId)
    
    // Auto-scroll logic
    const container = boardRef.current
    if (container) {
      const rect = container.getBoundingClientRect()
      const scrollThreshold = 100
      
      if (e.clientX < rect.left + scrollThreshold) {
        startScrolling("left")
      } else if (e.clientX > rect.right - scrollThreshold) {
        startScrolling("right")
      } else {
        stopScrolling()
      }
    }
  }

  // Auto-scroll functions
  const startScrolling = (direction: string) => {
    if (isScrolling && scrollDirection === direction) return
    
    stopScrolling()
    setIsScrolling(true)
    setScrollDirection(direction)
    
    scrollInterval.current = setInterval(() => {
      const container = boardRef.current
      if (container) {
        const scrollAmount = direction === "left" ? -10 : 10
        container.scrollLeft += scrollAmount
      }
    }, 16)
  }

  const stopScrolling = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current)
      scrollInterval.current = null
    }
    setIsScrolling(false)
    setScrollDirection(null)
  }

  // Calculate position for reordering
  const calculatePosition = (targetColumnId: string, targetTaskId: number | null): number => {
    const targetColumn = boardData[targetColumnId as keyof BoardData]
    if (!targetColumn) return 1000
    
    const tasks = targetColumn.tasks.sort((a, b) => a.position - b.position)
    
    if (!targetTaskId) {
      // Dropped at the end of the column
      return tasks.length > 0 ? tasks[tasks.length - 1].position + 1000 : 1000
    }
    
    // Find the position to insert before targetTaskId
    const targetIndex = tasks.findIndex(t => t.id === targetTaskId)
    if (targetIndex === -1) return 1000
    
    if (targetIndex === 0) {
      // Insert at the beginning
      return tasks[0].position / 2
    }
    
    // Insert between two tasks
    const prevTask = tasks[targetIndex - 1]
    const nextTask = tasks[targetIndex]
    return (prevTask.position + nextTask.position) / 2
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetColumnId: string, targetTaskId: number | null = null) => {
    e.preventDefault()
    stopScrolling()
    
    if (!draggedTask) return
    
    const { task, columnId: sourceColumnId } = draggedTask
    
    // Add visual feedback for successful drop
    const dropTarget = e.currentTarget as HTMLElement
    dropTarget.style.transition = "all 0.3s ease"
    dropTarget.style.transform = "scale(1.02)"
    
    setTimeout(() => {
      dropTarget.style.transform = "scale(1)"
    }, 150)
    
    // Calculate new position
    const newPosition = calculatePosition(targetColumnId, targetTaskId)
    
    // Don't do anything if dropped in the same position (same column and same task)
    if (sourceColumnId === targetColumnId && targetTaskId === task.id) {
      setDraggedTask(null)
      setDragOverColumn(null)
      setDragOverTaskId(null)
      return
    }
    
    reorderTask(task.id, targetColumnId, newPosition)
    
    // Clear drag state immediately for visual feedback, but with a slight delay to ensure all operations complete
    setTimeout(() => {
      setDraggedTask(null)
      setDragOverColumn(null)
      setDragOverTaskId(null)
    }, 10)
  }

  // Reorder task with position
  const reorderTask = async (taskId: number, newColumnId: string, newPosition: number) => {
    if (!projectId) return

    // Create dynamic status mapping based on actual board columns
    const boardColumns = Object.values(boardData).sort((a, b) => (a.order || 0) - (b.order || 0));
    const columnToStatusMap: Record<string, number> = {};
    const statusNames: Record<number, string> = {
      1: "Todo",
      2: "InProgress", 
      3: "InReview",
      4: "Done",
      5: "Cancelled"
    }

    console.log('🔧 DRAG & DROP: Board columns available:', boardColumns.map(c => ({ id: c.id, title: c.title, order: c.order })));
    console.log('🔧 DRAG & DROP: Target column ID:', newColumnId);

    // Map actual column IDs to TaskStatus enum values based on order
    boardColumns.forEach((column, index) => {
      let statusValue = index + 1; // TaskStatus starts at 1
      
      // Cap at maximum supported TaskStatus value (20)
      if (statusValue > 20) {
        console.warn(`⚠️ Column ${column.title} exceeds maximum supported stages (20). Capping at 20.`);
        statusValue = 20;
      }
      
      columnToStatusMap[column.id] = statusValue;
      
      // Extend statusNames for additional columns beyond the default 4
      if (statusValue > 4) {
        statusNames[statusValue] = column.title || `Stage ${statusValue}`;
      }
    });

    console.log('📊 Column mapping created:', {
      boardColumns: boardColumns.map(c => ({ id: c.id, title: c.title, order: c.order })),
      columnToStatusMap,
      statusNames
    });

    // Find the current task to preserve its data
    let currentTask: Task | undefined
    let sourceColumnId: string | undefined
    for (const [columnKey, column] of Object.entries(boardData)) {
      currentTask = column.tasks.find((t: Task) => t.id === taskId)
      if (currentTask) {
        sourceColumnId = columnKey
        break
      }
    }

    if (!currentTask || !sourceColumnId) {
      console.error('Task not found for reordering')
      return
    }

    // Create optimistic update data
    const optimisticTask: Task = {
      ...currentTask,
      status: statusNames[columnToStatusMap[newColumnId]],
      position: newPosition
    }

    // Apply optimistic update immediately
    setBoardData(prevBoardData => {
      const newBoardData = { ...prevBoardData }
      
      // Remove task from source column
      newBoardData[sourceColumnId as keyof BoardData] = {
        ...newBoardData[sourceColumnId as keyof BoardData],
        tasks: newBoardData[sourceColumnId as keyof BoardData].tasks.filter(t => t.id !== taskId)
      }
      
      // Add task to target column and sort by position
      const targetTasks = [...newBoardData[newColumnId as keyof BoardData].tasks, optimisticTask]
      targetTasks.sort((a, b) => a.position - b.position)
      
      newBoardData[newColumnId as keyof BoardData] = {
        ...newBoardData[newColumnId as keyof BoardData],
        tasks: targetTasks
      }
      
      return newBoardData
    })

    // Delay selected task update to prevent UI lag during drag
    if (selectedTask && selectedTask.id === taskId) {
      setTimeout(() => {
        setSelectedTask(optimisticTask)
      }, 100)
    }

    try {
      // Check if the target column exists in boardData
      if (!(newColumnId in boardData)) {
        console.error('❌ Target column not found in board data:', newColumnId);
        console.error('Available columns:', Object.keys(boardData));
        return;
      }

      // Check if we have a valid status mapping for this column
      if (!(newColumnId in columnToStatusMap)) {
        console.error('❌ No status mapping found for column:', newColumnId);
        console.error('Available columns:', Object.keys(boardData));
        console.error('Available mappings:', columnToStatusMap);
        console.error('Board columns:', boardColumns.map(c => ({ id: c.id, title: c.title, order: c.order })));
        return;
      }

      // Use the new reorder API endpoint
      const payload = {
        status: columnToStatusMap[newColumnId],
        position: newPosition
      };

      console.log('🔄 Sending reorder request:', { taskId, newColumnId, payload });
      console.log('🔄 Full request details:', {
        url: `/api/projects/public/${projectId}/tasks/${taskId}/reorder`,
        method: 'PUT',
        payload: JSON.stringify(payload)
      });

      const response = await apiRequest(`/api/projects/public/${projectId}/tasks/${taskId}/reorder`, {
        method: 'PUT',
        body: JSON.stringify(payload)
      })
      
      console.log('✅ Reorder response received:', response);

      console.log('✅ Task reordered successfully via drag and drop')
    } catch (err) {
      console.error('❌ Error reordering task via drag and drop:', err)
      
      // Revert optimistic update on failure
      setBoardData(prevBoardData => {
        const newBoardData = { ...prevBoardData }
        
        // Remove task from target column
        newBoardData[newColumnId as keyof BoardData] = {
          ...newBoardData[newColumnId as keyof BoardData],
          tasks: newBoardData[newColumnId as keyof BoardData].tasks.filter(t => t.id !== taskId)
        }
        
        // Add task back to source column and sort by position
        const sourceTasks = [...newBoardData[sourceColumnId as keyof BoardData].tasks, currentTask]
        sourceTasks.sort((a, b) => a.position - b.position)
        
        newBoardData[sourceColumnId as keyof BoardData] = {
          ...newBoardData[sourceColumnId as keyof BoardData],
          tasks: sourceTasks
        }
        
        return newBoardData
      })

      // Revert selected task if it was the one being moved
      if (selectedTask && selectedTask.id === taskId) {
        setSelectedTask(currentTask)
      }
    }
  }

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    const dragElement = e.target as HTMLElement
    
    // Smooth transition back to normal state
    dragElement.style.opacity = "1"
    dragElement.style.transform = "scale(1)"
    dragElement.style.transition = "all 0.3s ease"
    dragElement.classList.remove('dragging')
    
    // Clear dragging states
    setDraggedTask(null)
    setDragOverColumn(null)
    setDragOverTaskId(null)
    
    // Clean up any remaining drag effects
    setTimeout(() => {
      dragElement.style.transition = ""
    }, 300)
    
    stopScrolling()
  }

  // Toggle empty state (for demo purposes)
  const toggleEmptyState = () => {
    setShowEmptyState(!showEmptyState)
  }

  // Handle opening create task modal
  const handleOpenCreateTask = (columnId: string) => {
    setSelectedColumn(columnId)
    setCreateTaskOpen(true)
    // Close task detail view when opening create task sidebar
    if (taskDetailOpen) {
      setTaskDetailOpen(false)
      setSelectedTask(null)
    }
  }

  // Map column ID to initial stage for task creation
  const getInitialStageFromColumn = (columnId: string): string => {
    // Return default if no columnId provided
    if (!columnId || columnId.trim() === "") {
      return "To Do"
    }
    
    const column = boardData[columnId]
    if (column && column.title) {
      console.log('🎯 Board: getInitialStageFromColumn - columnId:', columnId, 'title:', column.title)
      return column.title
    }
    console.log('🎯 Board: getInitialStageFromColumn - columnId:', columnId, 'no column found, defaulting to "To Do"')
    return "To Do"
  }

  // Handle task creation
  const handleTaskCreated = () => {
    // Refresh board data to show new task
    fetchBoardData()
    setCreateTaskOpen(false)
  }

  // Handle opening task detail view
  const handleOpenTaskDetail = (task: Task) => {
    console.log('🎯 ProjectBoard: Opening task detail for task:', task.id, 'status:', task.status);
    setSelectedTask(task)
    setTaskDetailOpen(true)
    // Close create task sidebar when opening task detail view
    if (createTaskOpen) {
      setCreateTaskOpen(false)
    }
  }

  // Helper function to get dynamic status mapping
  const getStatusMapping = () => {
    // Sort columns by their configured workflow order (fallback to index order)
    const boardColumns = Object.values(boardData).sort((a, b) => (a.order ?? 0) - (b.order ?? 0))

    const statusIdToColumnKey: Record<number, string | undefined> = {}
    const statusIdToDisplayStatusString: Record<number, string | undefined> = {}

    boardColumns.forEach((column, index) => {
      const statusId = index + 1 // TaskStatus enum starts at 1
      statusIdToColumnKey[statusId] = column.id
      // Prefer the column title for the human-readable status string
      statusIdToDisplayStatusString[statusId] = column.title ?? `Stage ${statusId}`
    })

    return { statusIdToColumnKey, statusIdToDisplayStatusString }
  }

  // Handle task update (called optimistically and on success from TaskDetailView)
  const handleTaskUpdated = (updatedTaskData?: any, isOptimistic?: boolean) => {
    console.log('📋 PROJECT BOARD: handleTaskUpdated called with status:', updatedTaskData?.status, 'isOptimistic:', isOptimistic);
    
    // If we're currently dragging, skip this update to prevent performance issues
    // The drag operation already handles optimistic updates
    if (draggedTask) {
      console.log('📋 PROJECT BOARD: Skipping handleTaskUpdated during drag operation');
      return;
    }
    
    if (!updatedTaskData || typeof updatedTaskData.id === 'undefined') {
      console.warn('ProjectBoard: handleTaskUpdated called with invalid data:', updatedTaskData);
      fetchBoardData(); 
      return;
    }

    const { statusIdToColumnKey, statusIdToDisplayStatusString } = getStatusMapping();

    // Handle both numeric and string status formats
    const statusStringToId: Record<string, number> = {}
    Object.entries(statusIdToDisplayStatusString).forEach(([id, name]) => {
      if (name) statusStringToId[name] = Number(id)
    })

    // Normalize status to numeric ID
    let statusId: number;
    if (typeof updatedTaskData.status === 'number') {
      statusId = updatedTaskData.status;
    } else if (typeof updatedTaskData.status === 'string') {
      statusId = statusStringToId[updatedTaskData.status] || 0;
    } else {
      statusId = 0;
    }

    const targetColumnKey = statusIdToColumnKey[statusId];
    const newDisplayStatusString = statusIdToDisplayStatusString[statusId];

    if (!targetColumnKey || !newDisplayStatusString || statusId === 0) {
      console.error(`ProjectBoard: Invalid status "${updatedTaskData.status}" from updated task. Refetching board data.`);
      fetchBoardData();
      return;
    }

    const normalizedLabels: string[] = (updatedTaskData.labels || []).map((lbl: any) =>
      typeof lbl === 'string' ? lbl : lbl?.name ?? ''
    ).filter(Boolean);

    const boardPageTask: Task = {
      id: updatedTaskData.id,
      title: updatedTaskData.title,
      description: updatedTaskData.description,
      assigneeId: updatedTaskData.assigneeId,
      assigneeName: updatedTaskData.assigneeName,
      assignee: updatedTaskData.assignee,
      priority: updatedTaskData.priority,
      status: newDisplayStatusString,
      type: updatedTaskData.type,
      labels: normalizedLabels,
      dueDate: updatedTaskData.dueDate,
      estimatedHours: updatedTaskData.estimatedHours,
      comments: updatedTaskData.comments,
      attachments: updatedTaskData.attachments,
      position: updatedTaskData.position || 0,
    };

    setBoardData(prevBoardData => {
      // Use shallow cloning for better performance
      const newBoardData = { ...prevBoardData };

      // Locate the task and remember its current column & index
      let previousColumnKey: keyof BoardData | undefined;
      let previousIndex = -1;
      for (const colKeyStr in newBoardData) {
        const columnKey = colKeyStr as keyof BoardData;
        const idx = newBoardData[columnKey].tasks.findIndex(t => t.id === boardPageTask.id);
        if (idx !== -1) {
          previousColumnKey = columnKey;
          previousIndex = idx;
          break;
        }
      }

      // If found in the same column we are saving to, just replace in place
      if (previousColumnKey && previousColumnKey === targetColumnKey && previousIndex !== -1) {
        newBoardData[targetColumnKey] = {
          ...newBoardData[targetColumnKey],
          tasks: [...newBoardData[targetColumnKey].tasks]
        };
        newBoardData[targetColumnKey].tasks[previousIndex] = boardPageTask;
      } else {
        // Otherwise remove it from wherever it was and insert at top of new column
        if (previousColumnKey && previousIndex !== -1) {
          newBoardData[previousColumnKey] = {
            ...newBoardData[previousColumnKey],
            tasks: newBoardData[previousColumnKey].tasks.filter(t => t.id !== boardPageTask.id)
          };
        }
        if (newBoardData[targetColumnKey]) {
          newBoardData[targetColumnKey] = {
            ...newBoardData[targetColumnKey],
            tasks: [boardPageTask, ...newBoardData[targetColumnKey].tasks]
          };
        } else {
          console.error(`ProjectBoard: Target column ${targetColumnKey} not found in boardData during update.`);
        }
      }

      return newBoardData;
    });

    if (selectedTask && selectedTask.id === boardPageTask.id) {
      console.log('🔄 ProjectBoard: Updating selectedTask with new status:', boardPageTask.status);
      setSelectedTask(boardPageTask);
    }
  }

  // Handle task update failure (to revert optimistic update)
  const handleTaskUpdateFailed = (originalTaskData: any, attemptedOptimisticTaskData: any) => {
    console.warn('ProjectBoard: Task update failed. Reverting optimistic changes for task ID:', originalTaskData.id);

    const { statusIdToColumnKey, statusIdToDisplayStatusString } = getStatusMapping();

    // Handle both numeric and string status formats
    const statusStringToId: Record<string, number> = {}
    Object.entries(statusIdToDisplayStatusString).forEach(([id, name]) => {
      if (name) statusStringToId[name] = Number(id)
    })

    // Normalize original status to numeric ID
    let originalNumericStatus: number;
    if (typeof originalTaskData.status === 'number') {
      originalNumericStatus = originalTaskData.status;
    } else if (typeof originalTaskData.status === 'string') {
      originalNumericStatus = statusStringToId[originalTaskData.status] || 1;
    } else {
      originalNumericStatus = 1;
    }
    
    // Determine original and attempted column keys from their numeric statuses
    const originalColumnKey = statusIdToColumnKey[originalNumericStatus];
    const originalDisplayStatusString = statusIdToDisplayStatusString[originalNumericStatus];

    // Normalize attempted status to numeric ID
    let attemptedNumericStatus: number;
    if (typeof attemptedOptimisticTaskData.status === 'number') {
      attemptedNumericStatus = attemptedOptimisticTaskData.status;
    } else if (typeof attemptedOptimisticTaskData.status === 'string') {
      attemptedNumericStatus = statusStringToId[attemptedOptimisticTaskData.status] || 1;
    } else {
      attemptedNumericStatus = 1;
    }

    const attemptedColumnKey = statusIdToColumnKey[attemptedNumericStatus];

    if (!originalColumnKey || !originalDisplayStatusString) {
      console.error(`ProjectBoard: Invalid original status ID ${originalNumericStatus} during revert. Board may be inconsistent.`);
      fetchBoardData(); // Fallback
      return;
    }

    const normalizedOriginalLabels: string[] = (originalTaskData.labels || []).map((lbl: any)=> typeof lbl === 'string'? lbl : lbl?.name ?? '').filter(Boolean);

    const revertedBoardTask: Task = {
      id: originalTaskData.id,
      title: originalTaskData.title,
      description: originalTaskData.description,
      assigneeId: originalTaskData.assigneeId,
      assigneeName: originalTaskData.assigneeName,
      assignee: originalTaskData.assignee,
      priority: originalTaskData.priority,
      status: originalDisplayStatusString,
      type: originalTaskData.type,
      labels: normalizedOriginalLabels,
      dueDate: originalTaskData.dueDate,
      estimatedHours: originalTaskData.estimatedHours,
      comments: originalTaskData.comments,
      attachments: originalTaskData.attachments,
      position: originalTaskData.position || 0,
    };

    setBoardData(prevBoardData => {
      // Use shallow cloning for better performance
      const newBoardData = { ...prevBoardData };

      // Remove the optimistically placed/updated task
      let removedFromAttemptedCol = false;
      if (attemptedColumnKey && newBoardData[attemptedColumnKey]) {
        const taskIndexOptimistic = newBoardData[attemptedColumnKey].tasks.findIndex(t => t.id === attemptedOptimisticTaskData.id);
        if (taskIndexOptimistic !== -1) {
          newBoardData[attemptedColumnKey] = {
            ...newBoardData[attemptedColumnKey],
            tasks: newBoardData[attemptedColumnKey].tasks.filter(t => t.id !== attemptedOptimisticTaskData.id)
          };
          removedFromAttemptedCol = true;
        }
      }
      if(!removedFromAttemptedCol){
         for (const colKeyStr in newBoardData) {
            const currentColumnKey = colKeyStr as keyof BoardData;
            const taskIndex = newBoardData[currentColumnKey].tasks.findIndex(t => t.id === attemptedOptimisticTaskData.id);
            if (taskIndex !== -1) {
              newBoardData[currentColumnKey] = {
                ...newBoardData[currentColumnKey],
                tasks: newBoardData[currentColumnKey].tasks.filter(t => t.id !== attemptedOptimisticTaskData.id)
              };
              break; 
            }
          }
      }
      
      // Add the original task back to its original column
      if (newBoardData[originalColumnKey]) {
        const taskExistsInOriginalCol = newBoardData[originalColumnKey].tasks.some(t => t.id === revertedBoardTask.id);
        if (!taskExistsInOriginalCol) {
          newBoardData[originalColumnKey] = {
            ...newBoardData[originalColumnKey],
            tasks: [revertedBoardTask, ...newBoardData[originalColumnKey].tasks]
          };
        } else {
            const existingIndex = newBoardData[originalColumnKey].tasks.findIndex(t => t.id === revertedBoardTask.id);
            if(existingIndex !== -1) {
              newBoardData[originalColumnKey] = {
                ...newBoardData[originalColumnKey],
                tasks: [...newBoardData[originalColumnKey].tasks]
              };
              newBoardData[originalColumnKey].tasks[existingIndex] = revertedBoardTask;
            }
        }
      } else {
        console.error(`ProjectBoard: Original column ${originalColumnKey} not found during revert. Task may be lost from UI.`);
      }
      return newBoardData;
    });

    if (selectedTask && selectedTask.id === originalTaskData.id) {
      setSelectedTask(revertedBoardTask); 
    }

    console.error(`Task ${originalTaskData.id} update failed and has been reverted on the board.`);
  }

  // Handle task deletion
  const handleTaskDeleted = () => {
    // Refresh board data to remove deleted task
    fetchBoardData()
    setTaskDetailOpen(false)
    setSelectedTask(null)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading board...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-red-600">Error: {error}</div>
      </div>
    )
  }

  return (
    <div className={cn(
      "p-4 md:p-6 w-full transition-all duration-300", 
      (taskDetailOpen || createTaskOpen) ? "md:pr-[366px]" : ""
    )}>
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Board</h1>
          <div className="flex items-center gap-2">
            <span className="font-medium">{project?.name || 'Project Board'}</span>
            <span className="text-sm text-muted-foreground">Synced {lastSynced}</span>
          </div>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => {
            // Use the first column ID instead of hardcoded "todo"
            const firstColumn = Object.values(boardData).sort((a, b) => (a.order || 0) - (b.order || 0))[0]
            handleOpenCreateTask(firstColumn?.id || "")
          }}
        >
          <Plus className="mr-2 h-4 w-4" /> Add Task
        </Button>
      </div>

      {/* Empty State */}
      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <LayoutGrid className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No tasks on the board yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Start by adding tasks to your board to track your work visually.
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => {
            // Use the first column ID instead of hardcoded "todo"
            const firstColumn = Object.values(boardData).sort((a, b) => (a.order || 0) - (b.order || 0))[0]
            handleOpenCreateTask(firstColumn?.id || "")
          }}>
            <Plus className="mr-2 h-4 w-4" /> Create Task
          </Button>
        </div>
      ) : (
        <>
          {/* Filters and View Controls */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="relative flex-grow">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search tasks..."
                  className="pl-8"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
              <div className="flex flex-wrap gap-2">
                <Select value={filters.type} onValueChange={(value) => setFilters({ ...filters, type: value })}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {Object.entries(taskTypes).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.assignee} onValueChange={(value) => setFilters({ ...filters, assignee: value })}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Assignee" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Assignees</SelectItem>
                    {getAllAssignees().map((name) => (
                      <SelectItem key={name} value={name}>
                        {name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.priority} onValueChange={(value) => setFilters({ ...filters, priority: value })}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Priority" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Priorities</SelectItem>
                    {Object.entries(priorityLevels).map(([key, { label }]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filters.label} onValueChange={(value) => setFilters({ ...filters, label: value })}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Label" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Labels</SelectItem>
                    {getAllLabels().map((label) => (
                      <SelectItem key={label} value={label}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9 px-3">
                      <SlidersHorizontal className="h-4 w-4 mr-2" />
                      View
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuLabel>View Options</DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem
                      checked={viewMode === "detailed"}
                      onCheckedChange={() => setViewMode("detailed")}
                    >
                      Detailed View
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuCheckboxItem
                      checked={viewMode === "compact"}
                      onCheckedChange={() => setViewMode("compact")}
                    >
                      Compact View
                    </DropdownMenuCheckboxItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuCheckboxItem checked={showCompletedTasks} onCheckedChange={setShowCompletedTasks}>
                      Show Completed Tasks
                    </DropdownMenuCheckboxItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Board */}
          <div
            ref={boardRef}
            className="flex gap-4 pb-4 min-h-[calc(100vh-300px)] w-full"
            style={{ scrollBehavior: isScrolling ? "auto" : "smooth" }}
          >
            {Object.values(boardData)
              .sort((a, b) => (a.order || 0) - (b.order || 0))
              .map((column) => {
              const filteredTasks = filterTasks(column.tasks)

              // Deduplicate tasks by id to avoid duplicate key warnings (can occur with rapid drag/drop)
              const uniqueTasks: Task[] = []
              const seenIds = new Set<number>()
              for (const t of filteredTasks) {
                if (!seenIds.has(t.id)) {
                  uniqueTasks.push(t)
                  seenIds.add(t.id)
                }
              }

              // Sort tasks by position
              uniqueTasks.sort((a, b) => a.position - b.position)

              const isEmpty = uniqueTasks.length === 0
              const ColumnIcon = getStageIcon(column.order || 0, column.isCompleted || false)

              return (
                <div
                  key={column.id}
                  className={cn(
                    "flex-1 min-w-0 bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden transition-all duration-200",
                    dragOverColumn === column.id && !dragOverTaskId && "border-violet-500 ring-2 ring-violet-500 ring-opacity-30 bg-violet-50 dark:bg-violet-950/10 shadow-lg",
                    draggedTask && draggedTask.columnId !== column.id && "border-dashed border-gray-300 dark:border-gray-600",
                  )}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ColumnIcon className="h-4 w-4" style={{ color: column.color || '#6b7280' }} />
                      <h3 className="font-medium">{column.title}</h3>
                      <Badge
                        variant="outline"
                        className="ml-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {uniqueTasks.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => handleOpenCreateTask(column.id)}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  <div className="p-2 max-h-[calc(100vh-300px)] overflow-y-auto">
                    {isEmpty ? (
                      <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                        <p className="text-muted-foreground text-sm">No tasks in this column.</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {uniqueTasks.map((task: Task) => {
                          const PriorityIcon = priorityLevels[task.priority as keyof typeof priorityLevels]?.icon || Clock
                          const priorityColor = priorityLevels[task.priority as keyof typeof priorityLevels]?.color || "text-gray-500"
                          const taskTypeColor = task.type ? taskTypes[task.type as keyof typeof taskTypes]?.color || "" : ""

                          return (
                            <div
                              key={task.id}
                              className={cn(
                                "p-3 bg-white dark:bg-gray-800 rounded-md border shadow-sm hover:shadow-md transition-all duration-200 cursor-pointer",
                                dragOverTaskId === task.id && "border-violet-500 ring-2 ring-violet-500 ring-opacity-50 bg-violet-50 dark:bg-violet-950/20",
                                draggedTask?.task.id === task.id && "opacity-40 scale-95 shadow-none",
                                selectedTask?.id === task.id && taskDetailOpen && "border-violet-600 ring-2 ring-violet-600 ring-opacity-40 bg-violet-50 dark:bg-violet-950/30 shadow-lg",
                                viewMode === "compact" ? "p-2" : "p-3",
                                taskTypeColor.includes("border") &&
                                  `border-l-4 ${taskTypeColor.split(" ").find((c: string) => c.startsWith("border-"))}`,
                                "hover:scale-[1.02] active:scale-95",
                              )}
                              draggable
                              onDragStart={(e) => handleDragStart(e, task, column.id)}
                              onDragOver={(e) => handleDragOver(e, column.id, task.id)}
                              onDrop={(e) => handleDrop(e, column.id, task.id)}
                              onDragEnd={handleDragEnd}
                              onClick={() => handleOpenTaskDetail(task)}
                            >
                              <div className="flex items-start justify-between mb-2">
                                <div className="font-medium truncate mr-2">{task.title}</div>
                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Badge className={task.type ? taskTypes[task.type as keyof typeof taskTypes]?.color || "bg-gray-100" : "bg-gray-100"}>
                                    {task.type ? taskTypes[task.type as keyof typeof taskTypes]?.label || "Task" : "Task"}
                                  </Badge>
                                </div>
                              </div>

                              {viewMode === "detailed" && task.labels && task.labels.length > 0 && (
                                <div className="mb-2 flex flex-wrap gap-1">
                                  {task.labels.map((label: string) => (
                                    <Badge
                                      key={label}
                                      variant="outline"
                                      className="bg-gray-50 text-gray-700 dark:bg-gray-800 dark:text-gray-300 text-xs"
                                    >
                                      {label}
                                    </Badge>
                                  ))}
                                </div>
                              )}

                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                  <TooltipProvider>
                                    <Tooltip>
                                      <TooltipTrigger asChild>
                                        <Avatar className="h-6 w-6">
                                          <AvatarImage src={task.assignee?.image} alt={task.assignee?.name || task.assigneeName} />
                                          <AvatarFallback className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 text-xs">
                                            {task.assignee?.initials || (task.assigneeName ? task.assigneeName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2) : '?')}
                                          </AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{task.assignee?.name || task.assigneeName || 'Unassigned'}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <PriorityIcon className={`h-4 w-4 ${priorityColor}`} />
                                </div>

                                <div className="flex items-center gap-3 text-muted-foreground">
                                  {(task.comments || 0) > 0 && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      <span>{task.comments}</span>
                                    </div>
                                  )}

                                  {(task.attachments || 0) > 0 && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <Paperclip className="h-3.5 w-3.5" />
                                      <span>{task.attachments}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Create Task Sidebar */}
      <CreateTaskSidebar
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        onTaskCreated={handleTaskCreated}
        projectPublicId={projectId}
        selectedColumnId={selectedColumn}
        initialStage={selectedColumn ? getInitialStageFromColumn(selectedColumn) : "To Do"}
      />

      {/* Task Detail View Sidebar - Optimized for drag performance */}
      {selectedTask && projectId && (
        <TaskDetailView
          key={selectedTask.id} // Use stable key to prevent unnecessary remounts
          open={taskDetailOpen}
          onOpenChange={setTaskDetailOpen}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          onTaskUpdateFailed={handleTaskUpdateFailed}
          projectPublicId={projectId}
          isDragging={!!draggedTask} // Pass drag state to optimize rendering
        />
      )}

      {/* Demo Controls - Remove in production */}
      <div className="mt-8 pt-4 border-t">
        <Button variant="outline" onClick={toggleEmptyState} className="text-xs">
          Toggle Empty State (Demo)
        </Button>
      </div>
    </div>
  )
} 