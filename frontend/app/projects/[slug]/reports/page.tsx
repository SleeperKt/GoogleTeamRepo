"use client"

import { useState, useEffect } from "react"
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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { API_BASE_URL } from "@/lib/api"
import Link from "next/link"

interface ProjectData {
  id: number
  name: string
  description: string
  createdAt: string
  publicId: string
}

interface TaskStatistics {
  projectId: number
  taskCounts: {
    todo: number
    inProgress: number
    inReview: number
    done: number
    cancelled: number
    total: number
  }
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
}

interface Participant {
  userId: string
  userName: string
  role: string
  joinedAt: string
}

// Status mapping
const TaskStatus = {
  0: "To Do",
  1: "In Progress", 
  2: "In Review",
  3: "Done",
  4: "Cancelled"
}

export default function ProjectReportsPage() {
  const params = useParams()
  const { token } = useAuth()
  const publicId = params.slug as string

  const [project, setProject] = useState<ProjectData | null>(null)
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [participants, setParticipants] = useState<Participant[]>([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState("overview")
  const [dateRange, setDateRange] = useState("last30days")

  const fetchData = async () => {
    if (!token) {
      setLoading(false)
      return
    }

    try {
      const projectRes = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!projectRes.ok) {
        setLoading(false)
        return
      }

      const projectData = await projectRes.json()
      setProject(projectData)

      const [statsRes, tasksRes, participantsRes] = await Promise.all([
        fetch(`${API_BASE_URL}/api/tasks/statistics/${projectData.id}`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/projects/public/${publicId}/tasks`, {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch(`${API_BASE_URL}/api/projects/${projectData.id}/participants`, {
          headers: { Authorization: `Bearer ${token}` },
        })
      ])
      
      if (statsRes.ok) {
        const statsData = await statsRes.json()
        setStatistics(statsData)
      }

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
        
        setTasks(tasksArray)
      }

      if (participantsRes.ok) {
        const participantsData = await participantsRes.json()
        console.log('Participants API response:', participantsData)
        
        // Handle different response structures for participants
        let participantsArray: Participant[] = []
        if (Array.isArray(participantsData)) {
          participantsArray = participantsData
        } else if (participantsData && Array.isArray(participantsData.data)) {
          participantsArray = participantsData.data
        } else {
          console.warn('Unexpected participants data structure:', participantsData)
          participantsArray = []
        }
        
        setParticipants(participantsArray)
      }

    } catch (error) {
      console.error('Error fetching project data:', error)
      // Set safe defaults on error to prevent crashes
      setTasks([])
      setParticipants([])
      setStatistics(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token, publicId])

  const getSummaryCards = () => {
    if (!statistics) return []
    
    return [
      {
        label: "Total Tasks",
        value: statistics.taskCounts.total,
        icon: BarChart3,
        color: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
      },
      {
        label: "Completed",
        value: statistics.taskCounts.done,
        icon: CheckCircle2,
        color: "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300",
      },
      {
        label: "In Progress",
        value: statistics.taskCounts.inProgress,
        icon: PlayCircle,
        color: "bg-violet-50 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
      },
      {
        label: "In Review",
        value: statistics.taskCounts.inReview,
        icon: Clock,
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
    if (!statistics) return []
    
    return [
      { status: "To Do", count: statistics.taskCounts.todo, color: "#e2e8f0" },
      { status: "In Progress", count: statistics.taskCounts.inProgress, color: "#93c5fd" },
      { status: "In Review", count: statistics.taskCounts.inReview, color: "#c4b5fd" },
      { status: "Done", count: statistics.taskCounts.done, color: "#86efac" },
    ]
  }

  if (loading) {
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

  const showEmptyState = !statistics || statistics.taskCounts.total === 0

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
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-2 h-4 w-4" />
              Export
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
            Start by creating tasks or assigning team members to generate reports and analytics.
          </p>
          <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white">
            <Link href={`/projects/${publicId}/board`}>
              <Plus className="mr-2 h-4 w-4" /> Create Task
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Filters and Controls */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
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
                  <SelectItem value="custom">Custom Range</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem>All Task Types</DropdownMenuItem>
                  <DropdownMenuItem>Features Only</DropdownMenuItem>
                  <DropdownMenuItem>Bugs Only</DropdownMenuItem>
                  <DropdownMenuItem>By Assignee</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1">
                <X className="h-3.5 w-3.5" />
                <span>Clear Filters</span>
              </Button>
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
            {/* Task Status Distribution */}
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
                    participants.map((participant, index) => (
                      <div key={index} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8">
                            <AvatarFallback>
                              {participant.userName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <span className="text-sm font-medium">{participant.userName}</span>
                            <div className="text-xs text-muted-foreground">{participant.role}</div>
                          </div>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          Joined {new Date(participant.joinedAt).toLocaleDateString()}
                        </div>
                      </div>
                    ))
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
                {Array.isArray(tasks) && tasks.slice(0, 5).map((task, index) => (
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
                      <div className={`px-2 py-1 rounded-full text-xs font-medium ${
                        task.status === 3 ? 'bg-green-100 text-green-800' :
                        task.status === 1 ? 'bg-blue-100 text-blue-800' :
                        task.status === 2 ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {TaskStatus[task.status as keyof typeof TaskStatus]}
                      </div>
                      {task.assigneeName && (
                        <Avatar className="h-6 w-6">
                          <AvatarFallback className="text-xs">
                            {task.assigneeName.slice(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                      )}
                    </div>
                  </div>
                ))}
                
                {(!Array.isArray(tasks) || tasks.length === 0) && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No tasks found
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