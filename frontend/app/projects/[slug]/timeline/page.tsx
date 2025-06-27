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
import { useProject } from "@/contexts/project-context"
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

type ViewType = "gantt" | "calendar"

export default function ProjectTimelinePage() {
  const params = useParams()
  const { token } = useAuth()
  const { currentProject } = useProject()
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
  }, [token, publicId, currentProject])

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
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="gantt">Gantt View</TabsTrigger>
            <TabsTrigger value="calendar">Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Content based on selected view */}
      {viewType === "gantt" && <GanttView tasks={tasks} />}
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
  const [currentViewDate, setCurrentViewDate] = useState(new Date())
  const tasksWithDates = tasks.filter(task => task.dueDate)
  const tasksWithoutDates = tasks.filter(task => !task.dueDate)

  // Navigation functions
  const navigatePrevious = () => {
    const newDate = new Date(currentViewDate)
    newDate.setDate(newDate.getDate() - 7) // Move back 1 week
    setCurrentViewDate(newDate)
  }

  const navigateNext = () => {
    const newDate = new Date(currentViewDate)
    newDate.setDate(newDate.getDate() + 7) // Move forward 1 week
    setCurrentViewDate(newDate)
  }

  const goToToday = () => {
    setCurrentViewDate(new Date())
  }

  // Calculate date range - show 15 days starting from current view date
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  
  // Show 15 days starting from current view date
  const displayStartDate = new Date(currentViewDate)
  displayStartDate.setHours(0, 0, 0, 0)
  
  const displayEndDate = new Date(currentViewDate)
  displayEndDate.setDate(displayEndDate.getDate() + 14)
  displayEndDate.setHours(23, 59, 59, 999)
  
  // Generate timeline dates - 15 days total
  const timelineDates: Date[] = []
  const currentDate = new Date(displayStartDate)
  for (let i = 0; i < 15; i++) {
    timelineDates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 1)
  }

  // Filter tasks that are visible in current view
  const visibleTasks = tasksWithDates.filter(task => {
    const taskDue = new Date(task.dueDate!)
    const taskStart = new Date(task.createdAt)
    return (taskStart <= displayEndDate && taskDue >= displayStartDate)
  })

  if (tasksWithDates.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium">Gantt Chart</h3>
            {/* Navigation controls even when no tasks */}
            <div className="flex items-center gap-2">
              <Button variant="outline" size="sm" onClick={navigatePrevious}>
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              <Button variant="outline" size="sm" onClick={goToToday}>
                Today
              </Button>
              <Button variant="outline" size="sm" onClick={navigateNext}>
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          <div className="text-center py-8">
            <Calendar className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">No tasks with dates</h3>
            <p className="text-muted-foreground mb-4">Tasks need due dates to appear in the Gantt chart.</p>
            
            {tasksWithoutDates.length > 0 && (
              <div className="mt-6 text-left max-w-md mx-auto">
                <p className="text-sm text-muted-foreground mb-3">
                  You have {tasksWithoutDates.length} task(s) without due dates:
                </p>
                <div className="space-y-2 mb-4">
                  {tasksWithoutDates.map(task => (
                    <div key={task.id} className="flex items-center justify-between p-2 bg-gray-50 rounded text-sm">
                      <span className="font-medium">{task.title}</span>
                      <Badge variant="outline" className="text-xs">No due date</Badge>
                    </div>
                  ))}
                </div>
                <p className="text-sm text-violet-600">
                  💡 Add due dates to these tasks to see them in the timeline
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    )
  }

  const getTaskBarStyle = (task: Task) => {
    if (!task.dueDate) return { left: '0%', width: '0%' }
    
    const taskDue = new Date(task.dueDate)
    const taskStart = new Date(task.createdAt)
    
    // Simple calculation based on 15-day timeline
    const totalDays = 15
    const daysFromStart = Math.max(0, Math.floor((taskStart.getTime() - displayStartDate.getTime()) / (1000 * 60 * 60 * 24)))
    const taskDuration = Math.max(1, Math.ceil((taskDue.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24)))
    
    // Make sure task is within the visible range
    if (daysFromStart >= totalDays || daysFromStart + taskDuration < 0) {
      return { left: '0%', width: '0%' }
    }
    
    const left = Math.max(0, (daysFromStart / totalDays) * 100)
    const width = Math.min((taskDuration / totalDays) * 100, 100 - left)
    
    return {
      left: `${left}%`,
      width: `${Math.max(width, 3)}%`
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
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-medium">Gantt Chart</h3>
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              {currentViewDate.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
            </span>
            <Button variant="outline" size="sm" onClick={navigatePrevious}>
              <ChevronLeft className="h-4 w-4" />
              Previous
            </Button>
            <Button variant="outline" size="sm" onClick={goToToday}>
              Today
            </Button>
            <Button variant="outline" size="sm" onClick={navigateNext}>
              Next
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {/* Today Indicator Above Timeline */}
          <div className="flex items-center mb-2">
            <div className="w-64 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="flex">
                {timelineDates.map((date, index) => {
                  const isToday = date.toDateString() === today.toDateString()
                  return (
                    <div key={index} className="flex-1 text-center min-w-[60px]">
                      {isToday && (
                        <div className="bg-red-500 text-white text-xs px-2 py-1 rounded font-medium">
                          Today
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
          
          {/* Timeline Header */}
          <div className="flex items-center mb-4">
            <div className="w-64 flex-shrink-0"></div>
            <div className="flex-1">
              <div className="flex">
                {timelineDates.map((date, index) => {
                  const isWeekend = date.getDay() === 0 || date.getDay() === 6
                  const isToday = date.toDateString() === today.toDateString()
                  
                  return (
                    <div 
                      key={index} 
                      className={`flex-1 text-center text-xs border-r py-2 min-w-[60px] ${
                        isWeekend ? 'bg-gray-50 text-gray-400' : 'text-muted-foreground'
                      } ${isToday ? 'bg-red-100 font-bold text-red-700' : ''}`}
                    >
                      <div className="text-xs opacity-70">
                        {date.toLocaleDateString('en-US', { weekday: 'short' })}
                      </div>
                      <div className="font-medium">
                        {date.getDate()}
                      </div>
                      <div className="text-xs opacity-60">
                        {date.toLocaleDateString('en-US', { month: 'short' })}
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
            <div className="space-y-4">
              {visibleTasks.map((task) => {
                const barStyle = getTaskBarStyle(task)
                const statusColor = getStatusColor(task)
                
                return (
                  <div key={task.id} className="flex items-center">
                    {/* Task Info */}
                    <div className="w-64 flex-shrink-0 pr-4">
                      <div className="font-medium text-sm break-words">{task.title}</div>
                      <div className="text-xs text-muted-foreground flex flex-wrap items-center gap-1 mt-1">
                        {task.assigneeName ? (
                          <span className="inline-flex items-center gap-1 bg-blue-50 text-blue-700 px-2 py-1 rounded text-xs font-medium">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            <span className="truncate max-w-[80px]">{task.assigneeName}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 bg-gray-50 text-gray-500 px-2 py-1 rounded text-xs">
                            <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                            </svg>
                            Unassigned
                          </span>
                        )}
                        <span className="text-gray-400 text-xs">
                          Due: {new Date(task.dueDate!).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                      </div>
                    </div>
                    
                    {/* Timeline */}
                    <div className="flex-1">
                      <div className="flex relative">
                        {/* Background grid */}
                        {timelineDates.map((_, index) => (
                          <div key={index} className="flex-1 h-8 border-r bg-gray-100 dark:bg-gray-700 min-w-[60px]"></div>
                        ))}
                        
                        {/* Task bar overlay */}
                        <div
                          className={`absolute h-8 ${statusColor} rounded z-10`}
                          style={barStyle}
                        >
                          <div className="absolute inset-0 flex items-center justify-center text-white text-xs font-medium px-1">
                            <span className="truncate">
                              {task.title}
                            </span>
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
                return <div key={`empty-${index}`} className="h-32 border-r border-b last:border-r-0"></div>
              }

              const dayTasks = getTasksForDay(day)
              const isCurrentDay = isToday(day)

              return (
                <div key={`day-${day}-${month}-${year}`} className="h-32 border-r border-b last:border-r-0 p-2 overflow-hidden">
                  <div className={`text-sm font-medium mb-2 ${
                    isCurrentDay 
                      ? 'bg-blue-500 text-white w-6 h-6 rounded-full flex items-center justify-center' 
                      : ''
                  }`}>
                    {day}
                  </div>
                  
                  <div className="space-y-1">
                    {dayTasks.slice(0, 3).map((task, taskIndex) => (
                      <div 
                        key={`day-${day}-task-${task.id}-${taskIndex}`} 
                        className={`text-xs p-1 rounded border ${getTaskColor(task)}`}
                        title={task.title}
                      >
                        <div className="break-words leading-tight">
                          {task.title}
                        </div>
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
              .map((task, taskIndex) => (
                <div key={`summary-task-${task.id}-${taskIndex}`} className="flex items-center gap-3 p-2 rounded border">
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