"use client"

import { useState, useRef, useEffect } from "react"
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
import { useProject } from "@/contexts/project-context"

// Type definitions
interface Task {
  id: number
  title: string
  description?: string
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
}

interface Column {
  id: string
  title: string
  tasks: Task[]
  status?: string
}

interface BoardData {
  todo: Column
  inprogress: Column
  inreview: Column
  done: Column
}

interface ApiResponse {
  projectId: string
  columns: Array<{
    id: string
    title: string
    status: string
    tasks: Task[]
  }>
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

// Column definitions
const columnDefinitions = [
  { id: "todo", title: "To Do", icon: Clock, status: "Todo" },
  { id: "inprogress", title: "In Progress", icon: ArrowUp, status: "InProgress" },
  { id: "inreview", title: "In Review", icon: CheckCircle, status: "InReview" },
  { id: "done", title: "Done", icon: CheckCircle, status: "Done" },
]

export default function BoardPage() {
  const { currentProject } = useProject()
  const [boardData, setBoardData] = useState<BoardData>({
    todo: { id: "todo", title: "To Do", tasks: [] },
    inprogress: { id: "inprogress", title: "In Progress", tasks: [] },
    inreview: { id: "inreview", title: "In Review", tasks: [] },
    done: { id: "done", title: "Done", tasks: [] },
  })
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
  const [selectedColumn, setSelectedColumn] = useState("todo")
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [participants, setParticipants] = useState<Array<{userName?: string, UserName?: string}>>([])
  const [lastSynced, setLastSynced] = useState<string | null>(null)

  // Fetch board data
  const fetchBoardData = async (filterParams = {}) => {
    if (!currentProject?.publicId) return

    try {
      setLoading(true)
      
      // Build filter parameters
      const queryParams = new URLSearchParams()
      
      if (searchQuery) queryParams.append('SearchTerm', searchQuery)
      if (filters.assignee !== 'all') queryParams.append('AssigneeName', filters.assignee)
      if (filters.priority !== 'all') queryParams.append('Priority', filters.priority)
      
      const endpoint = `/api/projects/public/${currentProject.publicId}/board${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
      const data = await apiRequest<ApiResponse>(endpoint)
      
      // Transform API data to match frontend structure
      const transformedData: BoardData = {
        todo: { id: "todo", title: "To Do", tasks: [] },
        inprogress: { id: "inprogress", title: "In Progress", tasks: [] },
        inreview: { id: "inreview", title: "In Review", tasks: [] },
        done: { id: "done", title: "Done", tasks: [] },
      }

      // Map tasks to columns based on status
      data.columns.forEach((column) => {
        const columnKey = column.id.toLowerCase() as keyof BoardData
        if (transformedData[columnKey]) {
          transformedData[columnKey].tasks = column.tasks || []
        }
      })

      setBoardData(transformedData)
      setLastSynced(new Date().toLocaleTimeString())
      setError(null)
    } catch (err) {
      console.error('Error fetching board data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch board data')
    } finally {
      setLoading(false)
    }
  }

  // Fetch participants for filter dropdown
  const fetchParticipants = async () => {
    if (!currentProject?.publicId) return

    try {
      const data = await apiRequest<Array<{userName?: string, UserName?: string}>>(`/api/projects/public/${currentProject.publicId}/participants`)
      setParticipants(data || [])
    } catch (err) {
      console.error('Error fetching participants:', err)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (currentProject?.publicId) {
      fetchBoardData()
      fetchParticipants()
    }
  }, [currentProject?.publicId])

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentProject?.publicId) {
        fetchBoardData()
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters, currentProject?.publicId])

  // Get all unique labels from tasks
  const getAllLabels = (): string[] => {
    const labels = new Set<string>()
    Object.values(boardData).forEach((column) => {
      column.tasks.forEach((task: Task) => {
        if (task.labels) {
          task.labels.forEach((label: string) => {
            labels.add(label)
          })
        }
      })
    })
    return Array.from(labels)
  }

  // Get all assignees
  const getAllAssignees = (): string[] => {
    return participants.map(p => p.userName || p.UserName).filter(Boolean) as string[]
  }

  // Filter tasks based on search and filters
  const filterTasks = (tasks: Task[]) => {
    if (!tasks) return []

    return tasks.filter((task: Task) => {
      // Search filter
      const matchesSearch = searchQuery === "" || task.title.toLowerCase().includes(searchQuery.toLowerCase())

      // Type filter
      const matchesType = filters.type === "all" || task.type === filters.type

      // Assignee filter
      const matchesAssignee = filters.assignee === "all" || (task.assignee && task.assignee.name === filters.assignee)

      // Priority filter
      const matchesPriority = filters.priority === "all" || task.priority.toString() === filters.priority

      // Label filter
      const matchesLabel = filters.label === "all" || (task.labels && task.labels.includes(filters.label))

      // Completed filter (hide completed tasks if showCompletedTasks is false)
      const matchesCompleted = showCompletedTasks || boardData.done.tasks.findIndex((t) => t.id === task.id) === -1

      return matchesSearch && matchesType && matchesAssignee && matchesPriority && matchesLabel && matchesCompleted
    })
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setFilters({
      type: "all",
      assignee: "all",
      priority: "all",
      label: "all",
    })
    setShowCompletedTasks(true)
  }

  // Handle drag start
  const handleDragStart = (e: React.DragEvent, task: Task, columnId: string) => {
    setDraggedTask({ task, columnId })
    // Create a ghost image for dragging
    const ghostElement = document.createElement("div")
    ghostElement.classList.add("invisible")
    document.body.appendChild(ghostElement)
    e.dataTransfer.setDragImage(ghostElement, 0, 0)
    ;(e.target as HTMLElement).style.opacity = "0.6"
  }

  // Handle drag over
  const handleDragOver = (e: React.DragEvent, columnId: string, taskId: number | null = null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(columnId)
    setDragOverTaskId(taskId)

    // Auto-scroll functionality
    const boardElement = boardRef.current
    if (boardElement) {
      const rect = boardElement.getBoundingClientRect()
      const scrollThreshold = 100

      if (e.clientX < rect.left + scrollThreshold) {
        if (!isScrolling || scrollDirection !== "left") {
          setScrollDirection("left")
          setIsScrolling(true)
        }
      } else if (e.clientX > rect.right - scrollThreshold) {
        if (!isScrolling || scrollDirection !== "right") {
          setScrollDirection("right")
          setIsScrolling(true)
        }
      } else {
        setIsScrolling(false)
        setScrollDirection(null)
      }
    }
  }

  // Auto-scroll functionality
  const startScrolling = (direction: string) => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current)
    }

    scrollInterval.current = setInterval(() => {
      const boardElement = boardRef.current
      if (boardElement) {
        const scrollAmount = direction === "left" ? -10 : 10
        boardElement.scrollLeft += scrollAmount
      }
    }, 50)
  }

  const stopScrolling = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current)
      scrollInterval.current = null
    }
    setIsScrolling(false)
    setScrollDirection(null)
  }

  // Handle drop
  const handleDrop = (e: React.DragEvent, targetColumnId: string, targetTaskId: number | null = null) => {
    e.preventDefault()
    stopScrolling()

    if (!draggedTask) return

    const { task, columnId: sourceColumnId } = draggedTask

    // Don't do anything if dropping in the same position
    if (sourceColumnId === targetColumnId && !targetTaskId) return

    // Update the task status if moving to different column
    if (sourceColumnId !== targetColumnId) {
      updateTaskStatus(task.id, targetColumnId)
    }

    // Reset drag state
    setDraggedTask(null)
    setDragOverColumn(null)
    setDragOverTaskId(null)
  }

  // Update task status via API
  const updateTaskStatus = async (taskId: number, newColumnId: string) => {
    if (!currentProject?.publicId) return

    try {
      const statusMap: Record<string, number> = {
        todo: 1,        // Todo
        inprogress: 2,  // InProgress
        inreview: 3,    // InReview
        done: 4         // Done
      }

      await apiRequest(`/api/projects/public/${currentProject.publicId}/tasks/${taskId}`, {
        method: 'PUT',
        body: JSON.stringify({
          status: statusMap[newColumnId]
        })
      })

      // Update selected task if it's the one being moved
      if (selectedTask && selectedTask.id === taskId) {
        const statusNames: Record<number, string> = {
          1: "To Do",
          2: "In Progress", 
          3: "In Review",
          4: "Done"
        }
        setSelectedTask({
          ...selectedTask,
          status: statusNames[statusMap[newColumnId]]
        })
      }

      // Refresh board data
      fetchBoardData()
    } catch (err) {
      console.error('Error updating task status:', err)
    }
  }

  // Handle drag end
  const handleDragEnd = (e: React.DragEvent) => {
    ;(e.target as HTMLElement).style.opacity = "1"
    const ghostElement = document.querySelector(".invisible")
    if (ghostElement && ghostElement.parentNode) {
      ghostElement.parentNode.removeChild(ghostElement)
    }
    setDraggedTask(null)
    setDragOverColumn(null)
    setDragOverTaskId(null)
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
  }

  // Handle task creation
  const handleTaskCreated = () => {
    // Refresh board data to show new task
    fetchBoardData()
    setCreateTaskOpen(false)
  }

  // Handle opening task detail view
  const handleOpenTaskDetail = (task: Task) => {
    setSelectedTask(task)
    setTaskDetailOpen(true)
  }

  // Handle task update (called optimistically and on success from TaskDetailView)
  const handleTaskUpdated = (updatedTaskData?: any, isOptimistic?: boolean) => {
    if (!updatedTaskData || typeof updatedTaskData.id === 'undefined') {
      console.warn('BoardPage: handleTaskUpdated called with invalid data:', updatedTaskData);
      fetchBoardData(); 
      return;
    }

    // console.log(`BoardPage: handleTaskUpdated (isOptimistic: ${isOptimistic}) with:`, updatedTaskData);

    const statusIdToColumnKey: Record<number, keyof BoardData | undefined> = {
      1: "todo", 2: "inprogress", 3: "inreview", 4: "done",
    };
    const statusIdToDisplayStatusString: Record<number, string | undefined> = {
      1: "Todo", 2: "InProgress", 3: "InReview", 4: "Done",
    };

    const targetColumnKey = statusIdToColumnKey[updatedTaskData.status];
    const newDisplayStatusString = statusIdToDisplayStatusString[updatedTaskData.status];

    if (!targetColumnKey || !newDisplayStatusString) {
      console.error(`BoardPage: Invalid status ID ${updatedTaskData.status} from updated task. Refetching board data.`);
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
    };

    setBoardData(prevBoardData => {
      const newBoardData = JSON.parse(JSON.stringify(prevBoardData)) as BoardData;

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
        newBoardData[targetColumnKey].tasks[previousIndex] = boardPageTask;
      } else {
        // Otherwise remove it from wherever it was and insert at top of new column
        if (previousColumnKey && previousIndex !== -1) {
          newBoardData[previousColumnKey].tasks.splice(previousIndex, 1);
        }
        if (newBoardData[targetColumnKey]) {
          newBoardData[targetColumnKey].tasks.unshift(boardPageTask);
        } else {
          console.error(`BoardPage: Target column ${targetColumnKey} not found in boardData during update.`);
        }
      }

      return newBoardData;
    });

    if (selectedTask && selectedTask.id === boardPageTask.id) {
      setSelectedTask(boardPageTask);
    }
    
    // IMPORTANT: Do NOT close TaskDetailView here if the update is optimistic.
    // TaskDetailView will handle its own closure based on its API call result.
    // if (!isOptimistic) {
    //   setTaskDetailOpen(false);
    // }
  }

  // Handle task update failure (to revert optimistic update)
  const handleTaskUpdateFailed = (originalTaskData: any, attemptedOptimisticTaskData: any) => {
    console.warn('BoardPage: Task update failed. Reverting optimistic changes for task ID:', originalTaskData.id);

    const statusIdToColumnKey: Record<number, keyof BoardData | undefined> = {
      1: "todo", 2: "inprogress", 3: "inreview", 4: "done",
    };
    const statusIdToDisplayStatusString: Record<number, string | undefined> = {
      1: "Todo", 2: "InProgress", 3: "InReview", 4: "Done",
    };
    
    // Determine original and attempted column keys from their numeric statuses
    const originalNumericStatus = originalTaskData.status; // status from originalTaskForRevert in TaskDetailView
    const originalColumnKey = statusIdToColumnKey[originalNumericStatus];
    const originalDisplayStatusString = statusIdToDisplayStatusString[originalNumericStatus];

    const attemptedNumericStatus = attemptedOptimisticTaskData.status; // status from optimisticUpdatedTask in TaskDetailView
    const attemptedColumnKey = statusIdToColumnKey[attemptedNumericStatus];


    if (!originalColumnKey || !originalDisplayStatusString) {
      console.error(`BoardPage: Invalid original status ID ${originalNumericStatus} during revert. Board may be inconsistent.`);
      fetchBoardData(); // Fallback
      return;
    }

    const normalizedOriginalLabels: string[] = (originalTaskData.labels || []).map((lbl: any)=> typeof lbl === 'string'? lbl : lbl?.name ?? '').filter(Boolean);

    const revertedBoardTask: Task = {
      id: originalTaskData.id,
      title: originalTaskData.title,
      description: originalTaskData.description,
      assigneeName: originalTaskData.assigneeName,
      assignee: originalTaskData.assignee,
      priority: originalTaskData.priority,
      status: originalDisplayStatusString, // Use string status for board
      type: originalTaskData.type,
      labels: normalizedOriginalLabels,
      dueDate: originalTaskData.dueDate,
      estimatedHours: originalTaskData.estimatedHours,
      comments: originalTaskData.comments,
      attachments: originalTaskData.attachments,
    };

    setBoardData(prevBoardData => {
      const newBoardData = JSON.parse(JSON.stringify(prevBoardData)) as BoardData;

      // 1. Remove the optimistically placed/updated task
      // It has the same ID (attemptedOptimisticTaskData.id)
      let removedFromAttemptedCol = false;
      if (attemptedColumnKey && newBoardData[attemptedColumnKey]) {
        const taskIndexOptimistic = newBoardData[attemptedColumnKey].tasks.findIndex(t => t.id === attemptedOptimisticTaskData.id);
        if (taskIndexOptimistic !== -1) {
          newBoardData[attemptedColumnKey].tasks.splice(taskIndexOptimistic, 1);
          removedFromAttemptedCol = true;
        }
      }
      // If not found in specific attemptedColumn (e.g., if status didn't change column or attemptedColumnKey was bad)
      // search all columns to ensure its removal if it was updated in place.
      if(!removedFromAttemptedCol){
         for (const colKeyStr in newBoardData) {
            const currentColumnKey = colKeyStr as keyof BoardData;
            const taskIndex = newBoardData[currentColumnKey].tasks.findIndex(t => t.id === attemptedOptimisticTaskData.id);
            if (taskIndex !== -1) {
              newBoardData[currentColumnKey].tasks.splice(taskIndex, 1);
              break; 
            }
          }
      }
      
      // 2. Add the original task back to its original column
      if (newBoardData[originalColumnKey]) {
        // Ensure not to add duplicates if removal somehow failed or task was in same column
        const taskExistsInOriginalCol = newBoardData[originalColumnKey].tasks.some(t => t.id === revertedBoardTask.id);
        if (!taskExistsInOriginalCol) {
          newBoardData[originalColumnKey].tasks.unshift(revertedBoardTask);
        } else {
            // If it exists, make sure it's the *reverted* version
            const existingIndex = newBoardData[originalColumnKey].tasks.findIndex(t => t.id === revertedBoardTask.id);
            if(existingIndex !== -1) newBoardData[originalColumnKey].tasks[existingIndex] = revertedBoardTask;
        }
      } else {
        console.error(`BoardPage: Original column ${originalColumnKey} not found during revert. Task may be lost from UI.`);
        // As a fallback, try adding to 'todo' or a default column if original is somehow invalid
        // For now, it might disappear from the UI if the original column is invalid.
      }
      return newBoardData;
    });

    if (selectedTask && selectedTask.id === originalTaskData.id) {
      setSelectedTask(revertedBoardTask); 
    }

    console.error(`Task ${originalTaskData.id} update failed and has been reverted on the board.`);
    // Consider alerting the user via a toast message here.
    // TaskDetailView is expected to remain open with unsaved changes.
    // Its 'initialTask' prop won't change, so it should reflect its pre-API call state.
  }

  // Handle task deletion
  const handleTaskDeleted = () => {
    // Refresh board data to remove deleted task
    fetchBoardData()
    setTaskDetailOpen(false)
    setSelectedTask(null)
  }

  return (
    <div className={cn("p-4 md:p-6 w-full transition-all duration-300", taskDetailOpen ? "md:pr-[366px]" : "")}>
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Board</h1>
          <div className="flex items-center gap-2">
            <span className="font-medium">{currentProject?.name}</span>
            <span className="text-sm text-muted-foreground">Synced {lastSynced}</span>
          </div>
        </div>
        <Button
          className="bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => {
            setSelectedColumn("todo")
            setCreateTaskOpen(true)
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
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setCreateTaskOpen(true)}>
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
                      <span>View</span>
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
            className="flex gap-4 overflow-x-auto pb-4 min-h-[calc(100vh-300px)]"
            style={{ scrollBehavior: isScrolling ? "auto" : "smooth" }}
          >
            {columnDefinitions.map((column) => {
              const columnData = boardData[column.id as keyof BoardData]
              const filteredTasks = filterTasks(columnData.tasks)
              const isEmpty = filteredTasks.length === 0
              const ColumnIcon = column.icon

              return (
                <div
                  key={column.id}
                  className={cn(
                    "flex-shrink-0 w-80 bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden",
                    dragOverColumn === column.id && !dragOverTaskId && "border-violet-500 ring-1 ring-violet-500",
                  )}
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  <div className="p-3 border-b bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <ColumnIcon className="h-4 w-4 text-muted-foreground" />
                      <h3 className="font-medium">{column.title}</h3>
                      <Badge
                        variant="outline"
                        className="ml-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {filteredTasks.length}
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
                        {filteredTasks.map((task: Task) => {
                          const PriorityIcon = priorityLevels[task.priority as keyof typeof priorityLevels]?.icon || Clock
                          const priorityColor = priorityLevels[task.priority as keyof typeof priorityLevels]?.color || "text-gray-500"
                          const taskTypeColor = task.type ? taskTypes[task.type as keyof typeof taskTypes]?.color || "" : ""

                          return (
                            <div
                              key={task.id}
                              className={cn(
                                "p-3 bg-white dark:bg-gray-800 rounded-md border shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                                dragOverTaskId === task.id && "border-violet-500 ring-1 ring-violet-500",
                                viewMode === "compact" ? "p-2" : "p-3",
                                taskTypeColor.includes("border") &&
                                  `border-l-4 ${taskTypeColor.split(" ").find((c: string) => c.startsWith("border-"))}`,
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
                                          <AvatarImage src={task.assignee?.image} alt={task.assignee?.name} />
                                          <AvatarFallback>{task.assignee?.initials}</AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{task.assignee?.name}</p>
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
        projectPublicId={currentProject?.publicId}
        selectedColumnId={selectedColumn}
      />

      {/* Task Detail View Sidebar */}
      {selectedTask && currentProject?.publicId && (
        <TaskDetailView
          key={selectedTask.id + (selectedTask.status || '') + (selectedTask.title || '')} // More robust key for re-renders on change
          open={taskDetailOpen}
          onOpenChange={setTaskDetailOpen}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
          onTaskUpdateFailed={handleTaskUpdateFailed} // Pass the new handler
          projectPublicId={currentProject.publicId}
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
