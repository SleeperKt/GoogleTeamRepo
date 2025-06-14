"use client"

import { useState } from "react"
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
  open: { label: "Open", color: "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300" },
  inReview: { label: "In Review", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  blocked: { label: "Blocked", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
  ready: { label: "Ready", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
}

// Priority levels with icons
const priorityLevels = {
  high: { label: "High", icon: ArrowUp, color: "text-red-500" },
  medium: { label: "Medium", icon: MoreHorizontal, color: "text-yellow-500" },
  low: { label: "Low", icon: ArrowDown, color: "text-blue-500" },
}

// Sample backlog data
const initialBacklogData = {
  upcomingSprint: {
    id: "upcoming",
    title: "Upcoming Sprint",
    tasks: [
      {
        id: "task-1",
        title: "Implement user authentication flow",
        description: "Add login, registration, and password reset functionality",
        type: "feature",
        status: "ready",
        assignee: { name: "Sarah Lee", initials: "SL", image: "/placeholder.svg?height=32&width=32" },
        priority: "high",
        estimate: 8,
      },
      {
        id: "task-2",
        title: "Fix navigation menu on mobile devices",
        description: "Menu doesn't close properly after selection on small screens",
        type: "bug",
        status: "open",
        assignee: { name: "Michael Johnson", initials: "MJ", image: "/placeholder.svg?height=32&width=32" },
        priority: "medium",
        estimate: 3,
      },
      {
        id: "task-3",
        title: "Add dark mode toggle",
        description: "Implement system preference detection and manual toggle",
        type: "feature",
        status: "inReview",
        assignee: { name: "Alex Kim", initials: "AK", image: "/placeholder.svg?height=32&width=32" },
        priority: "medium",
        estimate: 5,
      },
    ],
  },
  futureWork: {
    id: "future",
    title: "Future Work",
    tasks: [
      {
        id: "task-4",
        title: "Implement data export functionality",
        description: "Allow users to export their data in CSV and JSON formats",
        type: "feature",
        status: "open",
        assignee: { name: "Jessica Taylor", initials: "JT", image: "/placeholder.svg?height=32&width=32" },
        priority: "low",
        estimate: 5,
      },
      {
        id: "task-5",
        title: "Optimize image loading performance",
        description: "Implement lazy loading and proper caching for images",
        type: "task",
        status: "open",
        assignee: { name: "David Miller", initials: "DM", image: "/placeholder.svg?height=32&width=32" },
        priority: "medium",
        estimate: 3,
      },
      {
        id: "task-6",
        title: "Add multi-language support",
        description: "Implement i18n framework and add translations for key languages",
        type: "epic",
        status: "open",
        assignee: { name: "Emma Wilson", initials: "EW", image: "/placeholder.svg?height=32&width=32" },
        priority: "low",
        estimate: 13,
      },
    ],
  },
  unassigned: {
    id: "unassigned",
    title: "Unassigned Issues",
    tasks: [
      {
        id: "task-7",
        title: "Improve error handling in API requests",
        description: "Add better error messages and retry logic",
        type: "task",
        status: "open",
        assignee: null,
        priority: "medium",
        estimate: 5,
      },
      {
        id: "task-8",
        title: "Update documentation for new features",
        description: "Add user guides and API documentation",
        type: "task",
        status: "open",
        assignee: null,
        priority: "low",
        estimate: 3,
      },
    ],
  },
}

export default function BacklogPage() {
  const [backlogData, setBacklogData] = useState(initialBacklogData)
  const [expandedGroups, setExpandedGroups] = useState({
    upcoming: true,
    future: true,
    unassigned: true,
  })
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    assignee: "all",
    priority: "all",
  })
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [draggedTask, setDraggedTask] = useState(null)
  const [dragOverGroup, setDragOverGroup] = useState(null)
  const [dragOverTaskId, setDragOverTaskId] = useState(null)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState("upcoming")

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
      const matchesType = filters.type === "all" || task.type === filters.type

      // Status filter
      const matchesStatus = filters.status === "all" || task.status === filters.status

      // Assignee filter
      const matchesAssignee =
        filters.assignee === "all" ||
        (filters.assignee === "unassigned" && !task.assignee) ||
        (task.assignee && task.assignee.name === filters.assignee)

      // Priority filter
      const matchesPriority = filters.priority === "all" || task.priority === filters.priority

      return matchesSearch && matchesType && matchesStatus && matchesAssignee && matchesPriority
    })
  }

  // Get all assignees for filter dropdown
  const getAllAssignees = () => {
    const assignees = new Set()
    Object.values(backlogData).forEach((group) => {
      group.tasks.forEach((task) => {
        if (task.assignee) {
          assignees.add(task.assignee.name)
        }
      })
    })
    return Array.from(assignees)
  }

  // Handle drag start
  const handleDragStart = (e, task, groupId) => {
    setDraggedTask({ task, groupId })
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

    const { task: sourceTask, groupId: sourceGroupId } = draggedTask

    // Don't do anything if dropping onto the same task
    if (sourceTask.id === targetTaskId) {
      setDraggedTask(null)
      setDragOverGroup(null)
      setDragOverTaskId(null)
      return
    }

    // Create a new state object
    const newBacklogData = { ...backlogData }

    // Remove the task from the source group
    newBacklogData[sourceGroupId].tasks = newBacklogData[sourceGroupId].tasks.filter(
      (task) => task.id !== sourceTask.id,
    )

    // If dropping onto a task, insert at that position
    if (targetTaskId) {
      const targetIndex = newBacklogData[targetGroupId].tasks.findIndex((task) => task.id === targetTaskId)

      newBacklogData[targetGroupId].tasks.splice(targetIndex, 0, sourceTask)
    } else {
      // Otherwise, add to the end of the target group
      newBacklogData[targetGroupId].tasks.push(sourceTask)
    }

    // Update state
    setBacklogData(newBacklogData)
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
            {Object.entries(backlogData).map(([groupId, group]) => {
              const filteredTasks = filterTasks(group.tasks)
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
                      <h2 className="text-lg font-medium">{group.title}</h2>
                      <Badge
                        variant="outline"
                        className="ml-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                      >
                        {filteredTasks.length}
                      </Badge>
                    </div>
                    <div className="flex items-center gap-2">
                      {groupId === "upcoming" && (
                        <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                          Start Sprint
                        </Button>
                      )}
                      {groupId === "future" && (
                        <Button size="sm" variant="outline">
                          Move to Upcoming
                        </Button>
                      )}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => {
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
                                      {task.estimate && (
                                        <div className="px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs font-medium">
                                          {task.estimate} pts
                                        </div>
                                      )}

                                      {task.assignee ? (
                                        <div className="flex items-center gap-2">
                                          <Avatar className="h-6 w-6">
                                            <AvatarImage
                                              src={task.assignee.image || "/placeholder.svg"}
                                              alt={task.assignee.name}
                                            />
                                            <AvatarFallback>{task.assignee.initials}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm text-muted-foreground hidden md:inline">
                                            {task.assignee.name}
                                          </span>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 text-muted-foreground">
                                          <AlertCircle className="h-4 w-4" />
                                          <span className="text-sm hidden md:inline">Unassigned</span>
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

          newBacklogData[columnId].tasks.push({
            id: `task-${Math.floor(Math.random() * 10000)}`,
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
          })

          // Update the board data
          setBacklogData(newBacklogData)
        }}
      />
    </div>
  )
}
