"use client"

import type React from "react"

import { ArrowLeft, CheckCircle2, Edit, FileText, MoreHorizontal, PlayCircle, Users, XCircle } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
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

// Sample project data - in a real app, this would come from an API
const projectsData: Record<string, any> = {
  "testproject-dev": {
    id: 1,
    name: "TestProject-Dev",
    description: "Development project for the TestProject platform",
    status: "Active",
    lastUpdated: "2 hours ago",
    owner: "Alex Kim",
    initials: "AK",
    startDate: "January 15, 2023",
    endDate: "June 30, 2023",
    progress: 72,
    metrics: {
      totalTasks: 48,
      completedTasks: 32,
      inProgressTasks: 12,
      overdueTasks: 4,
      teamMembers: 8,
    },
    team: [
      { name: "Alex Kim", initials: "AK", image: "/placeholder.svg?height=32&width=32" },
      { name: "Sarah Lee", initials: "SL", image: "/placeholder.svg?height=32&width=32" },
      { name: "Michael Johnson", initials: "MJ", image: "/placeholder.svg?height=32&width=32" },
      { name: "Jessica Taylor", initials: "JT", image: "/placeholder.svg?height=32&width=32" },
      { name: "David Miller", initials: "DM", image: "/placeholder.svg?height=32&width=32" },
      { name: "Emma Wilson", initials: "EW", image: "/placeholder.svg?height=32&width=32" },
    ],
    recentActivity: [
      {
        user: "Sarah Lee",
        initials: "SL",
        image: "/placeholder.svg?height=32&width=32",
        action: "completed task",
        item: "Update user authentication flow",
        time: "10 minutes ago",
      },
      {
        user: "Michael Johnson",
        initials: "MJ",
        image: "/placeholder.svg?height=32&width=32",
        action: "commented on",
        item: "API Integration",
        time: "1 hour ago",
      },
      {
        user: "Alex Kim",
        initials: "AK",
        image: "/placeholder.svg?height=32&width=32",
        action: "created task",
        item: "Implement dark mode toggle",
        time: "3 hours ago",
      },
    ],
  },
  "marketing-website": {
    id: 2,
    name: "Marketing Website",
    description: "Company marketing website redesign",
    status: "On Hold",
    lastUpdated: "1 day ago",
    owner: "Sarah Lee",
    initials: "SL",
    startDate: "March 1, 2023",
    endDate: "August 15, 2023",
    progress: 45,
    metrics: {
      totalTasks: 32,
      completedTasks: 14,
      inProgressTasks: 8,
      overdueTasks: 2,
      teamMembers: 5,
    },
    team: [
      { name: "Sarah Lee", initials: "SL", image: "/placeholder.svg?height=32&width=32" },
      { name: "Jessica Taylor", initials: "JT", image: "/placeholder.svg?height=32&width=32" },
      { name: "David Miller", initials: "DM", image: "/placeholder.svg?height=32&width=32" },
    ],
    recentActivity: [
      {
        user: "Jessica Taylor",
        initials: "JT",
        image: "/placeholder.svg?height=32&width=32",
        action: "updated",
        item: "Homepage design mockup",
        time: "1 day ago",
      },
    ],
  },
}

// Status colors
const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "On Hold": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
}

