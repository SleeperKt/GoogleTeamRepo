"use client"

import { useState, useEffect } from "react"
import {
  AlertCircle,
  ArrowDown,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Clock,
  Filter,
  GripVertical,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CreateTaskSidebar } from "@/components/create-task-sidebar"
import { PageHeader } from "@/components/page-header"
import { apiRequest } from "@/lib/api"
import { useProject } from "@/contexts/project-context"

// Task types with colors
const taskTypes = {
  feature: { label: "Feature", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  bug: { label: "Bug", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  task: { label: "Task", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  story: { label: "Story", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  epic: { label: "Epic", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
}

// Status types with colors
const statusTypes = {
  Todo: { label: "To Do", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  InProgress: { label: "In Progress", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  InReview: { label: "In Review", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  Done: { label: "Done", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
}

// Priority levels with icons
const priorityLevels = {
  1: { label: "Low", icon: ArrowDown, color: "text-blue-500" },
  2: { label: "Medium", icon: MoreHorizontal, color: "text-yellow-500" },
  3: { label: "High", icon: ArrowUp, color: "text-red-500" },
  4: { label: "Critical", icon: ArrowUp, color: "text-red-600" },
}

// Type definitions
interface Task {
  id: number
  title: string
  description?: string
  assigneeName?: string
  priority: number
  status: string
  stage: string
  estimatedHours?: number
}

interface BacklogData {
  tasks: Task[]
  totalCount: number
}

export default function BacklogPage() {
  const { currentProject } = useProject()
  const [backlogData, setBacklogData] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    assignee: "all",
    priority: "all",
  })
  const [expandedGroups, setExpandedGroups] = useState({
    upcoming: true,
    inProgress: true,
    done: true,
    unassigned: true,
  })
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [draggedTask, setDraggedTask] = useState<Task | null>(null)
  const [dragOverGroup, setDragOverGroup] = useState<string | null>(null)
  const [dragOverTaskId, setDragOverTaskId] = useState<number | null>(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState("upcoming")
  const [participants, setParticipants] = useState<Array<{userName?: string, UserName?: string}>>([])

  // Fetch backlog data
  const fetchBacklogData = async () => {
    if (!currentProject?.publicId) return

    try {
      setLoading(true)
      
      // Build filter parameters
      const queryParams = new URLSearchParams()
      
      if (searchQuery) queryParams.append('SearchTerm', searchQuery)
      if (filters.assignee !== 'all') queryParams.append('AssigneeName', filters.assignee)
      if (filters.priority !== 'all') queryParams.append('Priority', filters.priority)
      if (filters.status !== 'all') queryParams.append('Status', filters.status)
      
      const endpoint = `/api/projects/public/${currentProject.publicId}/tasks${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
      const data = await apiRequest<BacklogData>(endpoint)
      
      setBacklogData(data.tasks || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching backlog data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch backlog data')
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
      fetchBacklogData()
      fetchParticipants()
    }
  }, [currentProject?.publicId])

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (currentProject?.publicId) {
        fetchBacklogData()
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters, currentProject?.publicId])

  // Group tasks by status
  const getGroupedTasks = () => {
    const grouped = {
      upcoming: backlogData.filter(task => task.status === 'Todo'),
      inProgress: backlogData.filter(task => task.status === 'InProgress'),
      done: backlogData.filter(task => task.status === 'Done'),
      unassigned: backlogData.filter(task => !task.assigneeName),
    }
    return grouped
  }

  // Get all assignees
  const getAllAssignees = (): string[] => {
    return participants.map(p => p.userName || p.UserName).filter(Boolean) as string[]
  }

  // Toggle group expansion
  const toggleGroup = (groupId) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  // Filter tasks based on search and filters
  const filterTasks = (tasks) => {
    return tasks.filter((task) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        task.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Type filter
      const matchesType = filters.type === "all" || taskTypes[task.type]?.label === filters.type

      // Status filter
      const matchesStatus = filters.status === "all" || task.status === filters.status

      // Assignee filter
      const matchesAssignee =
        filters.assignee === "all" ||
        (filters.assignee === "unassigned" && !task.assigneeName) ||
        (task.assigneeName && task.assigneeName === filters.assignee)

      // Priority filter
      const matchesPriority = filters.priority === "all" || task.priority === filters.priority

      return matchesSearch && matchesType && matchesStatus && matchesAssignee && matchesPriority
    })
  }

  // Handle drag start
  const handleDragStart = (e, task, groupId) => {
    setDraggedTask({ ...task, groupId })
  }

  // Handle drag over
  const handleDragOver = (e, groupId, taskId = null) => {
    e.preventDefault()
    setDragOverGroup(groupId)
    setDragOverTaskId(taskId)
  }

  // Handle drop
  const handleDrop = (e, targetGroupId, targetTaskId = null) => {
    e.preventDefault()

    if (!draggedTask) return

    const { id, title, description, type, status, priority, assigneeName, groupId: sourceGroupId } = draggedTask

    // Don't do anything if dropping onto the same task
    if (id === targetTaskId) {
      setDraggedTask(null)
      setDragOverGroup(null)
      setDragOverTaskId(null)
      return
    }

    // Create a new state object
    const newBacklogData = {
      id,
      title,
      description,
      type,
      status,
      priority,
      assigneeName,
      groupId: targetGroupId,
    }

    // Remove the task from the source group
    const updatedBacklogData = backlogData.filter((task) => task.id !== id)

    // If dropping onto a task, insert at that position
    if (targetTaskId) {
      const targetIndex = updatedBacklogData.findIndex((task) => task.id === targetTaskId)

      updatedBacklogData.splice(targetIndex, 0, newBacklogData)
    } else {
      // Otherwise, add to the end of the target group
      updatedBacklogData.push(newBacklogData)
    }

    // Update state
    setBacklogData(updatedBacklogData)
    setDraggedTask(null)
    setDragOverGroup(null)
    setDragOverTaskId(null)
  }

  // Handle drag end
  const handleDragEnd = () => {
    setDraggedTask(null)
    setDragOverGroup(null)
    setDragOverTaskId(null)
  }

  // Toggle empty state for demo
  const toggleEmptyState = () => {
    setShowEmptyState(!showEmptyState)
  }

  // Clear all filters
  const clearFilters = () => {
    setSearchQuery("")
    setFilters({
      type: "all",
      status: "all",
      assignee: "all",
      priority: "all",
    })
  }

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <PageHeader title="Backlog" />

      {/* Empty State */}
      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <Sparkles className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No tasks in the backlog yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Start by adding tasks to your backlog to plan your upcoming work.
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setCreateTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Task
          </Button>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
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

                <Select value={filters.status} onValueChange={(value) => setFilters({ ...filters, status: value })}>
                  <SelectTrigger className="w-[130px] h-9">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Statuses</SelectItem>
                    {Object.entries(statusTypes).map(([key, { label }]) => (
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
                    <SelectItem value="unassigned">Unassigned</SelectItem>
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

                <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1" onClick={clearFilters}>
                  <X className="h-3.5 w-3.5" />
                  <span>Clear</span>
                </Button>
              </div>
            </div>
          </div>

          {/* Backlog Groups */}
          <div className="space-y-6">
            {Object.entries(getGroupedTasks()).map(([groupId, group]) => {
              const filteredTasks = filterTasks(group)
              const isEmpty = filteredTasks.length === 0

              return (
                <div
                  key={groupId}
                  className={cn(
                    "bg-white dark:bg-gray-800 rounded-lg border shadow-sm overflow-hidden",
                    dragOverGroup === groupId && !dragOverTaskId && "border-violet-500 ring-1 ring-violet-500",
                  )}
                  onDragOver={(e) => handleDragOver(e, groupId)}
                  onDrop={(e) => handleDrop(e, groupId)}
                >
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-750"
                    onClick={() => toggleGroup(groupId)}
                  >
                    <div className="flex items-center gap-2">
                      {expandedGroups[groupId] ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                      <h2 className="text-lg font-medium">{groupId.charAt(0).toUpperCase() + groupId.slice(1)}</h2>
                      <Badge
                        variant="outline"
                        className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {filteredTasks.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedColumn(groupId)
                          setCreateTaskOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                        <span className="sr-only md:not-sr-only md:ml-2">Add Task</span>
                      </Button>
                    </div>
                  </div>

                  {expandedGroups[groupId] && (
                    <div className="border-t">
                      {isEmpty ? (
                        <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
                          <p className="text-muted-foreground mb-4">No tasks in this section match your filters.</p>
                          <Button variant="outline" size="sm" onClick={clearFilters}>
                            <Filter className="mr-2 h-4 w-4" /> Clear Filters
                          </Button>
                        </div>
                      ) : (
                        <div className="divide-y">
                          {filteredTasks.map((task, index) => {
                            const PriorityIcon = priorityLevels[task.priority]?.icon || Clock
                            const priorityColor = priorityLevels[task.priority]?.color || "text-gray-500"

                            return (
                              <div
                                key={task.id}
                                className={cn(
                                  "p-4 hover:bg-gray-50 dark:hover:bg-gray-750 flex items-center gap-3",
                                  dragOverTaskId === task.id && "border-t-2 border-violet-500",
                                )}
                                draggable
                                onDragStart={(e) => handleDragStart(e, task, groupId)}
                                onDragOver={(e) => handleDragOver(e, groupId, task.id)}
                                onDrop={(e) => handleDrop(e, groupId, task.id)}
                                onDragEnd={handleDragEnd}
                              >
                                <div className="flex-shrink-0 cursor-move text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
                                  <GripVertical className="h-5 w-5" />
                                </div>

                                <div className="flex-grow min-w-0">
                                  <div className="flex items-start justify-between mb-1">
                                    <div className="font-medium truncate mr-2">{task.title}</div>
                                    <div className="flex items-center gap-2 flex-shrink-0">
                                      <Badge className={taskTypes[task.type]?.color || "bg-gray-100"}>
                                        {taskTypes[task.type]?.label || "Task"}
                                      </Badge>
                                      <Badge className={statusTypes[task.status]?.color || "bg-gray-100"}>
                                        {statusTypes[task.status]?.label || "Open"}
                                      </Badge>
                                    </div>
                                  </div>

                                  <div className="flex items-center justify-between text-sm">
                                    <div className="flex items-center gap-2 text-muted-foreground truncate">
                                      <PriorityIcon className={`h-4 w-4 ${priorityColor}`} />
                                      <span className="truncate max-w-[300px]">{task.description}</span>
                                    </div>

                                    <div className="flex items-center gap-3 flex-shrink-0">
                                      {task.estimatedHours && (
                                        <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                                          {task.estimatedHours} hrs
                                        </div>
                                      )}

                                      {task.assigneeName && (
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage
                                              src={`/placeholder.svg?height=32&width=32&name=${task.assigneeName}`}
                                              alt={task.assigneeName}
                                            />
                                            <AvatarFallback>{task.assigneeName.substring(0, 2)}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm text-muted-foreground hidden md:inline">
                                            {task.assigneeName}
                                          </span>
                                        </div>
                                      )}

                                      <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                                            <MoreHorizontal className="h-4 w-4" />
                                          </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end">
                                          <DropdownMenuItem>Edit Task</DropdownMenuItem>
                                          <DropdownMenuItem>Change Status</DropdownMenuItem>
                                          <DropdownMenuItem>Assign User</DropdownMenuItem>
                                          <DropdownMenuItem className="text-red-600">Remove</DropdownMenuItem>
                                        </DropdownMenuContent>
                                      </DropdownMenu>
                                    </div>
                                  </div>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </>
      )}

      {/* Demo Controls - Remove in production */}
      <div className="mt-8 pt-4 border-t">
        <Button variant="outline" onClick={toggleEmptyState} className="text-xs">
          Toggle Empty State (Demo)
        </Button>
      </div>

      {/* Create Task Sidebar */}
      <CreateTaskSidebar
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        initialStage="To Do"
        onTaskCreated={(newTask) => {
          // Add the new task to the selected column
          const newBacklogData = { ...backlogData }
          const columnId = selectedColumn

          newBacklogData.push({
            id: Math.floor(Math.random() * 10000),
            title: newTask.title,
            description: newTask.description || "",
            type: newTask.labels?.find((l) => l?.name === "Feature")
              ? "feature"
              : newTask.labels?.find((l) => l?.name === "Bug")
                ? "bug"
                : "task",
            status: "Todo",
            priority: newTask.priority || 2,
            assigneeName: newTask.assigneeName,
            groupId: columnId,
            estimatedHours: newTask.estimatedHours,
          })

          // Update the board data
          setBacklogData(newBacklogData)
        }}
      />
    </div>
  )
}
