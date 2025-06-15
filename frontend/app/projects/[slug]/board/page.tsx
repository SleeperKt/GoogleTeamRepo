"use client"

import { useState, useRef, useEffect } from "react"
import { useParams } from "next/navigation"
import { API_BASE_URL } from "@/lib/api"
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
const priorityLevels: Record<number, { label: string; icon: any; color: string }> = {
  1: { label: "Low", icon: ArrowDown, color: "text-blue-500" },
  2: { label: "Medium", icon: MoreHorizontal, color: "text-yellow-500" },
  3: { label: "High", icon: ArrowUp, color: "text-red-500" },
  4: { label: "Critical", icon: ArrowUp, color: "text-red-600" },
}

interface Task {
  id: number
  title: string
  description?: string
  projectId: number
  assigneeId?: string
  assigneeName?: string
  status: number
  stage: number
  createdById: string
  createdByName: string
  createdAt: string
  updatedAt?: string
  dueDate?: string
  estimatedHours?: number
  priority: number
  type?: string
  labels?: string[]
  comments?: number
  attachments?: number
}

interface BoardColumn {
  id: string
  title: string
  status: number
  tasks: Task[]
}

interface BoardData {
  projectId: string
  columns: BoardColumn[]
}

interface Project {
  id: number
  name: string
  description: string
  publicId: string
  createdAt: string
}

