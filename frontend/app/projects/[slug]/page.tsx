"use client"

import type React from "react"

import { 
  ArrowLeft, 
  CheckCircle2, 
  Edit, 
  FileText, 
  MoreHorizontal, 
  PlayCircle, 
  Users, 
  XCircle, 
  LayoutGrid, 
  BarChart3,
  Calendar,
  Clock,
  Settings,
  Plus,
  TrendingUp,
  Activity,
  Star,
  Target,
  AlertCircle
} from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { API_BASE_URL } from "@/lib/api"
import { PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/lib/task-constants"

// Interface definitions
interface TeamMember {
  userId: string
  userName: string
  role: string
  joinedAt: string
  initials: string
  status?: string
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

interface RecentTask {
  id: number
  title: string
  status: number
  assigneeName?: string
  createdAt: string
  updatedAt: string
}

interface ProjectActivity {
  id: string
  type: string
  user: string
  action: string
  target: string
  timestamp: string
  icon: any
  color: string
}

// Helper functions for status and priority
const getStatusLabel = (status: number): string => {
  const statusItem = PROJECT_STATUSES.find(s => s.value === status)
  return statusItem?.label || "Unknown"
}

const getPriorityLabel = (priority: number): string => {
  const priorityItem = PROJECT_PRIORITIES.find(p => p.value === priority)
  return priorityItem?.label || "Unknown"
}

const getPriorityColor = (priority: number): string => {
  const priorityItem = PROJECT_PRIORITIES.find(p => p.value === priority)
  if (!priorityItem) return "text-gray-500"
  
  switch (priorityItem.label) {
    case "Low": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    case "Medium": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300"
    case "High": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300"
    case "Critical": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300"
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

const getStatusColor = (status: number): string => {
  const statusItem = PROJECT_STATUSES.find(s => s.value === status)
  if (!statusItem) return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  
  switch (statusItem.label) {
    case "Active": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300"
    case "On Hold": return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
    case "Completed": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300"
    default: return "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300"
  }
}

// Task status mapping
const TaskStatusMap: Record<number, string> = {
  0: "To Do",
  1: "In Progress", 
  2: "In Review",
  3: "Done",
  4: "Cancelled"
}

// Metric card data - removed hardcoded change percentages since we don't have historical data
const getMetricCards = (statistics: TaskStatistics | null, teamMembersCount: number) => [
  {
    label: "Total Tasks",
    value: statistics?.taskCounts.total || 0,
    icon: FileText,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    label: "Completed",
    value: statistics?.taskCounts.done || 0,
    icon: CheckCircle2,
    color: "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300",
  },
  {
    label: "In Progress",
    value: statistics?.taskCounts.inProgress || 0,
    icon: PlayCircle,
    color: "bg-violet-50 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
  },
  {
    label: "Team Members",
    value: teamMembersCount,
    icon: Users,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
  },
]

// Generate activity from recent tasks
const generateActivityFromTasks = (tasks: RecentTask[]): ProjectActivity[] => {
  const activities: ProjectActivity[] = []
  
  tasks.slice(0, 10).forEach((task, index) => {
    const isRecent = new Date(task.updatedAt) > new Date(Date.now() - 24 * 60 * 60 * 1000)
    const timeDiff = Date.now() - new Date(task.updatedAt).getTime()
    let timeAgo = ""
    
    if (timeDiff < 60 * 60 * 1000) {
      timeAgo = `${Math.floor(timeDiff / (60 * 1000))} minutes ago`
    } else if (timeDiff < 24 * 60 * 60 * 1000) {
      timeAgo = `${Math.floor(timeDiff / (60 * 60 * 1000))} hours ago`
    } else {
      timeAgo = `${Math.floor(timeDiff / (24 * 60 * 60 * 1000))} days ago`
    }

    let action = "updated"
    let icon = Edit
    let color = "text-blue-600"

    if (task.status === 3) { // Done
      action = "completed"
      icon = CheckCircle2
      color = "text-green-600"
    } else if (task.status === 1) { // In Progress
      action = "started work on"
      icon = PlayCircle
      color = "text-violet-600"
    }

    activities.push({
      id: `task-${task.id}`,
      type: "task_update",
      user: task.assigneeName || "Someone",
      action,
      target: task.title,
      timestamp: timeAgo,
      icon,
      color
    })
  })

  return activities
}

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const publicId = params.slug as string

  const [project, setProject] = useState<any | null>(null)
  const [statistics, setStatistics] = useState<TaskStatistics | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [recentTasks, setRecentTasks] = useState<RecentTask[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchProjectData = async () => {
      if (!token) {
        setLoading(false)
        return
      }

      try {
        setLoading(true)
        setError(null)

        // 1. Fetch basic project data
        const projectRes = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })

        if (!projectRes.ok) {
          setProject(null)
          setLoading(false)
          return
        }

        const projectData = await projectRes.json()
        
        // 2. Fetch additional data in parallel
        const [statisticsRes, participantsRes, tasksRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/tasks/statistics/${projectData.id}`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/projects/${projectData.id}/participants`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${API_BASE_URL}/api/projects/public/${publicId}/tasks?pageSize=20`, {
            headers: { Authorization: `Bearer ${token}` },
          })
        ])

                 // Process statistics
         let statsData: TaskStatistics | null = null
         if (statisticsRes.ok) {
           statsData = await statisticsRes.json()
           setStatistics(statsData)
         }

         // Process team members
         if (participantsRes.ok) {
           const participantsData = await participantsRes.json()
           console.log('Participants data:', participantsData)
           
           // Handle different response formats
           let participantsArray: any[] = []
           if (Array.isArray(participantsData)) {
             participantsArray = participantsData
           } else if (participantsData && Array.isArray(participantsData.$values)) {
             participantsArray = participantsData.$values
           }

           const members: TeamMember[] = participantsArray.map((participant) => ({
             userId: participant.userId || participant.UserId,
             userName: participant.userName || participant.UserName,
             role: participant.role || participant.Role,
             joinedAt: participant.joinedAt || participant.JoinedAt,
             initials: (participant.userName || participant.UserName || "")
               .split(" ")
               .map((n: string) => n[0])
               .join("")
               .toUpperCase(),
             status: "online" // Default status since we don't have real-time presence
           }))

           setTeamMembers(members)
         }

         // Process recent tasks
         if (tasksRes.ok) {
           const tasksData = await tasksRes.json()
           console.log('Tasks data:', tasksData)
           
           // Handle different response formats
           let tasksArray: any[] = []
           if (Array.isArray(tasksData)) {
             tasksArray = tasksData
           } else if (tasksData && Array.isArray(tasksData.tasks)) {
             tasksArray = tasksData.tasks
           } else if (tasksData && Array.isArray(tasksData.data)) {
             tasksArray = tasksData.data
           } else if (tasksData && Array.isArray(tasksData.$values)) {
             tasksArray = tasksData.$values
           }

           const tasks: RecentTask[] = tasksArray.map((task) => ({
             id: task.id,
             title: task.title,
             status: task.status,
             assigneeName: task.assigneeName,
             createdAt: task.createdAt,
             updatedAt: task.updatedAt
           }))

           // Sort by most recently updated
           tasks.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
           
           setRecentTasks(tasks)
         }

         // Calculate completion percentage based on the statistics we just fetched
         let completionPercentage = 0
         if (statsData && statsData.taskCounts.total > 0) {
           completionPercentage = Math.round((statsData.taskCounts.done / statsData.taskCounts.total) * 100)
         }

         // Set enhanced project data - use real backend data
         const enhancedProject = {
           ...projectData,
           // Use real status and priority from backend, with fallbacks
           status: projectData.status || 1, // Default to Active if not set
           priority: projectData.priority || 2, // Default to Medium if not set
           lastUpdated: new Date(projectData.updatedAt || projectData.createdAt).toLocaleString(),
           initials: projectData.name.slice(0, 2).toUpperCase(),
           progress: completionPercentage,
           startDate: new Date(projectData.createdAt).toLocaleDateString(),
           // Use project's endDate if available, otherwise show as ongoing
           endDate: projectData.endDate ? new Date(projectData.endDate).toLocaleDateString() : "Ongoing"
         }

         setProject(enhancedProject)

      } catch (err) {
        console.error('Error fetching project data:', err)
        setError(err instanceof Error ? err.message : 'Failed to fetch project data')
        setProject(null)
      } finally {
        setLoading(false)
      }
    }

    fetchProjectData()
  }, [token, publicId])

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <div className="animate-pulse">
            <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (error || !project) {
    return (
      <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
        <div className="container mx-auto px-4 py-8">
          <Button variant="ghost" size="sm" asChild className="mb-6">
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to projects
            </Link>
          </Button>
          
          <div className="text-center mt-20">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
              {error ? (
                <AlertCircle className="w-10 h-10 text-red-400" />
              ) : (
                <FileText className="w-10 h-10 text-gray-400" />
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">
              {error ? 'Error Loading Project' : 'Project Not Found'}
            </h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              {error || "The project you're looking for doesn't exist or you don't have permission to view it."}
            </p>
            <Button asChild size="lg">
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                View All Projects
              </Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  const metricCards = getMetricCards(statistics, teamMembers.length)
  const projectActivity = generateActivityFromTasks(recentTasks)

  return (
    <div className="min-h-screen bg-gradient-to-b from-violet-50 to-white">
      <div className="container mx-auto px-4 py-8">
        {/* Navigation */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center space-x-4">
            <Button variant="ghost" size="sm" asChild>
              <Link href="/projects">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to projects
              </Link>
            </Button>
            <div className="h-6 w-px bg-gray-300"></div>
            <div className="text-sm text-gray-500">
              Projects / <span className="text-gray-900 font-medium">{project.name}</span>
            </div>
          </div>
          
          <div className="flex items-center space-x-3">
            <Button variant="outline" size="sm">
              <Star className="mr-2 h-4 w-4" />
              Star
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem>
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href={`/projects/${publicId}/settings`}>
                    <Settings className="mr-2 h-4 w-4" />
                    Settings
                  </Link>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Header */}
        <div className="mb-8">
          <div className="flex items-start justify-between mb-4">
            <div className="flex-1">
              <h1 className="text-4xl font-bold text-gray-900 mb-3">{project.name}</h1>
              <p className="text-lg text-gray-600 mb-4 max-w-3xl">{project.description}</p>
              
              <div className="flex items-center space-x-6 mb-6">
                <div className="flex items-center space-x-2">
                  <Badge className={getStatusColor(project.status)}>
                    {getStatusLabel(project.status)}
                  </Badge>
                                      <Badge className={getPriorityColor(project.priority)}>
                     {getPriorityLabel(project.priority)} Priority
                   </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {project.startDate} - {project.endDate}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    Updated {new Date(project.updatedAt || project.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700">Overall Progress</span>
                  <span className="text-sm text-gray-500">{project.progress}%</span>
                </div>
                <Progress value={project.progress} className="h-2" />
              </div>
            </div>

            <div className="flex items-center space-x-3 ml-8">
              <Button variant="outline" asChild>
                <Link href={`/projects/${publicId}/reports`}>
                  <BarChart3 className="mr-2 h-4 w-4" />
                  Reports
                </Link>
              </Button>
              <Button asChild>
                <Link href={`/projects/${publicId}/board`}>
                  <LayoutGrid className="mr-2 h-4 w-4" />
                  View Board
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="mb-8">
          <TabsList className="bg-white border">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="team">Team ({teamMembers.length})</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="space-y-8">
            {/* Metrics Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {metricCards.map((card, index) => (
                <Card key={index} className="bg-white border shadow-sm hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-600 mb-1">{card.label}</p>
                        <p className="text-3xl font-bold text-gray-900">{card.value}</p>
                      </div>
                      <div className={`p-3 rounded-lg ${card.color}`}>
                        <card.icon className="h-6 w-6" />
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Quick Actions */}
            <Card className="bg-white border shadow-sm">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Target className="mr-2 h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Common tasks and shortcuts for this project
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start" asChild>
                    <Link href={`/projects/${publicId}/board`}>
                      <LayoutGrid className="h-5 w-5 mb-2" />
                      <span className="font-medium">Manage Tasks</span>
                      <span className="text-xs text-gray-500">View and update project board</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start" asChild>
                    <Link href={`/projects/${publicId}/reports`}>
                      <BarChart3 className="h-5 w-5 mb-2" />
                      <span className="font-medium">View Reports</span>
                      <span className="text-xs text-gray-500">Analyze project progress</span>
                    </Link>
                  </Button>
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start" asChild>
                    <Link href={`/projects/${publicId}/settings`}>
                      <Settings className="h-5 w-5 mb-2" />
                      <span className="font-medium">Project Settings</span>
                      <span className="text-xs text-gray-500">Configure project options</span>
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Team Tab */}
        {activeTab === "team" && (
          <Card className="bg-white border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <div className="flex items-center">
                  <Users className="mr-2 h-5 w-5" />
                  Team Members ({teamMembers.length})
                </div>
                <Button size="sm">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Member
                </Button>
              </CardTitle>
              <CardDescription>
                Manage team members and their roles in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {teamMembers.length > 0 ? (
                <div className="space-y-4">
                  {teamMembers.map((member) => (
                    <div key={member.userId} className="flex items-center justify-between p-4 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Avatar>
                          <AvatarImage src="" alt={member.userName} />
                          <AvatarFallback className="bg-violet-100 text-violet-600">
                            {member.initials}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <p className="font-medium text-gray-900">{member.userName}</p>
                          <p className="text-sm text-gray-500">Joined {new Date(member.joinedAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge variant="outline">{member.role}</Badge>
                        <div className={`w-2 h-2 rounded-full ${
                          member.status === 'online' ? 'bg-green-500' : 'bg-gray-400'
                        }`}></div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Users className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No team members found</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Activity Tab */}
        {activeTab === "activity" && (
          <Card className="bg-white border shadow-sm">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Activity className="mr-2 h-5 w-5" />
                Recent Activity
              </CardTitle>
              <CardDescription>
                Latest updates and changes in this project
              </CardDescription>
            </CardHeader>
            <CardContent>
              {projectActivity.length > 0 ? (
                <div className="space-y-4">
                  {projectActivity.map((activity) => (
                    <div key={activity.id} className="flex items-start space-x-3 p-3 hover:bg-gray-50 rounded-lg">
                      <div className={`p-2 rounded-full bg-gray-100 ${activity.color}`}>
                        <activity.icon className="h-4 w-4" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm">
                          <span className="font-medium text-gray-900">{activity.user}</span>
                          <span className="text-gray-600"> {activity.action} </span>
                          <span className="font-medium text-gray-900">{activity.target}</span>
                        </p>
                        <p className="text-xs text-gray-500 mt-1">{activity.timestamp}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Activity className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No recent activity</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