// Metric card data
const getMetricCards = (metrics: any) => [
  {
    label: "Total Tasks",
    value: metrics.totalTasks,
    icon: FileText,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    label: "Completed",
    value: metrics.completedTasks,
    icon: CheckCircle2,
    color: "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300",
  },
  {
    label: "In Progress",
    value: metrics.inProgressTasks,
    icon: PlayCircle,
    color: "bg-violet-50 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
  },
  {
    label: "Overdue",
    value: metrics.overdueTasks,
    icon: XCircle,
    color: "bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-300",
  },
  {
    label: "Team Members",
    value: metrics.teamMembers,
    icon: Users,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
  },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const slug = params.slug as string

  const [project, setProject] = useState(projectsData[slug])
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)

  // If project not found, show 404
  if (!project) {
    return (
      <div className="p-4 md:p-6">
        <div className="mb-6">
          <Button variant="ghost" size="sm" asChild className="mb-4">
            <Link href="/projects">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to projects
            </Link>
          </Button>
        </div>
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/projects">View All Projects</Link>
          </Button>
        </div>
      </div>
    )
  }

  const metricCards = getMetricCards(project.metrics)

  const handleEditProject = (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const updatedProject = {
      ...project,
      name: formData.get("project-name") as string,
      description: formData.get("project-description") as string,
      status: formData.get("project-status") as string,
    }

    setProject(updatedProject)
    setEditDialogOpen(false)
  }

  const handleDeleteProject = () => {
    // In a real app, you would call an API to delete the project
    setDeleteDialogOpen(false)
    router.push("/projects")
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header Section */}
      <div className="mb-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to projects
          </Link>
        </Button>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold">{project.name}</h1>
              <Badge className={`${statusColors[project.status]} font-normal`}>{project.status}</Badge>
            </div>
            <p className="text-muted-foreground">{project.description}</p>
            <p className="text-sm text-muted-foreground mt-1">
              Last updated {project.lastUpdated} by {project.owner}
            </p>
          </div>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline">
                <MoreHorizontal className="mr-2 h-4 w-4" />
                Actions
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setEditDialogOpen(true)}>
                <Edit className="mr-2 h-4 w-4" />
                Edit Project
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setDeleteDialogOpen(true)} className="text-red-600 focus:text-red-600">
                <XCircle className="mr-2 h-4 w-4" />
                Delete Project
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Key Metrics</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 md:gap-6">
          {metricCards.map((card, index) => (
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

      {/* Project Progress */}
      <div className="mb-8">
        <h2 className="text-lg font-medium mb-4">Project Progress</h2>
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="flex flex-col md:flex-row md:items-center gap-6">
              <div className="relative w-32 h-32 mx-auto md:mx-0">
                <div className="absolute inset-0 flex items-center justify-center">
                  <span className="text-2xl font-bold">{project.progress}%</span>
                </div>
                <svg className="w-full h-full" viewBox="0 0 100 100">
                  <circle
                    className="text-gray-200 dark:text-gray-700"
                    strokeWidth="10"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                  <circle
                    className="text-violet-600 dark:text-violet-400"
                    strokeWidth="10"
                    strokeDasharray={`${project.progress * 2.51} 251.2`}
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="transparent"
                    r="40"
                    cx="50"
                    cy="50"
                  />
                </svg>
              </div>
              <div className="flex-1">
                <div className="mb-4">
                  <div className="flex justify-between mb-1">
                    <span className="text-sm font-medium">Overall Completion</span>
                    <span className="text-sm font-medium">{project.progress}%</span>
                  </div>
                  <Progress value={project.progress} className="h-2" />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Start Date</div>
                    <div className="font-medium">{project.startDate}</div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">End Date</div>
                    <div className="font-medium">{project.endDate}</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Activity */}
        <div className="lg:col-span-2">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Recent Activity</h2>
            <Button variant="ghost" size="sm" className="text-violet-600 hover:text-violet-700">
              View All
            </Button>
          </div>
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-0">
              <div className="divide-y divide-gray-100 dark:divide-gray-700">
                {project.recentActivity.map((activity: any, index: number) => (
                  <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={activity.image || "/placeholder.svg"} alt={activity.user} />
                        <AvatarFallback>{activity.initials}</AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <div>
                            <span className="font-medium">{activity.user}</span>
                            <span className="text-muted-foreground"> {activity.action} </span>
                            <span className="font-medium">{activity.item}</span>
                          </div>
                          <Button variant="ghost" size="icon" className="h-8 w-8">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </div>
                        <div className="text-sm text-muted-foreground">{activity.time}</div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Team Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-medium">Team</h2>
            <Button variant="outline" size="sm">
              Manage
            </Button>
          </div>
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-4">
              <div className="space-y-3">
                {project.team.map((member: any, index: number) => (
                  <div key={index} className="flex items-center gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarImage src={member.image || "/placeholder.svg"} alt={member.name} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <span className="font-medium">{member.name}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Edit Project Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update your project details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleEditProject}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input id="project-name" name="project-name" defaultValue={project.name} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  name="project-description"
                  defaultValue={project.description}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-status">Status</Label>
                <Select name="project-status" defaultValue={project.status}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Active">Active</SelectItem>
                    <SelectItem value="On Hold">On Hold</SelectItem>
                    <SelectItem value="Completed">Completed</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setEditDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Project Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project "{project.name}" and all of its
              data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteProject} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
