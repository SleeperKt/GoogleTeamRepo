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
  Target
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

// Status colors
const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "On Hold": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
}

// Priority colors
const priorityColors: Record<string, string> = {
  High: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  Medium: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300",
  Low: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
}

// Sample team members data (replace with API data)
const sampleTeamMembers = [
  {
    id: 1,
    name: "Alex Johnson",
    email: "alex@example.com",
    role: "Project Manager",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "AJ",
    status: "online"
  },
  {
    id: 2,
    name: "Sarah Chen",
    email: "sarah@example.com",
    role: "Developer",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "SC",
    status: "away"
  },
  {
    id: 3,
    name: "Mike Rodriguez",
    email: "mike@example.com",
    role: "Designer",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "MR",
    status: "online"
  }
]

// Sample activity data (replace with API data)
const sampleActivity = [
  {
    id: 1,
    type: "task_completed",
    user: "Sarah Chen",
    action: "completed task",
    target: "Update user authentication",
    timestamp: "2 hours ago",
    icon: CheckCircle2,
    color: "text-green-600"
  },
  {
    id: 2,
    type: "task_created",
    user: "Alex Johnson",
    action: "created new task",
    target: "Design review meeting",
    timestamp: "4 hours ago",
    icon: Plus,
    color: "text-blue-600"
  },
  {
    id: 3,
    type: "comment",
    user: "Mike Rodriguez",
    action: "commented on",
    target: "Frontend improvements",
    timestamp: "1 day ago",
    icon: Activity,
    color: "text-purple-600"
  }
]

// Metric card data
const getMetricCards = (metrics: any) => [
  {
    label: "Total Tasks",
    value: metrics.totalTasks || 0,
    icon: FileText,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
    change: "+12%"
  },
  {
    label: "Completed",
    value: metrics.completedTasks || 0,
    icon: CheckCircle2,
    color: "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300",
    change: "+5%"
  },
  {
    label: "In Progress",
    value: metrics.inProgressTasks || 0,
    icon: PlayCircle,
    color: "bg-violet-50 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
    change: "-2%"
  },
  {
    label: "Team Members",
    value: metrics.teamMembers || sampleTeamMembers.length,
    icon: Users,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
    change: "0%"
  },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const publicId = params.slug as string

  const [project, setProject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    const fetchProject = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          // convert to shape expected by UI, add placeholder metrics
          const adapted = {
            ...data,
            status: "Active",
            priority: "High",
            lastUpdated: new Date(data.createdAt).toLocaleString(),
            owner: "Me",
            initials: data.name.slice(0, 2).toUpperCase(),
            progress: 67, // Sample progress
            metrics: { 
              totalTasks: 24, 
              completedTasks: 16, 
              inProgressTasks: 6, 
              overdueTasks: 2, 
              teamMembers: sampleTeamMembers.length 
            },
            team: sampleTeamMembers,
            recentActivity: sampleActivity,
            startDate: "2024-01-15",
            endDate: "2024-06-30"
          }
          setProject(adapted)
        } else {
          setProject(null)
        }
      } catch (err) {
        console.error(err)
        setProject(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
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

  if (!project) {
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
              <FileText className="w-10 h-10 text-gray-400" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 mb-4">Project Not Found</h1>
            <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
              The project you're looking for doesn't exist or you don't have permission to view it.
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

  const metricCards = getMetricCards(project.metrics)

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
                <DropdownMenuItem>
                  <Settings className="mr-2 h-4 w-4" />
                  Settings
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
                  <Badge className={statusColors[project.status] ?? ""}>
                    {project.status}
                  </Badge>
                  <Badge className={priorityColors[project.priority] ?? ""}>
                    {project.priority} Priority
                  </Badge>
                </div>
                
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="mr-1 h-4 w-4" />
                    {project.startDate} - {project.endDate}
                  </div>
                  <div className="flex items-center">
                    <Clock className="mr-1 h-4 w-4" />
                    Updated {new Date(project.createdAt).toLocaleDateString()}
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
            <TabsTrigger value="team">Team</TabsTrigger>
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
                        <div className="flex items-center mt-2">
                          <TrendingUp className="h-3 w-3 text-green-500 mr-1" />
                          <span className="text-xs text-green-600 font-medium">{card.change}</span>
                          <span className="text-xs text-gray-500 ml-1">vs last month</span>
                        </div>
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
                  
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-start">
                    <Settings className="h-5 w-5 mb-2" />
                    <span className="font-medium">Project Settings</span>
                    <span className="text-xs text-gray-500">Configure project options</span>
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
                  Team Members ({sampleTeamMembers.length})
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
              <div className="space-y-4">
                {sampleTeamMembers.map((member) => (
                  <div key={member.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <Avatar>
                        <AvatarImage src={member.avatar} alt={member.name} />
                        <AvatarFallback className="bg-violet-100 text-violet-600">
                          {member.initials}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-medium text-gray-900">{member.name}</p>
                        <p className="text-sm text-gray-500">{member.email}</p>
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
              <div className="space-y-4">
                {sampleActivity.map((activity, index) => (
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
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
