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

// Sample data
const projectData = {
  name: "TestProject-Dev",
  lastSynced: "3 minutes ago",
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
  high: { label: "High", icon: ArrowUp, color: "text-red-500" },
  medium: { label: "Medium", icon: MoreHorizontal, color: "text-yellow-500" },
  low: { label: "Low", icon: ArrowDown, color: "text-blue-500" },
}

// Column definitions
const columnDefinitions = [
  { id: "todo", title: "To Do", icon: Clock },
  { id: "inProgress", title: "In Progress", icon: ArrowUp },
  { id: "review", title: "Review", icon: CheckCircle },
  { id: "done", title: "Done", icon: CheckCircle },
]

// Sample board data
const initialBoardData = {
  todo: {
    id: "todo",
    title: "To Do",
    tasks: [
      {
        id: "task-1",
        title: "Implement user authentication flow",
        description:
          "Add login, registration, and password reset functionality with OAuth integration for Google and GitHub.",
        type: "feature",
        assignee: { name: "Sarah Lee", initials: "SL", image: "/placeholder.svg?height=32&width=32" },
        priority: "high",
        labels: ["Frontend", "Security"],
        comments: 3,
        attachments: 1,
      },
      {
        id: "task-2",
        title: "Fix navigation menu on mobile devices",
        description: "Menu doesn't close properly after selection on small screens.",
        type: "bug",
        assignee: { name: "Michael Johnson", initials: "MJ", image: "/placeholder.svg?height=32&width=32" },
        priority: "medium",
        labels: ["Frontend", "Mobile"],
        comments: 2,
        attachments: 0,
      },
      {
        id: "task-3",
        title: "Add dark mode toggle",
        description: "Implement system preference detection and manual toggle for dark mode.",
        type: "feature",
        assignee: { name: "Alex Kim", initials: "AK", image: "/placeholder.svg?height=32&width=32" },
        priority: "low",
        labels: ["Frontend", "UI/UX"],
        comments: 5,
        attachments: 2,
      },
    ],
  },
  inProgress: {
    id: "inProgress",
    title: "In Progress",
    tasks: [
      {
        id: "task-4",
        title: "Implement data export functionality",
        description: "Allow users to export their data in CSV and JSON formats.",
        type: "feature",
        assignee: { name: "Jessica Taylor", initials: "JT", image: "/placeholder.svg?height=32&width=32" },
        priority: "medium",
        labels: ["Backend", "Data"],
        comments: 1,
        attachments: 0,
      },
      {
        id: "task-5",
        title: "Optimize image loading performance",
        description: "Implement lazy loading and proper caching for images.",
        type: "task",
        assignee: { name: "David Miller", initials: "DM", image: "/placeholder.svg?height=32&width=32" },
        priority: "high",
        labels: ["Frontend", "Performance"],
        comments: 0,
        attachments: 1,
      },
    ],
  },
  review: {
    id: "review",
    title: "Review",
    tasks: [
      {
        id: "task-6",
        title: "Add multi-language support",
        description: "Implement i18n framework and add translations for key languages.",
        type: "epic",
        assignee: { name: "Emma Wilson", initials: "EW", image: "/placeholder.svg?height=32&width=32" },
        priority: "medium",
        labels: ["Frontend", "Localization"],
        comments: 7,
        attachments: 3,
      },
    ],
  },
  done: {
    id: "done",
    title: "Done",
    tasks: [
      {
        id: "task-7",
        title: "Improve error handling in API requests",
        description: "Add better error messages and retry logic.",
        type: "task",
        assignee: { name: "James Brown", initials: "JB", image: "/placeholder.svg?height=32&width=32" },
        priority: "medium",
        labels: ["Backend", "Error Handling"],
        comments: 2,
        attachments: 0,
      },
      {
        id: "task-8",
        title: "Update documentation for new features",
        description: "Add user guides and API documentation.",
        type: "task",
        assignee: { name: "Olivia Davis", initials: "OD", image: "/placeholder.svg?height=32&width=32" },
        priority: "low",
        labels: ["Documentation"],
        comments: 1,
        attachments: 4,
      },
    ],
  },
}

// Get all unique labels from tasks
const getAllLabels = () => {
  const labels = new Set()
  Object.values(initialBoardData).forEach((column) => {
    column.tasks.forEach((task) => {
      task.labels.forEach((label) => {
        labels.add(label)
      })
    })
  })
  return Array.from(labels)
}

// Get all assignees
const getAllAssignees = () => {
  const assignees = new Set()
  Object.values(initialBoardData).forEach((column) => {
    column.tasks.forEach((task) => {
      if (task.assignee) {
        assignees.add(task.assignee.name)
      }
    })
  })
  return Array.from(assignees)
}

