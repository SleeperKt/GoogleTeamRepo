"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown, Flag, ListFilter, Plus, ZoomIn, ZoomOut, ChevronLeft, ChevronRight, MoreHorizontal, Edit, Trash2 } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { MilestoneManagementDialog } from "@/components/milestone-management-dialog"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { API_BASE_URL } from "@/lib/api"

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

interface Milestone {
  id: number | string
  title: string
  date: string
  status: string
  description?: string
  linkedTasks?: number[]
}

// Status colors
const statusColors = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "not-started": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  upcoming: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
}

// Task bar colors
const taskBarColors = {
  completed: "bg-green-500 dark:bg-green-600",
  "in-progress": "bg-blue-500 dark:bg-blue-600",
  "not-started": "bg-gray-300 dark:bg-gray-600",
  overdue: "bg-red-500 dark:bg-red-600",
}

type ViewType = "gantt" | "milestones" | "calendar"

export default function ProjectTimelinePage() {
  const params = useParams()
  const { token } = useAuth()
  const publicId = params.slug as string

  const [project, setProject] = useState<ProjectData | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)
  const [viewType, setViewType] = useState<ViewType>("gantt")
  const [expandedMilestone, setExpandedMilestone] = useState<string | number | null>(null)
  const [createMilestoneOpen, setCreateMilestoneOpen] = useState(false)
  const [editingMilestone, setEditingMilestone] = useState<Milestone | null>(null)
  const [projectMilestones, setProjectMilestones] = useState<Milestone[]>([]) // Local state for milestones

  // Fetch project and tasks data
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !publicId) return

      try {
        setLoading(true)

        // Fetch project data
        const projectRes = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        })

        if (projectRes.ok) {
          const projectData = await projectRes.json()
          setProject(projectData)
        }

        // Fetch tasks data
        const tasksRes = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}/tasks`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        })

        if (tasksRes.ok) {
          const tasksData = await tasksRes.json()
          let tasksArray: Task[] = []
          if (Array.isArray(tasksData)) {
            tasksArray = tasksData
          } else if (tasksData && Array.isArray(tasksData.tasks)) {
            tasksArray = tasksData.tasks
          } else if (tasksData && Array.isArray(tasksData.data)) {
            tasksArray = tasksData.data
          }
          setTasks(tasksArray)
        }

        // Fetch milestones
        try {
          const milestonesRes = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}/milestones`, {
            headers: { 
              Authorization: `Bearer ${token}`,
              'Content-Type': 'application/json'
            },
          })

          if (milestonesRes.ok) {
            const milestonesData = await milestonesRes.json()
            let milestonesArray: Milestone[] = []
            if (Array.isArray(milestonesData)) {
              milestonesArray = milestonesData
            } else if (milestonesData && Array.isArray(milestonesData.milestones)) {
              milestonesArray = milestonesData.milestones
            } else if (milestonesData && Array.isArray(milestonesData.data)) {
              milestonesArray = milestonesData.data
            }
            setProjectMilestones(milestonesArray)
          } else {
            console.log('Milestones endpoint not available')
          }
        } catch (error) {
          console.log('Error fetching milestones:', error)
        }

        // For now, use mock milestones for auto-generated ones
        setMilestones([
          {
            id: 1,
            title: "Project Kickoff",
            date: project?.createdAt || new Date().toISOString(),
            status: "completed",
            description: "Project started and initial planning completed"
          }
        ])

      } catch (error) {
        console.error('Error fetching timeline data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token, publicId])

  // Milestone management handlers
  const handleCreateMilestone = async (milestoneData: Omit<Milestone, 'id'>) => {
    try {
      // Save to backend - this endpoint doesn't exist yet, so we'll catch the error
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}/milestones`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: milestoneData.title,
          description: milestoneData.description,
          date: milestoneData.date,
          status: milestoneData.status
        })
      })

      if (response.ok) {
        const newMilestone = await response.json()
        setProjectMilestones(prev => [...prev, newMilestone])
        console.log('Created milestone:', newMilestone)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.log('Milestone API not available, using local state only:', error)
      // Create milestone locally for now
      const newMilestone: Milestone = {
        ...milestoneData,
        id: Date.now()
      }
      setProjectMilestones(prev => [...prev, newMilestone])
      console.log('Created milestone locally:', newMilestone)
    }
  }

  const handleUpdateMilestone = async (milestoneData: Omit<Milestone, 'id'>) => {
    if (!editingMilestone) return
    
    try {
      // Update in backend - this endpoint doesn't exist yet, so we'll catch the error
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}/milestones/${editingMilestone.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          title: milestoneData.title,
          description: milestoneData.description,
          date: milestoneData.date,
          status: milestoneData.status
        })
      })

      if (response.ok) {
        const updatedMilestone = await response.json()
        setProjectMilestones(prev => 
          prev.map(m => m.id === editingMilestone.id ? updatedMilestone : m)
        )
        console.log('Updated milestone:', updatedMilestone)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.log('Milestone API not available, using local state only:', error)
      // Update milestone locally for now
      const updatedMilestone: Milestone = {
        ...milestoneData,
        id: editingMilestone.id
      }
      setProjectMilestones(prev => 
        prev.map(m => m.id === editingMilestone.id ? updatedMilestone : m)
      )
      console.log('Updated milestone locally:', updatedMilestone)
    }
  }

  const handleDeleteMilestone = async (milestoneId: number | string) => {
    try {
      // Delete from backend - this endpoint doesn't exist yet, so we'll catch the error
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}/milestones/${milestoneId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })

      if (response.ok) {
        setProjectMilestones(prev => prev.filter(m => m.id !== milestoneId))
        console.log('Deleted milestone:', milestoneId)
      } else {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`)
      }
    } catch (error) {
      console.log('Milestone API not available, using local state only:', error)
      // Delete milestone locally for now
      setProjectMilestones(prev => prev.filter(m => m.id !== milestoneId))
      console.log('Deleted milestone locally:', milestoneId)
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center mt-10">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Timeline</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{project.name}</span>
            <span>•</span>
            <span>{tasks.length} tasks</span>
          </div>
        </div>
      </div>

      {/* View Tabs */}
      <div className="mb-6">
        <Tabs value={viewType} onValueChange={(value) => setViewType(value as ViewType)} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="gantt">Gantt View</TabsTrigger>
            <TabsTrigger value="milestones">Milestones</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on selected view */}
      {viewType === "gantt" && <GanttView tasks={tasks} />}
      {viewType === "milestones" && (
        <MilestonesView 
          milestones={[...milestones, ...projectMilestones]} 
          tasks={tasks} 
          expandedMilestone={expandedMilestone} 
          setExpandedMilestone={setExpandedMilestone}
          onCreateMilestone={() => setCreateMilestoneOpen(true)}
          onEditMilestone={setEditingMilestone}
          onDeleteMilestone={handleDeleteMilestone}
        />
      )}
      {viewType === "calendar" && <CalendarView tasks={tasks} />}
      
      {/* Milestone Management Dialog */}
      <MilestoneManagementDialog
        open={createMilestoneOpen || editingMilestone !== null}
        onOpenChange={(open) => {
          if (!open) {
            setCreateMilestoneOpen(false)
            setEditingMilestone(null)
          }
        }}
        milestone={editingMilestone}
        onSave={editingMilestone ? handleUpdateMilestone : handleCreateMilestone}
      />
    </div>
  )
}

