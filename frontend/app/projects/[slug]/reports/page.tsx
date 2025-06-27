"use client"

import { useState, useEffect, useMemo } from "react"
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  ChevronDown,
  Clock,
  Download,
  Filter,
  LineChart,
  PieChart,
  PlayCircle,
  Plus,
  RefreshCw,
  Users,
  X,
  ArrowLeft,
  User,
  Tag,
  TrendingUp,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuCheckboxItem, DropdownMenuSeparator } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { API_BASE_URL } from "@/lib/api"
import { useProjectWorkflowStages, ProjectWorkflowStage } from "@/hooks/use-project-workflow-stages"
import { useProjectLabels, ProjectLabel } from "@/hooks/use-project-labels"
import { useProjectParticipants } from "@/hooks/use-project-participants"
import Link from "next/link"

interface ProjectData {
  id: number
  name: string
  description: string
  createdAt: string
  publicId: string
}

interface Task {
  id: number
  title: string
  description: string
  status: number
  priority: number
  assigneeId?: string
  assigneeName?: string
  createdAt: string
  updatedAt: string
  dueDate?: string
  type?: string
  labels?: string[]
  estimatedHours?: number
  position: number
}

interface ReportsTeamMember {
  id: string
  name: string
  role?: string
  joinedAt?: string
  avatar?: string
  initials: string
}

// Filter state interface
interface FilterState {
  assigneeId: string | null
  dateRange: string
  labelIds: number[]
  stageIds: number[]
  taskTypes: string[]
  priorities: number[]
}

const TASK_TYPES = [
  { value: "task", label: "Task" },
  { value: "bug", label: "Bug" },
  { value: "feature", label: "Feature" },
  { value: "story", label: "Story" },
  { value: "epic", label: "Epic" }
]

const PRIORITY_LEVELS = [
  { value: 1, label: "Low", color: "text-blue-500" },
  { value: 2, label: "Medium", color: "text-yellow-500" },
  { value: 3, label: "High", color: "text-red-500" },
  { value: 4, label: "Critical", color: "text-red-600" }
]

