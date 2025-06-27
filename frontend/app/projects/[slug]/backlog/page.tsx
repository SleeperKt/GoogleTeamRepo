"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import {
  AlertCircle,
  ArrowDown,
  ArrowLeft,
  ArrowUp,
  ChevronDown,
  ChevronRight,
  Clock,
  GripVertical,
  MoreHorizontal,
  Plus,
  Search,
  Sparkles,
  X,
} from "lucide-react"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { CreateTaskSidebar } from "@/components/create-task-sidebar"
import { TaskDetailView } from "@/components/task-detail-view"
import { apiRequest } from "@/lib/api"

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
  assigneeId?: string
  priority: number
  status: string
  stage: string
  estimatedHours?: number
  type?: string
  labels?: string[]
  comments?: number
  attachments?: number
  dueDate?: string | Date
  position: number
}

interface BacklogData {
  tasks: Task[]
  totalCount: number
}

interface Project {
  id: number
  name: string
  description: string
  publicId: string
}

export default function ProjectBacklogPage() {
  const params = useParams()
  const projectId = params.slug as string
  
  const [project, setProject] = useState<Project | null>(null)
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
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [selectedColumn, setSelectedColumn] = useState("upcoming")
  const [participants, setParticipants] = useState<Array<{userName?: string, UserName?: string}>>([])
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)

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

  // Fetch backlog data
  const fetchBacklogData = async () => {
    if (!projectId) return

    try {
      setLoading(true)
      
      // Build filter parameters
      const queryParams = new URLSearchParams()
      
      if (searchQuery) queryParams.append('SearchTerm', searchQuery)
      if (filters.assignee !== 'all') queryParams.append('AssigneeName', filters.assignee)
      if (filters.priority !== 'all') queryParams.append('Priority', filters.priority)
      if (filters.status !== 'all') queryParams.append('Status', filters.status)
      
      const endpoint = `/api/projects/public/${projectId}/tasks${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
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
    if (!projectId) return

    try {
      const data = await apiRequest<Array<{userName?: string, UserName?: string}>>(`/api/projects/public/${projectId}/participants`)
      setParticipants(data || [])
    } catch (err) {
      console.error('Error fetching participants:', err)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (projectId) {
      fetchProject()
      fetchBacklogData()
      fetchParticipants()
    }
  }, [projectId])

  // Refetch when filters change
  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (projectId) {
        fetchBacklogData()
      }
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters, projectId])

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
  const toggleGroup = (groupId: string) => {
    setExpandedGroups((prev) => ({
      ...prev,
      [groupId]: !prev[groupId],
    }))
  }

  // Filter tasks based on search and filters
  const filterTasks = (tasks: Task[]) => {
    return tasks.filter((task) => {
      // Search filter
      const matchesSearch =
        searchQuery === "" ||
        task.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()))

      // Type filter
      const matchesType = filters.type === "all" || taskTypes[task.type as keyof typeof taskTypes]?.label === filters.type

      // Status filter
      const matchesStatus = filters.status === "all" || task.status === filters.status

      // Assignee filter
      const matchesAssignee =
        filters.assignee === "all" ||
        (filters.assignee === "unassigned" && !task.assigneeName) ||
        (task.assigneeName && task.assigneeName === filters.assignee)

      // Priority filter
      const matchesPriority = filters.priority === "all" || task.priority.toString() === filters.priority

      return matchesSearch && matchesType && matchesStatus && matchesAssignee && matchesPriority
    })
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

  // Handle task click
  const handleTaskClick = (task: Task) => {
    setSelectedTask(task)
    setTaskDetailOpen(true)
  }

  // Handle task updated
  const handleTaskUpdated = async (updatedTask: Task) => {
    setSelectedTask(updatedTask)
    await fetchBacklogData() // Refresh the list
  }

  // Handle task deleted
  const handleTaskDeleted = async () => {
    setTaskDetailOpen(false)
    setSelectedTask(null)
    await fetchBacklogData() // Refresh the list
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error loading backlog</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => fetchBacklogData()}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const groupedTasks = getGroupedTasks()

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Back Button */}
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href={`/projects/${projectId}`}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to project
        </Link>
      </Button>

      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Backlog</h1>
        {project && (
          <div className="flex items-center gap-2">
            <span className="font-medium">{project.name}</span>
            <span className="text-sm text-muted-foreground">
              {backlogData.length} {backlogData.length === 1 ? 'task' : 'tasks'} total
            </span>
          </div>
        )}
      </div>

      {/* Empty State */}
      {backlogData.length === 0 ? (
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
            {Object.entries(groupedTasks).map(([groupId, tasks]) => {
              const filteredTasks = filterTasks(tasks)
              const isExpanded = expandedGroups[groupId as keyof typeof expandedGroups]
              const groupLabels = {
                upcoming: "To Do",
                inProgress: "In Progress", 
                done: "Done",
                unassigned: "Unassigned"
              }

              if (filteredTasks.length === 0) return null

              return (
                <div key={groupId} className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700"
                    onClick={() => toggleGroup(groupId)}
                  >
                    <div className="flex items-center gap-2">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <h3 className="font-medium">{groupLabels[groupId as keyof typeof groupLabels]}</h3>
                      <Badge variant="outline" className="ml-2">
                        {filteredTasks.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedColumn(groupId)
                        setCreateTaskOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="border-t">
                      {filteredTasks.map((task) => {
                        const PriorityIcon = priorityLevels[task.priority as keyof typeof priorityLevels]?.icon || MoreHorizontal

                        return (
                          <div
                            key={task.id}
                            className="p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer"
                            onClick={() => handleTaskClick(task)}
                          >
                            <div className="flex items-start gap-3">
                              <GripVertical className="h-4 w-4 text-gray-400 mt-1 cursor-grab" />
                              
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  <h4 className="font-medium truncate">{task.title}</h4>
                                  {task.type && (
                                    <Badge variant="outline" className={taskTypes[task.type as keyof typeof taskTypes]?.color}>
                                      {taskTypes[task.type as keyof typeof taskTypes]?.label}
                                    </Badge>
                                  )}
                                </div>
                                
                                {task.description && (
                                  <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2 mb-2">
                                    {task.description}
                                  </p>
                                )}
                                
                                <div className="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                                  <div className="flex items-center gap-1">
                                    <PriorityIcon className={cn("h-3 w-3", priorityLevels[task.priority as keyof typeof priorityLevels]?.color)} />
                                    <span>{priorityLevels[task.priority as keyof typeof priorityLevels]?.label}</span>
                                  </div>
                                  
                                  {task.assigneeName && (
                                    <div className="flex items-center gap-1">
                                      <Avatar className="h-4 w-4">
                                        <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${task.assigneeName}`} />
                                        <AvatarFallback className="text-xs">
                                          {task.assigneeName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                                        </AvatarFallback>
                                      </Avatar>
                                      <span>{task.assigneeName}</span>
                                    </div>
                                  )}
                                  
                                  {task.estimatedHours && (
                                    <div className="flex items-center gap-1">
                                      <Clock className="h-3 w-3" />
                                      <span>{task.estimatedHours}h</span>
                                    </div>
                                  )}
                                  
                                  {task.dueDate && (
                                    <div className="flex items-center gap-1">
                                      <span>Due {new Date(task.dueDate).toLocaleDateString()}</span>
                                    </div>
                                  )}
                                </div>
                              </div>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
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
        initialStage="To Do"
        projectPublicId={projectId}
        onTaskCreated={(newTask) => {
          fetchBacklogData()
          setCreateTaskOpen(false)
        }}
      />

      {/* Task Detail View */}
      {selectedTask && (
        <TaskDetailView
          open={taskDetailOpen}
          onOpenChange={setTaskDetailOpen}
          task={selectedTask}
          projectPublicId={projectId}
          onTaskUpdated={handleTaskUpdated}
          onTaskDeleted={handleTaskDeleted}
        />
      )}
    </div>
  )
} 