// Gantt View Component
function GanttView({ tasks }: { tasks: Task[] }) {
  const tasksWithDates = tasks.filter(task => task.dueDate)
  
  if (tasksWithDates.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Gantt Chart</h3>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks with dates</h3>
            <p className="text-muted-foreground">Tasks need due dates to appear in the Gantt chart.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Calculate date range
  const dates = tasksWithDates.map(task => new Date(task.dueDate!))
  const today = new Date()
  today.setHours(0, 0, 0, 0) // Normalize to midnight for accurate comparison
  
  // Include today in the date range calculation
  const allDates = [...dates, today]
  const minDate = new Date(Math.min(...allDates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...allDates.map(d => d.getTime())))
  
  // Add padding to date range
  const startDate = new Date(minDate)
  startDate.setDate(startDate.getDate() - 7)
  startDate.setHours(0, 0, 0, 0)
  
  const endDate = new Date(maxDate)
  endDate.setDate(endDate.getDate() + 7)
  endDate.setHours(0, 0, 0, 0)
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Generate timeline dates - show EVERY SINGLE DAY for proper Gantt chart
  const timelineDates = []
  // Limit range if too many days to prevent UI issues
  const maxDisplayDays = 90 // Show max 3 months at once
  const actualRange = Math.min(totalDays, maxDisplayDays)
  const displayStartDate = totalDays > maxDisplayDays 
    ? new Date(today.getTime() - (maxDisplayDays/2 * 24 * 60 * 60 * 1000))
    : startDate
  const displayEndDate = new Date(displayStartDate.getTime() + (actualRange * 24 * 60 * 60 * 1000))
  
  const currentDate = new Date(displayStartDate)
  while (currentDate <= displayEndDate) {
    timelineDates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1) // Show EVERY day
  }

  const getTaskBarStyle = (task: Task) => {
    if (!task.dueDate) return { left: '0%', width: '0%' }
    
    const taskDue = new Date(task.dueDate)
    const taskStart = new Date(task.createdAt)
    
    // Calculate position and width using display range
    const displayDays = Math.ceil((displayEndDate.getTime() - displayStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const daysFromStart = Math.max(0, (taskStart.getTime() - displayStartDate.getTime()) / (1000 * 60 * 60 * 24))
    const taskDuration = Math.max(1, (taskDue.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24))
    
    const left = (daysFromStart / displayDays) * 100
    const width = Math.min((taskDuration / displayDays) * 100, 100 - left)
    
    return {
      left: `${left}%`,
      width: `${Math.max(width, 2)}%`
    }
  }

  const getStatusColor = (task: Task) => {
    const now = new Date()
    const dueDate = new Date(task.dueDate!)
    
    if (task.status === 4) return 'bg-green-500' // Done
    if (dueDate < now) return 'bg-red-500' // Overdue
    if (task.status === 2) return 'bg-blue-500' // In Progress
    return 'bg-gray-400' // Not started
  }

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Gantt Chart</h3>
        
        <div className="overflow-x-auto">
          {/* Today Indicator Above Timeline */}
          {(() => {
            const today = new Date()
            today.setHours(0, 0, 0, 0)
            const todayIndex = timelineDates.findIndex((date: Date) => 
              date.toDateString() === today.toDateString()
            )
            if (todayIndex >= 0) {
              const leftPosition = 16 + (todayIndex / timelineDates.length) * (100 - 16) + ((100 - 16) / timelineDates.length / 2)
              return (
                <div 
                  className="relative mb-2 h-6"
                >
                  <div 
                    className="absolute bg-red-500 text-white text-xs px-2 py-1 rounded whitespace-nowrap font-medium transform -translate-x-1/2"
                    style={{ left: `${leftPosition}%` }}
                  >
                    Today
                  </div>
                </div>
              )
            }
            return null
          })()}
          
          {/* Timeline Header */}
          <div className="flex items-center mb-4">
            <div className="w-64 flex-shrink-0"></div>
            <div className="flex-1 relative overflow-visible">
              <div className="flex overflow-visible">
                {timelineDates.map((date, index) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  const isToday = date.toDateString() === new Date().toDateString()
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex-1 text-center text-xs border-r last:border-r-0 py-1 min-w-[40px] relative ${
                        isWeekend ? 'bg-gray-50 text-gray-400' : 'text-muted-foreground'
                      } ${isToday ? 'bg-red-50 font-medium text-red-700' : ''}`}
                    >
                      <div className="text-xs opacity-70">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="font-medium">
                        {date.toLocaleDateString('en-US', { day: 'numeric' })}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Chart Area */}
          <div className="relative">
            {/* Task Bars */}
            <div className="space-y-3">
              {tasksWithDates.map((task) => {
                const barStyle = getTaskBarStyle(task)
                const statusColor = getStatusColor(task)
                
                return (
                  <div key={task.id} className="flex items-center">
                    {/* Task Info */}
                    <div className="w-64 flex-shrink-0 pr-4">
                      <div className="font-medium text-sm truncate">{task.title}</div>
                      <div className="text-xs text-muted-foreground flex items-center gap-2">
                        {task.assigneeName ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            {task.assigneeName}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded text-xs">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Unassigned
                          </span>
                        )}
                        <span className="text-gray-400">
                          Due: {new Date(task.dueDate!).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    
                    {/* Timeline */}
                    <div className="flex-1 relative">
                      <div className="h-8 bg-gray-100 dark:bg-gray-700 rounded">
                        <div
                          className={`h-full ${statusColor} rounded relative`}
                          style={barStyle}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium">
                            {task.title.substring(0, 20)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
          
          {/* Legend */}
          <div className="flex items-center gap-6 mt-6 text-sm">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-green-500 rounded"></div>
              <span>Completed</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-blue-500 rounded"></div>
              <span>In Progress</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-red-500 rounded"></div>
              <span>Overdue</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 bg-gray-400 rounded"></div>
              <span>Not Started</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Milestones View Component
function MilestonesView({ 
  milestones, 
  tasks, 
  expandedMilestone, 
  setExpandedMilestone,
  onCreateMilestone,
  onEditMilestone,
  onDeleteMilestone
}: { 
  milestones: Milestone[]
  tasks: Task[]
  expandedMilestone: string | number | null
  setExpandedMilestone: (id: string | number | null) => void
  onCreateMilestone: () => void
  onEditMilestone: (milestone: Milestone) => void
  onDeleteMilestone: (id: number | string) => void
}) {
  // Generate additional milestones based on project data
  const allMilestones = [
    ...milestones,
    // Add completed tasks as mini-milestones
    ...tasks
      .filter(task => task.status === 4 && task.dueDate) // Only completed tasks with due dates
      .map(task => ({
        id: `task-${task.id}`,
        title: `Completed: ${task.title}`,
        date: task.dueDate!,
        status: "completed",
        description: `Task completed${task.assigneeName ? ` by ${task.assigneeName}` : ''}`,
        linkedTasks: [task.id]
      }))
  ].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())

  if (allMilestones.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Project Milestones</h3>
          <div className="text-center py-8">
            <Flag className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No milestones yet</h3>
            <p className="text-muted-foreground mb-4">
              Milestones help track important project markers and completed tasks.
            </p>
            <Button onClick={onCreateMilestone}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  const getMilestoneIcon = (status: string) => {
    switch (status) {
      case "completed":
        return <Flag className="h-5 w-5 text-green-600" />
      case "in-progress":
        return <Flag className="h-5 w-5 text-blue-600" />
      case "upcoming":
        return <Flag className="h-5 w-5 text-gray-400" />
      default:
        return <Flag className="h-5 w-5 text-gray-400" />
    }
  }

  const getMilestoneColor = (status: string) => {
    switch (status) {
      case "completed":
        return "border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-900"
      case "in-progress":
        return "border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-900"
      case "upcoming":
        return "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
      default:
        return "border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800"
    }
  }

  const getLinkedTasks = (milestone: any) => {
    if (!milestone.linkedTasks) return []
    return tasks.filter(task => milestone.linkedTasks.includes(task.id))
  }

  const formatMilestoneDate = (dateStr: string) => {
    const date = new Date(dateStr)
    const now = new Date()
    const diffTime = date.getTime() - now.getTime()
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))
    
    if (diffDays === 0) return "Today"
    if (diffDays === 1) return "Tomorrow"
    if (diffDays === -1) return "Yesterday"
    if (diffDays > 0) return `In ${diffDays} days`
    if (diffDays < 0) return `${Math.abs(diffDays)} days ago`
    
    return date.toLocaleDateString('en-US', { 
      month: 'long', 
      day: 'numeric', 
      year: 'numeric' 
    })
  }

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Project Milestones</h3>
          <div className="flex items-center gap-3">
            <Badge variant="secondary" className="text-xs">
              {allMilestones.length} milestones
            </Badge>
            <Button size="sm" onClick={onCreateMilestone}>
              <Plus className="h-4 w-4 mr-2" />
              Add Milestone
            </Button>
          </div>
        </div>
        
        <div className="space-y-4">
          {allMilestones.map((milestone, index) => {
            const isExpanded = expandedMilestone === milestone.id
            const linkedTasks = getLinkedTasks(milestone)
            const milestoneDate = new Date(milestone.date)
            const isOverdue = milestoneDate < new Date() && milestone.status !== "completed"
            
            return (
              <div key={milestone.id} className={`border rounded-lg ${getMilestoneColor(milestone.status)}`}>
                <div 
                  className="p-4 cursor-pointer"
                  onClick={() => setExpandedMilestone(isExpanded ? null : milestone.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {getMilestoneIcon(milestone.status)}
                      <div>
                        <div className="font-medium flex items-center gap-2">
                          {milestone.title}
                          {isOverdue && (
                            <Badge variant="destructive" className="text-xs">Overdue</Badge>
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {formatMilestoneDate(milestone.date)}
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge 
                        variant="outline" 
                        className="text-gray-600 bg-gray-50 border-gray-200"
                      >
                        {milestone.status.replace('-', ' ')}
                      </Badge>
                      {/* Only add edit/delete for non-task milestones */}
                      {!milestone.id.toString().startsWith('task-') && (
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              onEditMilestone(milestone)
                            }}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={(e) => {
                              e.stopPropagation()
                              onDeleteMilestone(milestone.id)
                            }} className="text-red-600">
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      )}
                      <ChevronDown 
                        className={`h-4 w-4 text-muted-foreground transition-transform ${
                          isExpanded ? 'rotate-180' : ''
                        }`} 
                      />
                    </div>
                  </div>
                </div>
                
                {isExpanded && (
                  <div className="px-4 pb-4 border-t bg-white/50 dark:bg-gray-800/50">
                    {milestone.description && (
                      <p className="text-sm text-muted-foreground mt-3 mb-3">
                        {milestone.description}
                      </p>
                    )}
                    
                    {linkedTasks.length > 0 && (
                      <div className="mt-3">
                        <h4 className="text-sm font-medium mb-2">Linked Tasks ({linkedTasks.length})</h4>
                        <div className="space-y-2">
                          {linkedTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-2 text-sm">
                              <div className={`w-2 h-2 rounded-full ${
                                task.status === 4 ? 'bg-green-500' : 
                                task.status === 2 ? 'bg-blue-500' : 'bg-gray-400'
                              }`}></div>
                              <span>{task.title}</span>
                              {task.assigneeName && (
                                <span className="text-muted-foreground">({task.assigneeName})</span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                    
                    <div className="mt-3 text-xs text-muted-foreground">
                      {milestone.date && `Date: ${new Date(milestone.date).toLocaleDateString('en-US', { 
                        weekday: 'long',
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}`}
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>
        
        {/* Timeline visualization */}
        <div className="mt-8 pt-6 border-t">
          <h4 className="text-sm font-medium mb-4">Timeline</h4>
          <div className="relative">
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gray-200 dark:bg-gray-700"></div>
            <div className="space-y-6">
              {allMilestones.map((milestone, index) => (
                <div key={`timeline-${milestone.id}`} className="relative flex items-center gap-4">
                  <div className={`relative z-10 w-8 h-8 rounded-full border-2 flex items-center justify-center ${
                    milestone.status === "completed" 
                      ? "bg-green-500 border-green-500" 
                      : milestone.status === "in-progress"
                      ? "bg-blue-500 border-blue-500"
                      : "bg-white border-gray-300 dark:bg-gray-800 dark:border-gray-600"
                  }`}>
                    {getMilestoneIcon(milestone.status)}
                  </div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{milestone.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {new Date(milestone.date).toLocaleDateString()}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

// Calendar View Component
function CalendarView({ tasks }: { tasks: Task[] }) {
  const [currentDate, setCurrentDate] = useState(new Date())
  const tasksWithDates = tasks.filter(task => task.dueDate)

  if (tasksWithDates.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <h3 className="text-lg font-medium mb-4">Calendar View</h3>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks with dates</h3>
            <p className="text-muted-foreground">Tasks need due dates to appear in the calendar.</p>
          </div>
        </CardContent>
      </Card>
    )
  }

  // Get current month and year
  const year = currentDate.getFullYear()
  const month = currentDate.getMonth()
  
  // Get first day of the month and how many days
  const firstDay = new Date(year, month, 1)
  const lastDay = new Date(year, month + 1, 0)
  const daysInMonth = lastDay.getDate()
  const startingDayOfWeek = firstDay.getDay()

  // Generate calendar grid
  const calendarDays = []
  
  // Add empty cells for days before the first day of the month
  for (let i = 0; i < startingDayOfWeek; i++) {
    calendarDays.push(null)
  }
  
  // Add days of the month
  for (let day = 1; day <= daysInMonth; day++) {
    calendarDays.push(day)
  }

  // Group tasks by date
  const tasksByDate = tasksWithDates.reduce((acc, task) => {
    const date = new Date(task.dueDate!)
    const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`
    if (!acc[key]) acc[key] = []
    acc[key].push(task)
    return acc
  }, {} as Record<string, Task[]>)

  const getTasksForDay = (day: number) => {
    const key = `${year}-${month}-${day}`
    return tasksByDate[key] || []
  }

  const getTaskColor = (task: Task) => {
    const now = new Date()
    const dueDate = new Date(task.dueDate!)
    
    if (task.status === 4) return 'bg-green-100 text-green-800 border-green-200'
    if (dueDate < now) return 'bg-red-100 text-red-800 border-red-200'
    if (task.status === 2) return 'bg-blue-100 text-blue-800 border-blue-200'
    return 'bg-gray-100 text-gray-800 border-gray-200'
  }

  const navigateMonth = (direction: 'prev' | 'next') => {
    const newDate = new Date(currentDate)
    if (direction === 'prev') {
      newDate.setMonth(newDate.getMonth() - 1)
    } else {
      newDate.setMonth(newDate.getMonth() + 1)
    }
    setCurrentDate(newDate)
  }

  const isToday = (day: number) => {
    const today = new Date()
    return today.getFullYear() === year && 
           today.getMonth() === month && 
           today.getDate() === day
  }

  const monthNames = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ]

  const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        {/* Calendar Header */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-medium">Calendar View</h3>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={() => navigateMonth('prev')}>
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <span className="font-medium min-w-[140px] text-center">
                {monthNames[month]} {year}
              </span>
              <Button variant="outline" size="sm" onClick={() => navigateMonth('next')}>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
            <Button variant="outline" size="sm" onClick={() => setCurrentDate(new Date())}>
              Today
            </Button>
          </div>
        </div>

        {/* Calendar Grid */}
        <div className="border rounded-lg overflow-hidden">
          {/* Day Headers */}
          <div className="grid grid-cols-7 bg-gray-50 dark:bg-gray-700">
            {dayNames.map(day => (
              <div key={day} className="p-3 text-center text-sm font-medium text-muted-foreground border-r last:border-r-0">
                {day}
              </div>
            ))}
          </div>

          {/* Calendar Days */}
          <div className="grid grid-cols-7">
            {calendarDays.map((day, index) => {
              if (day === null) {
                return <div key={index} className="h-32 border-r border-b last:border-r-0"></div>
              }

              const dayTasks = getTasksForDay(day)
              const isCurrentDay = isToday(day)

              return (
                <div key={day} className="h-32 border-r border-b last:border-r-0 p-2 overflow-hidden">
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentDay 
                      ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                      : ''
                  }`}>
                    {day}
                  </div>
                  
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map(task => (
                      <div 
                        key={task.id} 
                        className={`text-xs p-1 rounded border truncate ${getTaskColor(task)}`}
                        title={task.title}
                      >
                        {task.title.substring(0, 12)}
                        {task.title.length > 12 && '...'}
                      </div>
                    ))}
                    {dayTasks.length > 3 && (
                      <div className="text-xs text-muted-foreground">
                        +{dayTasks.length - 3} more
                      </div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>

        {/* Legend */}
        <div className="flex items-center gap-6 mt-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-100 border border-green-200 rounded"></div>
            <span>Completed</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-100 border border-blue-200 rounded"></div>
            <span>In Progress</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-100 border border-red-200 rounded"></div>
            <span>Overdue</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-gray-100 border border-gray-200 rounded"></div>
            <span>Not Started</span>
          </div>
        </div>

        {/* Tasks Summary for Current Month */}
        <div className="mt-6 pt-6 border-t">
          <h4 className="text-sm font-medium mb-3">Tasks This Month</h4>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {tasksWithDates
              .filter(task => {
                const taskDate = new Date(task.dueDate!)
                return taskDate.getFullYear() === year && taskDate.getMonth() === month
              })
              .sort((a, b) => new Date(a.dueDate!).getTime() - new Date(b.dueDate!).getTime())
              .map(task => (
                <div key={task.id} className="flex items-center gap-3 p-2 rounded border">
                  <div className={`w-3 h-3 rounded-full ${
                    task.status === 4 ? 'bg-green-500' : 
                    task.status === 2 ? 'bg-blue-500' : 'bg-gray-400'
                  }`}></div>
                  <div className="flex-1">
                    <div className="font-medium text-sm">{task.title}</div>
                    <div className="text-xs text-muted-foreground">
                      Due: {new Date(task.dueDate!).toLocaleDateString()}
                      {task.assigneeName && ` • ${task.assigneeName}`}
                    </div>
                  </div>
                </div>
              ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
} 