export default function ProjectReportsPage() {
  const params = useParams()
  const { token } = useAuth()
  const publicId = params.slug as string
  
  // Debug authentication
  useEffect(() => {
    console.log('Auth token available:', !!token)
    console.log('Token from localStorage:', !!localStorage.getItem('token'))
    console.log('PublicId:', publicId)
  }, [token, publicId])

  const [project, setProject] = useState<ProjectData | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  
  // Use hooks for dynamic data
  const { stages: workflowStages, loading: stagesLoading } = useProjectWorkflowStages(publicId)
  const { labels, loading: labelsLoading } = useProjectLabels(publicId)
  const { teamMembers: participants, isLoading: participantsLoading } = useProjectParticipants(publicId, true)

  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    assigneeId: null,
    dateRange: "last30days",
    labelIds: [],
    stageIds: [],
    taskTypes: [],
    priorities: []
  })

  const fetchData = async () => {
    if (!token) {
      console.log('No token available for API calls')
      setLoading(false)
      return
    }

    try {
      console.log('Fetching project data for:', publicId)
      const projectRes = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      
      if (!projectRes.ok) {
        console.error('Project API error:', projectRes.status, projectRes.statusText)
        const errorText = await projectRes.text()
        console.error('Project API error details:', errorText)
        setLoading(false)
        return
      }

      const projectData = await projectRes.json()
      console.log('Project data loaded:', projectData)
      setProject(projectData)

      console.log('Fetching tasks data...')
      const tasksRes = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}/tasks`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })

      if (tasksRes.ok) {
        const tasksData = await tasksRes.json()
        console.log('Tasks API response:', tasksData)
        
        // Handle different response structures for tasks
        let tasksArray: Task[] = []
        if (Array.isArray(tasksData)) {
          tasksArray = tasksData
        } else if (tasksData && Array.isArray(tasksData.tasks)) {
          tasksArray = tasksData.tasks
        } else if (tasksData && Array.isArray(tasksData.data)) {
          tasksArray = tasksData.data
        } else {
          console.warn('Unexpected tasks data structure:', tasksData)
          tasksArray = []
        }
        
        console.log('Tasks loaded:', tasksArray.length)
        setTasks(tasksArray)
      } else {
        console.error('Tasks API error:', tasksRes.status, tasksRes.statusText)
        const errorText = await tasksRes.text()
        console.error('Tasks API error details:', errorText)
      }

    } catch (error) {
      console.error('Error fetching project data:', error)
      setTasks([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token, publicId])

  // Helper function to get date range filter
  const getDateRangeFilter = (range: string): { from?: Date; to?: Date } => {
    const now = new Date()
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    switch (range) {
      case "last7days":
        return { from: new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000) }
      case "last30days":
        return { from: new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000) }
      case "last90days":
        return { from: new Date(today.getTime() - 90 * 24 * 60 * 60 * 1000) }
      case "thisMonth":
        return { from: new Date(now.getFullYear(), now.getMonth(), 1) }
      case "lastMonth":
        const lastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1)
        const endLastMonth = new Date(now.getFullYear(), now.getMonth(), 0)
        return { from: lastMonth, to: endLastMonth }
      default:
        return {}
    }
  }

  // Filter tasks based on current filter state
  const filteredTasks = useMemo(() => {
    let filtered = [...tasks]

    // Date range filter
    const dateFilter = getDateRangeFilter(filters.dateRange)
    if (dateFilter.from || dateFilter.to) {
      filtered = filtered.filter(task => {
        const taskDate = new Date(task.createdAt)
        if (dateFilter.from && taskDate < dateFilter.from) return false
        if (dateFilter.to && taskDate > dateFilter.to) return false
        return true
      })
    }

    // Assignee filter
    if (filters.assigneeId) {
      if (filters.assigneeId === "unassigned") {
        filtered = filtered.filter(task => !task.assigneeId)
      } else {
        filtered = filtered.filter(task => task.assigneeId === filters.assigneeId)
      }
    }

    // Label filter
    if (filters.labelIds.length > 0) {
      filtered = filtered.filter(task => {
        if (!task.labels || task.labels.length === 0) return false
        return filters.labelIds.some(labelId => {
          const label = labels.find(l => l.id === labelId)
          return label && task.labels?.includes(label.name)
        })
      })
    }

    // Stage filter (based on workflow stages)
    if (filters.stageIds.length > 0) {
      const sortedStages = [...workflowStages].sort((a, b) => a.order - b.order)
      
      filtered = filtered.filter(task => {
        return filters.stageIds.some(stageId => {
          // Find the stage index by ID
          const stageIndex = sortedStages.findIndex(stage => stage.id === stageId)
          if (stageIndex !== -1) {
            // Convert stage index to TaskStatus (1-based)
            const expectedTaskStatus = stageIndex + 1
            return task.status === expectedTaskStatus
          }
          return false
        })
      })
    }

    // Task type filter
    if (filters.taskTypes.length > 0) {
      filtered = filtered.filter(task => 
        task.type && filters.taskTypes.includes(task.type)
      )
    }

    // Priority filter
    if (filters.priorities.length > 0) {
      filtered = filtered.filter(task => 
        filters.priorities.includes(task.priority)
      )
    }

    return filtered
  }, [tasks, filters, workflowStages, labels])

  // Calculate dynamic statistics based on filtered tasks and workflow stages
  const dynamicStatistics = useMemo(() => {
    const stageCounts = new Map<number, number>()
    const sortedStages = [...workflowStages].sort((a, b) => a.order - b.order)
    
    // Initialize counts for each stage
    sortedStages.forEach((stage, index) => {
      stageCounts.set(index, 0)
    })

        // Count tasks by stage
    filteredTasks.forEach(task => {
      // TaskStatus enum is 1-based (1=Todo, 2=InProgress, etc.)
      // Workflow stages are sorted by order, so we need to map TaskStatus to stage index
      if (typeof task.status === 'number') {
        // Convert 1-based TaskStatus to 0-based stage index
        const stageIndex = task.status - 1
        
        // Only count if we have a valid stage at this index
        if (stageIndex >= 0 && stageIndex < sortedStages.length) {
          const currentCount = stageCounts.get(stageIndex) || 0
          stageCounts.set(stageIndex, currentCount + 1)
        }
      }
    })

    return {
      total: filteredTasks.length,
      completedCount: sortedStages.reduce((count, stage, index) => {
        return stage.isCompleted ? count + (stageCounts.get(index) || 0) : count
      }, 0),
      inProgressCount: stageCounts.get(1) || 0, // Assuming second stage is "In Progress"
      stageCounts,
      sortedStages
    }
  }, [filteredTasks, workflowStages])

  const getSummaryCards = () => {
    const completionRate = dynamicStatistics.total > 0 
      ? Math.round((dynamicStatistics.completedCount / dynamicStatistics.total) * 100) 
      : 0

    return [
      {
        label: "Total Tasks",
        value: dynamicStatistics.total,
        icon: BarChart3,
        color: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
      },
      {
        label: "Completed",
        value: dynamicStatistics.completedCount,
        icon: CheckCircle2,
        color: "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300",
      },
      {
        label: "In Progress",
        value: dynamicStatistics.inProgressCount,
        icon: PlayCircle,
        color: "bg-violet-50 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
      },
      {
        label: "Completion Rate",
        value: `${completionRate}%`,
        icon: TrendingUp,
        color: "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
      },
      {
        label: "Team Members",
        value: participants.length,
        icon: Users,
        color: "bg-indigo-50 text-indigo-600 dark:bg-indigo-900 dark:text-indigo-300",
      },
    ]
  }

  const getTaskStatusDistribution = () => {
    return dynamicStatistics.sortedStages.map((stage, index) => ({
      status: stage.name,
      count: dynamicStatistics.stageCounts.get(index) || 0,
      color: stage.color || "#6b7280"
    }))
  }

  // Update filter functions
  const updateFilter = (key: keyof FilterState, value: any) => {
    setFilters(prev => ({
      ...prev,
      [key]: value
    }))
  }

  const toggleFilterArray = (key: keyof FilterState, value: any) => {
    setFilters(prev => {
      const currentArray = prev[key] as any[]
      const newArray = currentArray.includes(value)
        ? currentArray.filter(item => item !== value)
        : [...currentArray, value]
      
      return {
        ...prev,
        [key]: newArray
      }
    })
  }

  const clearAllFilters = () => {
    setFilters({
      assigneeId: null,
      dateRange: "last30days",
      labelIds: [],
      stageIds: [],
      taskTypes: [],
      priorities: []
    })
  }

  const hasActiveFilters = () => {
    return (
      filters.assigneeId !== null ||
      filters.dateRange !== "last30days" ||
      filters.labelIds.length > 0 ||
      filters.stageIds.length > 0 ||
      filters.taskTypes.length > 0 ||
      filters.priorities.length > 0
    )
  }

  const exportReportAsCSV = () => {
    if (!project) return

    // Prepare CSV content
    const csvContent = []
    
    // Header with project info
    csvContent.push(`Project Report: ${project.name}`)
    csvContent.push(`Generated: ${new Date().toLocaleDateString()}`)
    csvContent.push(`Date Range: ${filters.dateRange}`)
    csvContent.push('') // Empty line
    
    // Summary statistics
    csvContent.push('Summary Statistics')
    csvContent.push('Metric,Value')
    csvContent.push(`Total Tasks,${dynamicStatistics.total}`)
    csvContent.push(`Completed Tasks,${dynamicStatistics.completedCount}`)
    csvContent.push(`In Progress Tasks,${dynamicStatistics.inProgressCount}`)
    const completionRate = dynamicStatistics.total > 0 
      ? Math.round((dynamicStatistics.completedCount / dynamicStatistics.total) * 100) 
      : 0
    csvContent.push(`Completion Rate,${completionRate}%`)
    csvContent.push(`Team Members,${participants.length}`)
    csvContent.push('') // Empty line
    
    // Task Status Distribution
    csvContent.push('Task Status Distribution')
    csvContent.push('Stage,Task Count,Percentage')
    
    const taskStatusDistribution = getTaskStatusDistribution()
    const totalTasks = taskStatusDistribution.reduce((sum, item) => sum + item.count, 0)
    
    taskStatusDistribution.forEach(stage => {
      const percentage = totalTasks > 0 ? Math.round((stage.count / totalTasks) * 100) : 0
      csvContent.push(`${stage.status},${stage.count},${percentage}%`)
    })
    
    // Add active filters info if any
    if (hasActiveFilters()) {
      csvContent.push('') // Empty line
      csvContent.push('Active Filters')
      if (filters.assigneeId) {
        const assigneeName = filters.assigneeId === "unassigned" 
          ? "Unassigned" 
          : participants.find((p: any) => p.id === filters.assigneeId)?.name || "Unknown"
        csvContent.push(`Assignee: ${assigneeName}`)
      }
      if (filters.labelIds.length > 0) {
        const labelNames = filters.labelIds.map(id => labels.find(l => l.id === id)?.name || "Unknown").join(", ")
        csvContent.push(`Labels: ${labelNames}`)
      }
      if (filters.stageIds.length > 0) {
        const stageNames = filters.stageIds.map(id => workflowStages.find(s => s.id === id)?.name || "Unknown").join(", ")
        csvContent.push(`Stages: ${stageNames}`)
      }
      if (filters.taskTypes.length > 0) {
        csvContent.push(`Task Types: ${filters.taskTypes.join(", ")}`)
      }
      if (filters.priorities.length > 0) {
        const priorityNames = filters.priorities.map(p => PRIORITY_LEVELS.find(pl => pl.value === p)?.label || "Unknown").join(", ")
        csvContent.push(`Priorities: ${priorityNames}`)
      }
    }
    
    // Convert to CSV string
    const csvString = csvContent.join('\n')
    
    // Create and download file
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${project.name.replace(/[^a-z0-9]/gi, '_').toLowerCase()}-report.csv`)
    link.style.visibility = 'hidden'
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  if (loading || stagesLoading || labelsLoading || participantsLoading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center mt-10">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/projects">View All Projects</Link>
          </Button>
        </div>
      </div>
    )
  }

  const summaryCards = getSummaryCards()
  const taskStatusDistribution = getTaskStatusDistribution()
  const totalTasks = taskStatusDistribution.reduce((sum, item) => sum + item.count, 0)

  const showEmptyState = dynamicStatistics.total === 0

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Reports</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="font-medium">{project.name}</span>
            <span className="text-sm text-muted-foreground">
              Created {new Date(project.createdAt).toLocaleDateString()}
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9" onClick={() => { setLoading(true); fetchData(); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9" onClick={exportReportAsCSV}>
              <Download className="mr-2 h-4 w-4" />
              Export CSV
            </Button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <BarChart3 className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No report data found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            {hasActiveFilters() 
              ? "No tasks match your current filters. Try adjusting your filter criteria."
              : "Start by creating tasks or assigning team members to generate reports and analytics."
            }
          </p>
          <div className="flex gap-2">
            {hasActiveFilters() && (
              <Button variant="outline" onClick={clearAllFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear Filters
              </Button>
            )}
            <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white">
              <Link href={`/projects/${publicId}/board`}>
                <Plus className="mr-2 h-4 w-4" /> Create Task
              </Link>
            </Button>
          </div>
        </div>
      ) : (
        <>
          {/* Filters and Controls */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              {/* Date Range Filter */}
              <Select value={filters.dateRange} onValueChange={(value) => updateFilter('dateRange', value)}>
                <SelectTrigger className="w-[180px] h-9">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
              </Select>

              {/* Assignee Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <User className="mr-2 h-4 w-4" />
                    Assignee
                    {filters.assigneeId && (
                      <Badge variant="secondary" className="ml-2">1</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuCheckboxItem
                    checked={filters.assigneeId === null}
                    onCheckedChange={() => updateFilter('assigneeId', null)}
                  >
                    All Assignees
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuCheckboxItem
                    checked={filters.assigneeId === "unassigned"}
                    onCheckedChange={() => updateFilter('assigneeId', filters.assigneeId === "unassigned" ? null : "unassigned")}
                  >
                    Unassigned
                  </DropdownMenuCheckboxItem>
                  <DropdownMenuSeparator />
                                     {participants.map((member: any) => (
                     <DropdownMenuCheckboxItem
                       key={member.id}
                       checked={filters.assigneeId === member.id}
                       onCheckedChange={() => updateFilter('assigneeId', filters.assigneeId === member.id ? null : member.id)}
                     >
                       <Avatar className="h-5 w-5 mr-2">
                         <AvatarFallback className="text-xs">
                           {member.initials}
                         </AvatarFallback>
                       </Avatar>
                       {member.name}
                     </DropdownMenuCheckboxItem>
                   ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Labels Filter */}
              {labels.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <Tag className="mr-2 h-4 w-4" />
                      Labels
                      {filters.labelIds.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{filters.labelIds.length}</Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    {labels.map((label) => (
                      <DropdownMenuCheckboxItem
                        key={label.id}
                        checked={filters.labelIds.includes(label.id)}
                        onCheckedChange={() => toggleFilterArray('labelIds', label.id)}
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: label.color }}
                        ></div>
                        {label.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Workflow Stages Filter */}
              {workflowStages.length > 0 && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="h-9">
                      <Filter className="mr-2 h-4 w-4" />
                      Stages
                      {filters.stageIds.length > 0 && (
                        <Badge variant="secondary" className="ml-2">{filters.stageIds.length}</Badge>
                      )}
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-[200px]">
                    {workflowStages.map((stage) => (
                      <DropdownMenuCheckboxItem
                        key={stage.id}
                        checked={filters.stageIds.includes(stage.id)}
                        onCheckedChange={() => toggleFilterArray('stageIds', stage.id)}
                      >
                        <div 
                          className="w-3 h-3 rounded-full mr-2" 
                          style={{ backgroundColor: stage.color }}
                        ></div>
                        {stage.name}
                      </DropdownMenuCheckboxItem>
                    ))}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}

              {/* Task Type Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    Type
                    {filters.taskTypes.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{filters.taskTypes.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[150px]">
                  {TASK_TYPES.map((type) => (
                    <DropdownMenuCheckboxItem
                      key={type.value}
                      checked={filters.taskTypes.includes(type.value)}
                      onCheckedChange={() => toggleFilterArray('taskTypes', type.value)}
                    >
                      {type.label}
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Priority Filter */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    Priority
                    {filters.priorities.length > 0 && (
                      <Badge variant="secondary" className="ml-2">{filters.priorities.length}</Badge>
                    )}
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[150px]">
                  {PRIORITY_LEVELS.map((priority) => (
                    <DropdownMenuCheckboxItem
                      key={priority.value}
                      checked={filters.priorities.includes(priority.value)}
                      onCheckedChange={() => toggleFilterArray('priorities', priority.value)}
                    >
                      <span className={priority.color}>{priority.label}</span>
                    </DropdownMenuCheckboxItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Clear Filters */}
              {hasActiveFilters() && (
                <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1" onClick={clearAllFilters}>
                  <X className="h-3.5 w-3.5" />
                  <span>Clear Filters</span>
                </Button>
              )}
            </div>
          </div>

          {/* Summary Cards */}
          <div className="mb-8">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
              {summaryCards.map((card, index) => (
                <Card key={index} className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`rounded-full p-2 mb-2 ${card.color}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className="text-sm text-muted-foreground">{card.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Charts Section */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Dynamic Task Status Distribution */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Task Status Distribution</h3>
                  <PieChart className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="space-y-3">
                  {taskStatusDistribution.map((item, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div 
                          className="w-3 h-3 rounded-full" 
                          style={{ backgroundColor: item.color }}
                        ></div>
                        <span className="text-sm">{item.status}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{item.count}</span>
                        <span className="text-xs text-muted-foreground">
                          ({totalTasks > 0 ? Math.round((item.count / totalTasks) * 100) : 0}%)
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Team Members */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Team Members</h3>
                  <Users className="h-5 w-5 text-muted-foreground" />
                </div>

                                  <div className="space-y-3">
                    {participants.length > 0 ? (
                      participants.map((participant: any, index: number) => {
                        const assignedTasksCount = filteredTasks.filter(task => task.assigneeId === participant.id).length
                        return (
                          <div key={index} className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <Avatar className="h-8 w-8">
                                <AvatarFallback>
                                  {participant.initials}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <span className="text-sm font-medium">{participant.name}</span>
                              </div>
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {assignedTasksCount} tasks
                            </div>
                          </div>
                        )
                      })
                    ) : (
                      <div className="text-sm text-muted-foreground text-center py-4">
                        No team members found
                      </div>
                    )}
                  </div>
              </CardContent>
            </Card>
          </div>

          {/* Recent Tasks */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">Recent Tasks</h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link href={`/projects/${publicId}/board`}>View All</Link>
                </Button>
              </div>

              <div className="space-y-3">
                {filteredTasks.slice(0, 5).map((task, index) => {
                  const stage = workflowStages.find((s, i) => i === task.status)
                  const priorityLevel = PRIORITY_LEVELS.find(p => p.value === task.priority)
                  
                  return (
                    <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                      <div className="flex items-center gap-3">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{task.title}</div>
                          <div className="text-xs text-muted-foreground">
                            {task.description && task.description.length > 50 
                              ? `${task.description.substring(0, 50)}...` 
                              : task.description}
                          </div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        {stage && (
                          <Badge 
                            variant="outline"
                            style={{ 
                              backgroundColor: `${stage.color}20`, 
                              borderColor: stage.color,
                              color: stage.color 
                            }}
                          >
                            {stage.name}
                          </Badge>
                        )}
                        {priorityLevel && (
                          <Badge variant="outline" className={priorityLevel.color}>
                            {priorityLevel.label}
                          </Badge>
                        )}
                        {task.assigneeName && (
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {task.assigneeName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                        )}
                      </div>
                    </div>
                  )
                })}

                {filteredTasks.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-8">
                    No tasks found matching your filters
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 