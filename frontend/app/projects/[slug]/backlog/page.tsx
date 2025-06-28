"use client"

import { useState, useEffect, useRef } from "react"
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
  User,
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
import { useProjectParticipants } from "@/hooks/use-project-participants"
import { TeamMember } from "@/lib/types"

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

// Simple in-memory cache to store backlog tasks per project during the session
const backlogCache: Map<string, Task[]> = new Map()

export default function ProjectBacklogPage() {
  const params = useParams()
  const projectId = params.slug as string
  const isInitialMount = useRef(true)
  
  const [project, setProject] = useState<Project | null>(null)
  const [backlogData, setBacklogData] = useState<Task[]>(() => backlogCache.get(projectId) ?? [])
  const [loading, setLoading] = useState(backlogCache.has(projectId) ? false : true)
  const [error, setError] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState("")
  const [filters, setFilters] = useState({
    type: "all",
    status: "all",
    assignee: "all",
    priority: "all",
  })
  const [expandedGroups, setExpandedGroups] = useState<{ [key: string]: boolean }>({})
  const [createTaskOpen, setCreateTaskOpen] = useState(false)
  const [selectedAssignee, setSelectedAssignee] = useState<string | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [taskDetailOpen, setTaskDetailOpen] = useState(false)
  const [pageLoaded, setPageLoaded] = useState(false)

  // Use project participants hook
  const { teamMembers, isLoading: participantsLoading } = useProjectParticipants(projectId, true)

  // Consolidated fetch function to prevent multiple calls
  const fetchAllData = useCallback(async (isInitial = false) => {
    if (!projectId) return

    try {
      if (isInitial) {
        setInitialLoading(true)
      } else {
        setLoading(true)
      }
      
      // Build filter parameters
      const queryParams = new URLSearchParams()
      
      if (searchQuery) queryParams.append('SearchTerm', searchQuery)
      if (filters.assignee !== 'all') queryParams.append('AssigneeName', filters.assignee)
      if (filters.priority !== 'all') queryParams.append('Priority', filters.priority)
      if (filters.status !== 'all') queryParams.append('Status', filters.status)
      
      const endpoint = `/api/projects/public/${projectId}/tasks${queryParams.toString() ? '?' + queryParams.toString() : ''}`
      
      // Fetch tasks and project data
      const [taskData, projectData] = await Promise.all([
        apiRequest<BacklogData>(endpoint),
        isInitial ? apiRequest<Project>(`/api/projects/public/${projectId}`) : Promise.resolve(project)
      ])
      
      setBacklogData(data.tasks || [])
      backlogCache.set(projectId, data.tasks || [])
      setError(null)
    } catch (err) {
      console.error('Error fetching backlog data:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch backlog data')
    } finally {
      if (isInitial) {
        setInitialLoading(false)
      } else {
        setLoading(false)
      }
    }
  }, [projectId, searchQuery, filters, project])

  // Initial data fetch and subsequent project changes
  useEffect(() => {
    if (projectId) {
      fetchProject()
      if (!backlogCache.has(projectId)) {
        fetchBacklogData()
      }
    }
  }, [projectId])

  // Refetch when filters change, but skip the initial mount
  useEffect(() => {
    if (isInitialMount.current) {
      isInitialMount.current = false
      return
    }

    const timeoutId = setTimeout(() => {
      fetchAllData(false)
    }, 300) // Debounce search

    return () => clearTimeout(timeoutId)
  }, [searchQuery, filters])

  // Initialize expanded groups when team members load
  useEffect(() => {
    if (teamMembers.length > 0 && Object.keys(expandedGroups).length === 0) {
      const initialExpanded: { [key: string]: boolean } = {
        unassigned: true, // Always show unassigned expanded
      }
      
      // Add all team members as expanded by default
      teamMembers.forEach(member => {
        initialExpanded[member.id] = true
      })
      
      setExpandedGroups(initialExpanded)
      
      // Trigger page loaded animation after data is ready
      if (!pageLoaded) {
        setTimeout(() => setPageLoaded(true), 100)
      }
    }
  }, [teamMembers, pageLoaded])

  // Group tasks by assignee
  const getGroupedTasksByAssignee = () => {
    const grouped: { [key: string]: Task[] } = {}
    
    // Initialize all team members with empty arrays
    teamMembers.forEach(member => {
      grouped[member.id] = []
    })
    
    // Initialize unassigned group
    grouped['unassigned'] = []
    
    // Group tasks by assignee
    backlogData.forEach(task => {
      if (!task.assigneeId || !task.assigneeName) {
        grouped['unassigned'].push(task)
      } else {
        // Find the team member by ID or create a new group
        const assigneeExists = teamMembers.find(member => member.id === task.assigneeId)
        if (assigneeExists) {
          grouped[task.assigneeId].push(task)
        } else {
          // Handle case where assignee is not in current team members list
          if (!grouped[task.assigneeId]) {
            grouped[task.assigneeId] = []
          }
          grouped[task.assigneeId].push(task)
        }
      }
    })
    
    return grouped
  }

  // Get assignee info (team member or create fallback)
  const getAssigneeInfo = (assigneeId: string): { name: string; initials: string } => {
    if (assigneeId === 'unassigned') {
      return { name: 'Unassigned', initials: 'UN' }
    }
    
    const member = teamMembers.find(m => m.id === assigneeId)
    if (member) {
      return { name: member.name, initials: member.initials }
    }
    
    // Fallback for assignees not in current team members
    const task = backlogData.find(t => t.assigneeId === assigneeId)
    const name = task?.assigneeName || 'Unknown'
    const initials = name.split(' ').map(n => n[0]).join('').toUpperCase()
    
    return { name, initials }
  }

  // Get all assignees including team members
  const getAllAssignees = (): string[] => {
    return teamMembers.map(m => m.name)
  }

  // Toggle group expansion
  const toggleGroup = (groupId: string) => {
    setExpandedGroups(prev => ({
      ...prev,
      [groupId]: !prev[groupId]
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
    await fetchAllData(false) // Refresh the list
  }

  // Handle task deleted
  const handleTaskDeleted = async () => {
    setTaskDetailOpen(false)
    setSelectedTask(null)
    await fetchAllData(false) // Refresh the list
  }

  if ((loading && backlogData.length === 0) || participantsLoading) {
    return (
      <div className="p-4 md:p-6 w-full animate-fade-in">
        {/* Header skeleton */}
        <div className="mb-6">
          <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-32 mb-2 animate-pulse"></div>
          <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-64 animate-pulse"></div>
        </div>
        
        {/* Filters skeleton */}
        <div className="mb-6 flex flex-col sm:flex-row gap-4">
          <div className="h-10 bg-gray-200 dark:bg-gray-700 rounded flex-1 animate-pulse"></div>
          <div className="flex gap-2">
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
            <div className="h-10 w-32 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          </div>
        </div>
        
        {/* Task groups skeleton */}
        <div className="space-y-6">
          {[1, 2, 3].map((index) => (
            <div key={index} className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
              <div className="p-4 border-b">
                <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-40 animate-pulse"></div>
              </div>
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((taskIndex) => (
                  <div key={taskIndex} className="h-16 bg-gray-100 dark:bg-gray-700 rounded animate-pulse"></div>
                ))}
              </div>
            </div>
          ))}
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
            <Button onClick={() => fetchAllData(true)}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const groupedTasks = getGroupedTasksByAssignee()

  return (
    <div className="p-4 md:p-6 w-full animate-fade-in anti-flicker">
      {/* Header Section */}
      <div className={`mb-6 transition-all duration-500 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
        <div className={`flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all duration-500 delay-100 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <Sparkles className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No tasks in the backlog yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Start by adding tasks to your backlog to plan your upcoming work.
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white transition-all duration-200 hover:scale-105 active:scale-95" onClick={() => setCreateTaskOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> Create Task
          </Button>
        </div>
      ) : (
        <>
          {/* Search and Filters */}
          <div className={`mb-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4 transition-all duration-500 delay-100 hover:shadow-md ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
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
                {loading && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <div className="animate-spin h-4 w-4 border-2 border-violet-600 border-t-transparent rounded-full"></div>
                    <span>Loading...</span>
                  </div>
                )}
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

          {/* Task Groups by Assignee */}
          <div className={`space-y-6 transition-all duration-500 delay-200 ${pageLoaded ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}`}>
            {/* Unassigned group first */}
            {(() => {
              const unassignedTasks = groupedTasks['unassigned'] || []
              const filteredUnassignedTasks = filterTasks(unassignedTasks)
              const isExpanded = expandedGroups['unassigned']
              
              return (
                <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md">
                  <div
                    className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                    onClick={() => toggleGroup('unassigned')}
                  >
                    <div className="flex items-center gap-3">
                      {isExpanded ? (
                        <ChevronDown className="h-4 w-4" />
                      ) : (
                        <ChevronRight className="h-4 w-4" />
                      )}
                      <div className="flex items-center gap-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="bg-gray-200 text-gray-600">
                            <User className="h-4 w-4" />
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <h3 className="font-medium">Unassigned</h3>
                          <p className="text-sm text-gray-500">
                            {filteredUnassignedTasks.length === 0 
                              ? "No tasks assigned yet"
                              : `${filteredUnassignedTasks.length} task${filteredUnassignedTasks.length !== 1 ? 's' : ''}`
                            }
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="ml-2">
                        {filteredUnassignedTasks.length}
                      </Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation()
                        setSelectedAssignee('unassigned')
                        setCreateTaskOpen(true)
                      }}
                    >
                      <Plus className="h-4 w-4" />
                    </Button>
                  </div>

                  {isExpanded && (
                    <div className="border-t">
                      {filteredUnassignedTasks.length === 0 ? (
                        <div className="p-8 text-center text-gray-500">
                          <User className="h-12 w-12 mx-auto mb-3 opacity-20" />
                          <p className="text-sm">No tasks assigned yet</p>
                          <Button
                            variant="outline"
                            size="sm"
                            className="mt-2 transition-all duration-200 hover:scale-105 active:scale-95"
                            onClick={() => {
                              setSelectedAssignee('unassigned')
                              setCreateTaskOpen(true)
                            }}
                          >
                            <Plus className="h-4 w-4 mr-2" />
                            Add Task
                          </Button>
                        </div>
                      ) : (
                        filteredUnassignedTasks.map((task) => {
                          const PriorityIcon = priorityLevels[task.priority as keyof typeof priorityLevels]?.icon || MoreHorizontal

                          return (
                            <div
                              key={task.id}
                              className="p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] hover:shadow-sm"
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
                                    <Badge variant="outline" className={statusTypes[task.status as keyof typeof statusTypes]?.color}>
                                      {statusTypes[task.status as keyof typeof statusTypes]?.label}
                                    </Badge>
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
                        })
                      )}
                    </div>
                  )}
                </div>
              )
            })()}

            {/* Team members in alphabetical order */}
            {teamMembers
              .sort((a, b) => a.name.localeCompare(b.name))
              .map(member => {
                const memberTasks = groupedTasks[member.id] || []
                const filteredMemberTasks = filterTasks(memberTasks)
                const isExpanded = expandedGroups[member.id]
                
                return (
                  <div key={member.id} className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm transition-all duration-200 hover:shadow-md">
                    <div
                      className="flex items-center justify-between p-4 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors duration-200"
                      onClick={() => toggleGroup(member.id)}
                    >
                      <div className="flex items-center gap-3">
                        {isExpanded ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <div className="flex items-center gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                            <AvatarFallback>{member.initials}</AvatarFallback>
                          </Avatar>
                          <div>
                            <h3 className="font-medium">{member.name}</h3>
                            <p className="text-sm text-gray-500">
                              {filteredMemberTasks.length === 0 
                                ? "No tasks assigned yet"
                                : `${filteredMemberTasks.length} task${filteredMemberTasks.length !== 1 ? 's' : ''}`
                              }
                            </p>
                          </div>
                        </div>
                        <Badge variant="outline" className="ml-2">
                          {filteredMemberTasks.length}
                        </Badge>
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation()
                          setSelectedAssignee(member.id)
                          setCreateTaskOpen(true)
                        }}
                      >
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    {isExpanded && (
                      <div className="border-t">
                        {filteredMemberTasks.length === 0 ? (
                          <div className="p-8 text-center text-gray-500">
                            <Avatar className="h-12 w-12 mx-auto mb-3 opacity-20">
                              <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${member.name}`} />
                              <AvatarFallback>{member.initials}</AvatarFallback>
                            </Avatar>
                            <p className="text-sm">No tasks assigned yet</p>
                            <Button
                              variant="outline"
                              size="sm"
                              className="mt-2 transition-all duration-200 hover:scale-105 active:scale-95"
                              onClick={() => {
                                setSelectedAssignee(member.id)
                                setCreateTaskOpen(true)
                              }}
                            >
                              <Plus className="h-4 w-4 mr-2" />
                              Assign Task
                            </Button>
                          </div>
                        ) : (
                          filteredMemberTasks.map((task) => {
                            const PriorityIcon = priorityLevels[task.priority as keyof typeof priorityLevels]?.icon || MoreHorizontal

                            return (
                              <div
                                key={task.id}
                                className="p-4 border-b last:border-b-0 hover:bg-gray-50 dark:hover:bg-gray-700 cursor-pointer transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] hover:shadow-sm"
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
                                      <Badge variant="outline" className={statusTypes[task.status as keyof typeof statusTypes]?.color}>
                                        {statusTypes[task.status as keyof typeof statusTypes]?.label}
                                      </Badge>
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
                          })
                        )}
                      </div>
                    )}
                  </div>
                )
              })
            }
          </div>
        </>
      )}

      {/* Create Task Sidebar */}
      {createTaskOpen && (
        <CreateTaskSidebar
          open={createTaskOpen}
          onOpenChange={setCreateTaskOpen}
          onTaskCreated={handleTaskUpdated}
          projectPublicId={projectId}
          selectedColumnId={selectedAssignee || undefined}
        />
      )}

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