export default function BoardPage() {
  const [boardData, setBoardData] = useState(initialBoardData)
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
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverColumn, setDragOverColumn] = useState(null)
  const [dragOverTaskId, setDragOverTaskId] = useState(null)
  const boardRef = useRef(null)
  const [isScrolling, setIsScrolling] = useState(false)
  const [scrollDirection, setScrollDirection] = useState(null)
  const scrollInterval = useRef(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState("todo")
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [selectedTask, setSelectedTask] = useState(null)

  // Filter tasks based on search and filters
  const filterTasks = (tasks) => {
    if (!tasks) return []

    return tasks.filter((task) => {
      // Search filter
      const matchesSearch = searchQuery === "" || task.title.toLowerCase().includes(searchQuery.toLowerCase())

      // Type filter
      const matchesType = filters.type === "all" || task.type === filters.type

      // Assignee filter
      const matchesAssignee = filters.assignee === "all" || (task.assignee && task.assignee.name === filters.assignee)

      // Priority filter
      const matchesPriority = filters.priority === "all" || task.priority === filters.priority

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
  const handleDragStart = (e, task, columnId) => {
    setDraggedTask({ task, columnId })
    // Create a ghost image for dragging
    const ghostElement = document.createElement("div")
    ghostElement.classList.add("invisible")
    document.body.appendChild(ghostElement)
    e.dataTransfer.setDragImage(ghostElement, 0, 0)
    e.target.style.opacity = 0.6
  }

  // Handle drag over
  const handleDragOver = (e, columnId, taskId = null) => {
    e.preventDefault()
    setDragOverColumn(columnId)
    setDragOverTaskId(taskId)

    // Auto-scrolling logic
    if (boardRef.current) {
      const boardRect = boardRef.current.getBoundingClientRect()
      const scrollThreshold = 100 // pixels from edge to trigger scrolling

      if (e.clientX < boardRect.left + scrollThreshold) {
        // Near left edge, scroll left
        if (scrollDirection !== "left") {
          setScrollDirection("left")
          startScrolling("left")
        }
      } else if (e.clientX > boardRect.right - scrollThreshold) {
        // Near right edge, scroll right
        if (scrollDirection !== "right") {
          setScrollDirection("right")
          startScrolling("right")
        }
      } else {
        // Not near edges, stop scrolling
        if (scrollDirection !== null) {
          setScrollDirection(null)
          stopScrolling()
        }
      }
    }
  }

  // Start auto-scrolling
  const startScrolling = (direction) => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current)
    }

    setIsScrolling(true)
    scrollInterval.current = setInterval(() => {
      if (boardRef.current) {
        const scrollAmount = direction === "left" ? -15 : 15
        boardRef.current.scrollLeft += scrollAmount
      }
    }, 20)
  }

  // Stop auto-scrolling
  const stopScrolling = () => {
    if (scrollInterval.current) {
      clearInterval(scrollInterval.current)
      scrollInterval.current = null
    }
    setIsScrolling(false)
    setScrollDirection(null)
  }

  // Handle drop
  const handleDrop = (e, targetColumnId, targetTaskId = null) => {
    e.preventDefault()
    stopScrolling()

    if (!draggedTask) return

    const { task: sourceTask, columnId: sourceColumnId } = draggedTask

    // Don't do anything if dropping onto the same task
    if (sourceTask.id === targetTaskId && sourceColumnId === targetColumnId) {
      setDraggedTask(null)
      setDragOverColumn(null)
      setDragOverTaskId(null)
      return
    }

    // Create a new state object
    const newBoardData = { ...boardData }

    // Remove the task from the source column
    newBoardData[sourceColumnId].tasks = newBoardData[sourceColumnId].tasks.filter((task) => task.id !== sourceTask.id)

    // If dropping onto a task, insert at that position
    if (targetTaskId) {
      const targetIndex = newBoardData[targetColumnId].tasks.findIndex((task) => task.id === targetTaskId)

      newBoardData[targetColumnId].tasks.splice(targetIndex, 0, sourceTask)
    } else {
      // Otherwise, add to the end of the target column
      newBoardData[targetColumnId].tasks.push(sourceTask)
    }

    // Update state
    setBoardData(newBoardData)
    setDraggedTask(null)
    setDragOverColumn(null)
    setDragOverTaskId(null)
  }

  // Handle drag end
  const handleDragEnd = (e) => {
    e.target.style.opacity = 1
    setDraggedTask(null)
    setDragOverColumn(null)
    setDragOverTaskId(null)
    stopScrolling()
  }

  // Clean up intervals on unmount
  useEffect(() => {
    return () => {
      if (scrollInterval.current) {
        clearInterval(scrollInterval.current)
      }
    }
  }, [])

  // Toggle empty state for demo
  const toggleEmptyState = () => {
    setShowEmptyState(!showEmptyState)
  }

  // Handle opening the create task modal
  const handleOpenCreateTask = (columnId) => {
    setSelectedColumn(columnId)
    setCreateTaskOpen(true)
  }

  // Handle task creation
  const handleTaskCreated = (newTask) => {
    // Add the new task to the selected column
    const newBoardData = { ...boardData }

    // Determine the column to add the task to based on the status
    const columnId =
      Object.keys(newBoardData).find((key) => newBoardData[key].title === newTask.status) || selectedColumn

    // Add the task to the column
    newBoardData[columnId].tasks = [
      ...newBoardData[columnId].tasks,
      {
        id: newTask.id,
        title: newTask.title,
        description: newTask.description || "",
        type: newTask.labels?.find((l) => l?.name === "Feature")
          ? "feature"
          : newTask.labels?.find((l) => l?.name === "Bug")
            ? "bug"
            : "task",
        assignee: newTask.assignee,
        priority: newTask.priority || "medium",
        labels: newTask.labels?.map((l) => l?.name) || [],
        comments: 0,
        attachments: 0,
      },
    ]

    // Update the board data
    setBoardData(newBoardData)
  }

  // Handle opening task detail view
  const handleOpenTaskDetail = (task) => {
    setSelectedTask(task)
    setTaskDetailOpen(true)
  }

  // Handle task update
  const handleTaskUpdated = (updatedTask) => {
    // Create a new board data object
    const newBoardData = { ...boardData }

    // Find the column that contains the task
    let sourceColumnId = null
    for (const columnId in newBoardData) {
      const taskIndex = newBoardData[columnId].tasks.findIndex((task) => task.id === updatedTask.id)
      if (taskIndex !== -1) {
        sourceColumnId = columnId
        break
      }
    }

    if (!sourceColumnId) return

    // Determine the target column based on the updated status
    const targetColumnId =
      Object.keys(newBoardData).find((key) => newBoardData[key].title === updatedTask.status) || sourceColumnId

    // Remove the task from the source column
    newBoardData[sourceColumnId].tasks = newBoardData[sourceColumnId].tasks.filter((task) => task.id !== updatedTask.id)

    // Add the updated task to the target column
    newBoardData[targetColumnId].tasks.push(updatedTask)

    // Update the board data
    setBoardData(newBoardData)

    // Update the selected task
    setSelectedTask(updatedTask)
  }

  // Handle task deletion
  const handleTaskDeleted = (taskId) => {
    // Create a new board data object
    const newBoardData = { ...boardData }

    // Find and remove the task from its column
    for (const columnId in newBoardData) {
      const taskIndex = newBoardData[columnId].tasks.findIndex((task) => task.id === taskId)
      if (taskIndex !== -1) {
        newBoardData[columnId].tasks.splice(taskIndex, 1)
        break
      }
    }

    // Update the board data
    setBoardData(newBoardData)
  }

  return (
    <div className={cn("p-4 md:p-6 w-full transition-all duration-300", taskDetailOpen ? "md:pr-[366px]" : "")}>
      {/* Header Section */}
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Board</h1>
          <div className="flex items-center gap-2">
            <span className="font-medium">{projectData.name}</span>
            <span className="text-sm text-muted-foreground">Synced {projectData.lastSynced}</span>
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
              const columnData = boardData[column.id]
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
                        {filteredTasks.map((task) => {
                          const PriorityIcon = priorityLevels[task.priority]?.icon || Clock
                          const priorityColor = priorityLevels[task.priority]?.color || "text-gray-500"
                          const taskTypeColor = taskTypes[task.type]?.color || ""

                          return (
                            <div
                              key={task.id}
                              className={cn(
                                "p-3 bg-white dark:bg-gray-800 rounded-md border shadow-sm hover:shadow-md transition-shadow cursor-pointer",
                                dragOverTaskId === task.id && "border-violet-500 ring-1 ring-violet-500",
                                viewMode === "compact" ? "p-2" : "p-3",
                                taskTypeColor.includes("border") &&
                                  `border-l-4 ${taskTypeColor.split(" ").find((c) => c.startsWith("border-"))}`,
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
                                  <Badge className={taskTypes[task.type]?.color || "bg-gray-100"}>
                                    {taskTypes[task.type]?.label || "Task"}
                                  </Badge>
                                </div>
                              </div>

                              {viewMode === "detailed" && (
                                <div className="mb-2 flex flex-wrap gap-1">
                                  {task.labels.map((label) => (
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
                                          <AvatarImage src={task.assignee.image} alt={task.assignee.name} />
                                          <AvatarFallback>{task.assignee.initials}</AvatarFallback>
                                        </Avatar>
                                      </TooltipTrigger>
                                      <TooltipContent>
                                        <p>{task.assignee.name}</p>
                                      </TooltipContent>
                                    </Tooltip>
                                  </TooltipProvider>

                                  <PriorityIcon className={`h-4 w-4 ${priorityColor}`} />
                                </div>

                                <div className="flex items-center gap-3 text-muted-foreground">
                                  {task.comments > 0 && (
                                    <div className="flex items-center gap-1 text-xs">
                                      <MessageSquare className="h-3.5 w-3.5" />
                                      <span>{task.comments}</span>
                                    </div>
                                  )}

                                  {task.attachments > 0 && (
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
        initialStage={columnDefinitions.find((col) => col.id === selectedColumn)?.title || "To Do"}
        onTaskCreated={handleTaskCreated}
      />

      {/* Task Detail View */}
      {selectedTask && (
        <TaskDetailView
          open={taskDetailOpen}
          onOpenChange={setTaskDetailOpen}
          task={selectedTask}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
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