export default function ProjectBoardPage() {
  const params = useParams()
  const projectId = params.slug as string
  
  const [boardData, setBoardData] = useState<BoardData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  
  // Filter states
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedLabels, setSelectedLabels] = useState<string[]>([])
  const [selectedAssignees, setSelectedAssignees] = useState<string[]>([])
  const [selectedPriority, setSelectedPriority] = useState("all")
  const [selectedType, setSelectedType] = useState("all")
  const [showEmptyColumns, setShowEmptyColumns] = useState(true)
  const [projectParticipants, setProjectParticipants] = useState<Array<{ id: string, name: string, initials: string }>>([])
  
  // UI states
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false)
  const [createTaskColumnId, setCreateTaskColumnId] = useState("")
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [draggedFromColumn, setDraggedFromColumn] = useState<string | null>(null)
  const [dragOverColumn, setDragOverColumn] = useState<string | null>(null)
  const [dragOverTask, setDragOverTask] = useState<number | null>(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const scrollIntervalRef = useRef<NodeJS.Timeout | null>(null)
  
  // Ref to prevent duplicate task creation in strict mode
  const isCreatingTaskRef = useRef(false)

  // Fetch board data
  useEffect(() => {
    const fetchBoardData = async () => {
      try {
        setLoading(true)
        const token = localStorage.getItem('token')
        
        // Fetch project details
        const projectResponse = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!projectResponse.ok) {
          throw new Error('Failed to fetch project')
        }
        
        const projectData = await projectResponse.json()
        setProject(projectData)
        
        // Fetch board data
        const boardResponse = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/board`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!boardResponse.ok) {
          throw new Error('Failed to fetch board data')
        }
        
        const data = await boardResponse.json()
        setBoardData(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'An error occurred')
      } finally {
        setLoading(false)
      }
    }

    if (projectId) {
      fetchBoardData()
    }
  }, [projectId])

  // Fetch project participants for filter dropdown
  useEffect(() => {
    const fetchParticipants = async () => {
      if (!projectId) return

      try {
        const token = localStorage.getItem('token')
        
        // First get internal project id
        const projectResponse = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!projectResponse.ok) return
        
        const projectData = await projectResponse.json()
        
        // Fetch participants
        const participantsResponse = await fetch(`${API_BASE_URL}/api/projects/${projectData.id}/participants`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })
        
        if (!participantsResponse.ok) return
        
        const participants = await participantsResponse.json()
        
        // Handle different response formats (array vs object with $values)
        let participantsList = participants
        if (participants && typeof participants === 'object' && !Array.isArray(participants)) {
          if (participants.$values && Array.isArray(participants.$values)) {
            participantsList = participants.$values
          } else if (participants.data && Array.isArray(participants.data)) {
            participantsList = participants.data
          } else {
            console.warn('Unexpected participants response format:', participants)
            participantsList = []
          }
        }
        
        if (!Array.isArray(participantsList)) {
          console.warn('Participants is not an array:', participantsList)
          setProjectParticipants([])
          return
        }
        
        const formattedParticipants = participantsList.map((p: any) => ({
          id: p.userId || p.UserId,
          name: p.userName || p.UserName,
          initials: (p.userName || p.UserName || "")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase(),
        }))
        
        setProjectParticipants(formattedParticipants)
      } catch (err) {
        console.error("Failed to fetch project participants", err)
        setProjectParticipants([])
      }
    }

    fetchParticipants()
  }, [projectId])

  // Get all unique labels from tasks (placeholder - not implemented in backend yet)
  const getAllLabels = () => {
    return [] // TODO: Implement labels in backend
  }

  // Get project participants for assignee filter
  const getAllAssignees = () => {
    return projectParticipants
  }

  const filterTasks = (tasks: Task[]) => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                           task.description?.toLowerCase().includes(searchTerm.toLowerCase())
      const matchesLabels = selectedLabels.length === 0 || 
                           (task.labels && selectedLabels.some(label => task.labels!.includes(label)))
      const matchesAssignees = selectedAssignees.length === 0 || 
                              (task.assigneeName && selectedAssignees.includes(task.assigneeName))
      const matchesPriority = selectedPriority === "all" || task.priority?.toString() === selectedPriority
      const matchesType = selectedType === "all" || task.type === selectedType

      return matchesSearch && matchesLabels && matchesAssignees && matchesPriority && matchesType
    })
  }

  const clearFilters = () => {
    setSearchTerm("")
    setSelectedLabels([])
    setSelectedAssignees([])
    setSelectedPriority("all")
    setSelectedType("all")
  }

  const handleDragStart = (e: React.DragEvent, task: Task, columnId: string) => {
    setDraggedTask(task)
    setDraggedFromColumn(columnId)
    e.dataTransfer.effectAllowed = "move"
  }

  const handleDragOver = (e: React.DragEvent, columnId: string, taskId: number | null = null) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = "move"
    setDragOverColumn(columnId)
    setDragOverTask(taskId)
  }

  const handleDrop = async (e: React.DragEvent, targetColumnId: string, targetTaskId: number | null = null) => {
    e.preventDefault()
    
    if (!draggedTask || !draggedFromColumn) return
    
    // Don't do anything if dropped in the same position
    if (draggedFromColumn === targetColumnId && !targetTaskId) return
    
    try {
      // Update task status via API
      const token = localStorage.getItem('token')
      const statusMap: Record<string, number> = {
        'todo': 1,
        'inprogress': 2, 
        'inreview': 3,
        'done': 4
      }
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/tasks/${draggedTask.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: draggedTask.title,
          description: draggedTask.description,
          status: statusMap[targetColumnId],
          priority: draggedTask.priority,
          assigneeId: draggedTask.assigneeId,
          dueDate: draggedTask.dueDate,
          estimatedHours: draggedTask.estimatedHours
        })
      })
      
      if (!response.ok) {
        throw new Error('Failed to update task')
      }
      
      // Update local state
      setBoardData(prevData => {
        if (!prevData) return prevData
        
        // Create a deep copy to avoid mutations
        const newData: BoardData = {
          ...prevData,
          columns: prevData.columns.map(col => ({
            ...col,
            tasks: [...col.tasks]
          }))
        }

        const sourceColumn = newData.columns.find(col => col.id === draggedFromColumn)
        const targetColumn = newData.columns.find(col => col.id === targetColumnId)

        if (sourceColumn && targetColumn) {
          // Remove from source column
          sourceColumn.tasks = sourceColumn.tasks.filter(t => t.id !== draggedTask.id)

          const updatedTask: Task = { ...draggedTask, status: statusMap[targetColumnId] }

          // Add to target column
          if (targetTaskId) {
            const targetIndex = targetColumn.tasks.findIndex(t => t.id === targetTaskId)
            targetColumn.tasks.splice(targetIndex, 0, updatedTask)
          } else {
            // Check if task already exists in target column to prevent duplicates
            const taskExists = targetColumn.tasks.some(t => t.id === updatedTask.id)
            if (!taskExists) {
              targetColumn.tasks.push(updatedTask)
            }
          }
        }

        return newData
      })
    } catch (error) {
      console.error('Error updating task:', error)
      // Could show a toast notification here
    }
    
    setDraggedTask(null)
    setDraggedFromColumn(null)
    setDragOverColumn(null)
    setDragOverTask(null)
  }

  const handleDragEnd = () => {
    setDraggedTask(null)
    setDraggedFromColumn(null)
    setDragOverColumn(null)
    setDragOverTask(null)
  }

  const handleOpenCreateTask = (columnId: string) => {
    setCreateTaskColumnId(columnId)
    setIsCreateTaskOpen(true)
  }

  const handleTaskCreated = async (newTask: Partial<Task>) => {
    // Prevent duplicate calls in React Strict Mode
    if (isCreatingTaskRef.current) {
      console.log('Task creation already in progress, skipping duplicate call')
      return
    }
    
    isCreatingTaskRef.current = true
    console.log('Starting task creation:', newTask.title)
    
    try {
      const token = localStorage.getItem('token')
      const statusMap: Record<string, number> = {
        'todo': 1,
        'inprogress': 2,
        'inreview': 3,
        'done': 4
      }

      // Map string priorities to numeric values expected by backend
      const priorityMap: Record<string | number, number> = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
      }

      // Build payload according to CreateTaskRequest DTO (backend)
      const payload = {
        title: newTask.title ?? '',
        description: newTask.description ?? '',
        assigneeId: (newTask as any).assigneeId ?? null, // Sidebar will eventually supply a GUID
        dueDate: newTask.dueDate ? new Date(newTask.dueDate as any).toISOString() : null,
        estimatedHours: (newTask as any).estimate ?? newTask.estimatedHours ?? null,
        priority: priorityMap[(newTask.priority as any) ?? 1] ?? 1,
        status: statusMap[createTaskColumnId],
        type: newTask.type ?? 'task',
      }

      console.log('Sending task creation request:', payload)

      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/tasks`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error('Failed to create task')
      }
      
      const createdTask = await response.json()
      console.log('Task created successfully:', createdTask.id, createdTask.title)
      
      // Update local state with proper duplicate prevention
      setBoardData(prevData => {
        if (!prevData) return prevData
        
        console.log('Updating board data with new task')
        
        // Create a deep copy to avoid mutations
        const newData: BoardData = {
          ...prevData,
          columns: prevData.columns.map(col => ({
            ...col,
            tasks: [...col.tasks]
          }))
        }
        
        const targetColumn = newData.columns.find(col => col.id === createTaskColumnId)
        if (targetColumn) {
          // Only add if not already present (prevents duplicates from React strict mode)
          const taskExists = targetColumn.tasks.some(t => t.id === createdTask.id)
          console.log('Task exists check:', taskExists, 'for task ID:', createdTask.id)
          if (!taskExists) {
            targetColumn.tasks.push(createdTask)
            console.log('Task added to column:', createTaskColumnId)
          } else {
            console.log('Task already exists, skipping add')
          }
        }
        return newData
      })
      
      setIsCreateTaskOpen(false)
      setCreateTaskColumnId("")
    } catch (error) {
      console.error('Error creating task:', error)
      // Could show a toast notification here
    } finally {
      // Reset the flag after a short delay to allow for any pending state updates
      setTimeout(() => {
        isCreatingTaskRef.current = false
        console.log('Task creation flag reset')
      }, 100)
    }
  }

  const handleOpenTaskDetail = (task: Task) => {
    setSelectedTask(task)
  }

  const handleTaskUpdated = async (updatedTask: Task) => {
    try {
      const token = localStorage.getItem('token')
      
      // Prepare payload adhering to UpdateTaskRequest DTO
      const statusMap: Record<string | number, number> = {
        "To Do": 1,
        "In Progress": 2,
        "Review": 3,
        "Done": 4,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
      }

      const priorityMap: Record<string | number, number> = {
        low: 1,
        medium: 2,
        high: 3,
        critical: 4,
        1: 1,
        2: 2,
        3: 3,
        4: 4,
      }

      const payload: any = {
        title: updatedTask.title,
        description: updatedTask.description,
        assigneeId: updatedTask.assigneeId ?? null,
        status: statusMap[(updatedTask.status as any) ?? updatedTask.stage],
        dueDate: updatedTask.dueDate ?? null,
        priority: priorityMap[updatedTask.priority ?? 1] ?? undefined,
        estimatedHours: updatedTask.estimatedHours ?? undefined,
        type: updatedTask.type ?? 'task',
      }

      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/tasks/${updatedTask.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      })
      
      if (!response.ok) {
        throw new Error('Failed to update task')
      }
      
      const updated = await response.json()
      
      // Update local state
      setBoardData(prevData => {
        if (!prevData) return prevData
        const newData: BoardData = { ...prevData }
        newData.columns.forEach(column => {
          const taskIndex = column.tasks.findIndex(t => t.id === updated.id)
          if (taskIndex !== -1) {
            column.tasks[taskIndex] = updated
          }
        })
        return newData
      })
      
      setSelectedTask(null)
    } catch (error) {
      console.error('Error updating task:', error)
      // Could show a toast notification here
    }
  }

  const handleTaskDeleted = async (taskId: number) => {
    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/tasks/${taskId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        }
      })
      
      if (!response.ok) {
        throw new Error('Failed to delete task')
      }
      
      // Update local state
      setBoardData(prevData => {
        if (!prevData) return prevData
        const newData: BoardData = { ...prevData }
        newData.columns.forEach(column => {
          column.tasks = column.tasks.filter(t => t.id !== taskId)
        })
        return newData
      })
      
      setSelectedTask(null)
    } catch (error) {
      console.error('Error deleting task:', error)
      // Could show a toast notification here
    }
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

  if (!boardData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">No board data available</div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between p-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <LayoutGrid className="h-5 w-5 text-gray-500" />
            <h1 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              {project?.name || 'Project Board'}
            </h1>
          </div>
          <Badge variant="secondary" className="text-xs">
            Last synced: {new Date().toLocaleTimeString()}
          </Badge>
        </div>

        <div className="flex items-center gap-2">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search tasks..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 w-64"
            />
          </div>

          {/* Filters */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <SlidersHorizontal className="h-4 w-4 mr-2" />
                Filters
                {(selectedLabels.length > 0 || selectedAssignees.length > 0 || selectedPriority || selectedType) && (
                  <Badge variant="secondary" className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs">
                    {selectedLabels.length + selectedAssignees.length + (selectedPriority ? 1 : 0) + (selectedType ? 1 : 0)}
                  </Badge>
                )}
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-64" align="end">
              <DropdownMenuLabel>Filter by</DropdownMenuLabel>
              <DropdownMenuSeparator />
              
              {/* Labels */}
              <DropdownMenuLabel className="text-xs font-medium text-gray-500">Labels</DropdownMenuLabel>
              {getAllLabels().map((label) => (
                <DropdownMenuCheckboxItem
                  key={label}
                  checked={selectedLabels.includes(label)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedLabels([...selectedLabels, label])
                    } else {
                      setSelectedLabels(selectedLabels.filter(l => l !== label))
                    }
                  }}
                >
                  {label}
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              {/* Assignees */}
              <DropdownMenuLabel className="text-xs font-medium text-gray-500">Assignees</DropdownMenuLabel>
              {getAllAssignees().map((assignee) => (
                <DropdownMenuCheckboxItem
                  key={assignee.name}
                  checked={selectedAssignees.includes(assignee.name)}
                  onCheckedChange={(checked) => {
                    if (checked) {
                      setSelectedAssignees([...selectedAssignees, assignee.name])
                    } else {
                      setSelectedAssignees(selectedAssignees.filter(a => a !== assignee.name))
                    }
                  }}
                >
                  <div className="flex items-center gap-2">
                    <Avatar className="h-4 w-4">
                      <AvatarFallback className="text-xs">{assignee.initials}</AvatarFallback>
                    </Avatar>
                    {assignee.name}
                  </div>
                </DropdownMenuCheckboxItem>
              ))}
              
              <DropdownMenuSeparator />
              
              {/* Priority */}
              <DropdownMenuLabel className="text-xs font-medium text-gray-500">Priority</DropdownMenuLabel>
              <Select value={selectedPriority} onValueChange={setSelectedPriority}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All priorities" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All priorities</SelectItem>
                  {Object.entries(priorityLevels).map(([key, priority]) => (
                    <SelectItem key={key} value={key}>
                      <div className="flex items-center gap-2">
                        <priority.icon className={cn("h-4 w-4", priority.color)} />
                        {priority.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <DropdownMenuSeparator />
              
              {/* Type */}
              <DropdownMenuLabel className="text-xs font-medium text-gray-500">Type</DropdownMenuLabel>
              <Select value={selectedType} onValueChange={setSelectedType}>
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="All types" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All types</SelectItem>
                  {Object.entries(taskTypes).map(([key, type]) => (
                    <SelectItem key={key} value={key}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              
              <DropdownMenuSeparator />
              
              <Button variant="ghost" size="sm" onClick={clearFilters} className="w-full">
                Clear all filters
              </Button>
            </DropdownMenuContent>
          </DropdownMenu>

          {/* View options */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <MoreHorizontal className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuCheckboxItem
                checked={showEmptyColumns}
                onCheckedChange={setShowEmptyColumns}
              >
                Show empty columns
              </DropdownMenuCheckboxItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Board */}
      <div className="flex-1 overflow-x-auto p-4">
        <div className="flex gap-6 h-full min-w-max">
          {boardData.columns.map((column) => {
            const filteredTasks = filterTasks(column.tasks)
            const shouldShowColumn = showEmptyColumns || filteredTasks.length > 0

            if (!shouldShowColumn) return null

            return (
              <div
                key={column.id}
                className={cn(
                  "flex flex-col w-80 bg-gray-100 dark:bg-gray-800 rounded-lg",
                  dragOverColumn === column.id && "ring-2 ring-blue-500"
                )}
                onDragOver={(e) => handleDragOver(e, column.id)}
                onDrop={(e) => handleDrop(e, column.id)}
              >
                {/* Column Header */}
                <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
                  <div className="flex items-center gap-2">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100">
                      {column.title}
                    </h3>
                    <Badge variant="secondary" className="text-xs">
                      {filteredTasks.length}
                    </Badge>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleOpenCreateTask(column.id)}
                    className="h-8 w-8 p-0"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>

                {/* Tasks */}
                <div
                  className="flex-1 p-4 space-y-3 overflow-y-auto"
                  onDragOver={(e) => handleDragOver(e, column.id)}
                  onDrop={(e) => handleDrop(e, column.id)}
                >
                  {filteredTasks.map((task) => (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task, column.id)}
                      onDragEnd={handleDragEnd}
                      onClick={() => handleOpenTaskDetail(task)}
                      className={cn(
                        "bg-white dark:bg-gray-900 rounded-lg p-4 shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:shadow-md transition-shadow",
                        draggedTask?.id === task.id && "opacity-50"
                      )}
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-gray-900 dark:text-gray-100 text-sm leading-tight">
                          {task.title}
                        </h4>
                        {task.priority && (
                          <TooltipProvider>
                            <Tooltip>
                              <TooltipTrigger>
                                {(() => {
                                  const PriorityIcon = (priorityLevels as Record<number, any>)[task.priority]?.icon || MoreHorizontal
                                  return (
                                    <PriorityIcon 
                                      className={cn("h-4 w-4 flex-shrink-0", (priorityLevels as Record<number, any>)[task.priority]?.color || "text-gray-500")} 
                                    />
                                  )
                                })()}
                              </TooltipTrigger>
                              <TooltipContent>
                                {(priorityLevels as Record<number, any>)[task.priority]?.label || 'Unknown'} Priority
                              </TooltipContent>
                            </Tooltip>
                          </TooltipProvider>
                        )}
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Task Type Badge */}
                      {task.type && taskTypes[task.type as keyof typeof taskTypes] && (
                        <div className="mb-3">
                          <Badge 
                            variant="outline" 
                            className={cn("text-xs", taskTypes[task.type as keyof typeof taskTypes].color)}
                          >
                            {taskTypes[task.type as keyof typeof taskTypes].label}
                          </Badge>
                        </div>
                      )}

                      {/* Task Labels */}
                      {task.labels && Array.isArray(task.labels) && task.labels.length > 0 && (
                        <div className="flex flex-wrap gap-1 mb-3">
                          {task.labels.map((label) => (
                            <Badge key={label} variant="outline" className="text-xs">
                              {label}
                            </Badge>
                          ))}
                        </div>
                      )}

                      {/* Task Footer */}
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {task.assigneeName && (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger>
                                  <Avatar className="h-6 w-6">
                                    <AvatarFallback className="text-xs">
                                      {task.assigneeName.charAt(0)}
                                    </AvatarFallback>
                                  </Avatar>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {task.assigneeName}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </div>

                        <div className="flex items-center gap-2 text-gray-500">
                          {(task.comments ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-3 w-3" />
                              <span className="text-xs">{task.comments ?? 0}</span>
                            </div>
                          )}
                          {(task.attachments ?? 0) > 0 && (
                            <div className="flex items-center gap-1">
                              <Paperclip className="h-3 w-3" />
                              <span className="text-xs">{task.attachments ?? 0}</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}

                  {filteredTasks.length === 0 && (
                    <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                      <Clock className="h-8 w-8 mx-auto mb-2 opacity-50" />
                      <p className="text-sm">No tasks</p>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Task Detail Sidebar */}
      {selectedTask && (
        <TaskDetailView
          open={selectedTask !== null}
          onOpenChange={(open) => !open && setSelectedTask(null)}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={(id) => handleTaskDeleted(Number(id))}
          projectPublicId={projectId}
        />
      )}

      {/* Create Task Sidebar */}
      <CreateTaskSidebar
        open={isCreateTaskOpen}
        onOpenChange={(open) => {
          setIsCreateTaskOpen(open)
          if (!open) setCreateTaskColumnId("")
        }}
        initialStage={createTaskColumnId}
        onTaskCreated={handleTaskCreated}
        projectPublicId={projectId}
      />
    </div>
  )
} 