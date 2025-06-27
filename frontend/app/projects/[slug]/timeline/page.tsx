"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown, Flag, ListFilter, Plus, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  id: number
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
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null)

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

        // For now, use mock milestones since backend might not have this endpoint
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
      {viewType === "milestones" && <MilestonesView milestones={milestones} tasks={tasks} expandedMilestone={expandedMilestone} setExpandedMilestone={setExpandedMilestone} />}
      {viewType === "calendar" && <CalendarView tasks={tasks} />}
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
  const minDate = new Date(Math.min(...dates.map(d => d.getTime())))
  const maxDate = new Date(Math.max(...dates.map(d => d.getTime())))
  
  // Add padding to date range
  const startDate = new Date(minDate)
  startDate.setDate(startDate.getDate() - 7)
  
  const endDate = new Date(maxDate)
  endDate.setDate(endDate.getDate() + 7)
  
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  
  // Generate timeline dates (weekly intervals)
  const timelineDates = []
  const currentDate = new Date(startDate)
  while (currentDate <= endDate) {
    timelineDates.push(new Date(currentDate))
    currentDate.setDate(currentDate.getDate() + 7)
  }

  const getTaskBarStyle = (task: Task) => {
    if (!task.dueDate) return { left: '0%', width: '0%' }
    
    const taskDue = new Date(task.dueDate)
    const taskStart = new Date(task.createdAt)
    
    // Calculate position and width
    const daysFromStart = Math.max(0, (taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const taskDuration = Math.max(1, (taskDue.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24))
    
    const left = (daysFromStart / totalDays) * 100
    const width = Math.min((taskDuration / totalDays) * 100, 100 - left)
    
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

  const getPriorityColor = (priority: number) => {
    switch (priority) {
      case 4: return 'border-l-red-600'
      case 3: return 'border-l-red-400'
      case 2: return 'border-l-yellow-400'
      default: return 'border-l-blue-400'
    }
  }

  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Gantt Chart</h3>
        
        <div className="overflow-x-auto">
          {/* Timeline Header */}
          <div className="flex items-center mb-4">
            <div className="w-64 flex-shrink-0"></div>
            <div className="flex-1 flex">
              {timelineDates.map((date, index) => (
                <div key={index} className="flex-1 text-center text-sm text-muted-foreground border-r last:border-r-0">
                  {date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                </div>
              ))}
            </div>
          </div>
          
          {/* Task Bars */}
          <div className="space-y-3">
            {tasksWithDates.map((task) => {
              const barStyle = getTaskBarStyle(task)
              const statusColor = getStatusColor(task)
              const priorityColor = getPriorityColor(task.priority)
              
              return (
                <div key={task.id} className="flex items-center">
                  {/* Task Info */}
                  <div className={`w-64 flex-shrink-0 pr-4 border-l-4 ${priorityColor}`}>
                    <div className="font-medium text-sm truncate">{task.title}</div>
                    <div className="text-xs text-muted-foreground">
                      {task.assigneeName && (
                        <span className="inline-block mr-2">{task.assigneeName}</span>
                      )}
                      Due: {new Date(task.dueDate!).toLocaleDateString()}
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

// Milestones View Component - Placeholder for now
function MilestonesView({ 
  milestones, 
  tasks, 
  expandedMilestone, 
  setExpandedMilestone 
}: { 
  milestones: Milestone[]
  tasks: Task[]
  expandedMilestone: number | null
  setExpandedMilestone: (id: number | null) => void
}) {
  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Project Milestones</h3>
        <p className="text-muted-foreground">Milestones view implementation coming soon...</p>
        <div className="mt-4 space-y-2">
          {milestones.map(milestone => (
            <div key={milestone.id} className="p-3 border rounded">
              <div className="font-medium">{milestone.title}</div>
              <div className="text-sm text-muted-foreground">
                {new Date(milestone.date).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

// Calendar View Component - Placeholder for now
function CalendarView({ tasks }: { tasks: Task[] }) {
  return (
    <Card className="bg-white dark:bg-gray-800">
      <CardContent className="p-6">
        <h3 className="text-lg font-medium mb-4">Calendar View</h3>
        <p className="text-muted-foreground">Calendar view implementation coming soon...</p>
        <div className="mt-4 space-y-2">
          {tasks.filter(task => task.dueDate).map(task => (
            <div key={task.id} className="p-3 border rounded">
              <div className="font-medium">{task.title}</div>
              <div className="text-sm text-muted-foreground">
                Due: {new Date(task.dueDate!).toLocaleDateString()}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
} 