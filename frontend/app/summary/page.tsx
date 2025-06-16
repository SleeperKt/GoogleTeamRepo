"use client"

import { useState } from "react"
import { CheckCircle2, FileText, MoreHorizontal, PlayCircle, Plus, Users, XCircle } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
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
import { CreateTaskSidebar } from "@/components/create-task-sidebar"

// Sample data
const projectData = {
  name: "TestProject-Dev",
  status: "Active",
  lastUpdated: "2 hours ago",
  metrics: {
    totalTasks: 48,
    completedTasks: 32,
    inProgressTasks: 12,
    overdueTasks: 4,
    teamMembers: 8,
  },
  progress: 72, // percentage
  startDate: "Jan 15, 2023",
  endDate: "Jun 30, 2023",
  team: [
    { name: "Alex Kim", initials: "AK", image: "/placeholder.svg?height=32&width=32" },
    { name: "Sarah Lee", initials: "SL", image: "/placeholder.svg?height=32&width=32" },
    { name: "Michael Johnson", initials: "MJ", image: "/placeholder.svg?height=32&width=32" },
    { name: "Jessica Taylor", initials: "JT", image: "/placeholder.svg?height=32&width=32" },
    { name: "David Miller", initials: "DM", image: "/placeholder.svg?height=32&width=32" },
    { name: "Emma Wilson", initials: "EW", image: "/placeholder.svg?height=32&width=32" },
    { name: "James Brown", initials: "JB", image: "/placeholder.svg?height=32&width=32" },
    { name: "Olivia Davis", initials: "OD", image: "/placeholder.svg?height=32&width=32" },
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
    {
      user: "Jessica Taylor",
      initials: "JT",
      image: "/placeholder.svg?height=32&width=32",
      action: "updated",
      item: "Project timeline",
      time: "Yesterday",
    },
    {
      user: "David Miller",
      initials: "DM",
      image: "/placeholder.svg?height=32&width=32",
      action: "assigned",
      item: "Bug fix for mobile navigation",
      time: "2 days ago",
    },
  ],
}

// Metric card data
const metricCards = [
  {
    label: "Total Tasks",
    value: projectData.metrics.totalTasks,
    icon: FileText,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    label: "Completed",
    value: projectData.metrics.completedTasks,
    icon: CheckCircle2,
    color: "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300",
  },
  {
    label: "In Progress",
    value: projectData.metrics.inProgressTasks,
    icon: PlayCircle,
    color: "bg-violet-50 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
  },
  {
    label: "Overdue",
    value: projectData.metrics.overdueTasks,
    icon: XCircle,
    color: "bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-300",
  },
  {
    label: "Team Members",
    value: projectData.metrics.teamMembers,
    icon: Users,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
  },
]

export default function SummaryPage() {
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false)
  const [createTaskOpen, setCreateTaskOpen] = useState(false)

  // Toggle for demo purposes
  const toggleEmptyState = () => {
    setShowEmptyState(!showEmptyState)
  }

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Summary</h1>
        <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
          <div className="flex items-center gap-2">
            <span className="font-medium">{projectData.name}</span>
            <Badge
              variant="outline"
              className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300 border-0"
            >
              {projectData.status}
            </Badge>
          </div>
          <span className="text-sm text-muted-foreground">Last updated {projectData.lastUpdated}</span>
        </div>
      </div>

      {/* Empty State */}
      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <FileText className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No summary data available</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Start by adding tasks or inviting team members to see project metrics and activity.
          </p>
          <div className="flex gap-3">
            <Button className="bg-violet-600 hover:bg-violet-700 text-white" onClick={() => setCreateTaskOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Tasks
            </Button>
            <Button variant="outline" onClick={() => setInviteDialogOpen(true)}>
              <Users className="mr-2 h-4 w-4" /> Invite Members
            </Button>
          </div>
        </div>
      ) : (
        <>
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
                      <span className="text-2xl font-bold">{projectData.progress}%</span>
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
                        strokeDasharray={`${projectData.progress * 2.51} 251.2`}
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
                        <span className="text-sm font-medium">{projectData.progress}%</span>
                      </div>
                      <Progress value={projectData.progress} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm text-muted-foreground">Start Date</div>
                        <div className="font-medium">{projectData.startDate}</div>
                      </div>
                      <div>
                        <div className="text-sm text-muted-foreground">End Date</div>
                        <div className="font-medium">{projectData.endDate}</div>
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
                <Button
                  variant="ghost"
                  size="sm"
                  className="text-violet-600 hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
                >
                  View All
                </Button>
              </div>
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-0">
                  <div className="divide-y divide-gray-100 dark:divide-gray-700">
                    {projectData.recentActivity.map((activity, index) => (
                      <div key={index} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-750">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={activity.image} alt={activity.user} />
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
                <Button variant="outline" size="sm" className="gap-1" onClick={() => setInviteDialogOpen(true)}>
                  <Plus className="h-4 w-4" /> Invite
                </Button>
              </div>
              <Card className="bg-white dark:bg-gray-800">
                <CardContent className="p-4">
                  <div className="flex flex-wrap gap-2">
                    <TooltipProvider>
                      {projectData.team.map((member, index) => (
                        <Tooltip key={index}>
                          <TooltipTrigger asChild>
                            <Avatar className="h-10 w-10 cursor-pointer hover:ring-2 hover:ring-violet-500 hover:ring-offset-2">
                              <AvatarImage src={member.image} alt={member.name} />
                              <AvatarFallback>{member.initials}</AvatarFallback>
                            </Avatar>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>{member.name}</p>
                          </TooltipContent>
                        </Tooltip>
                      ))}
                    </TooltipProvider>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </>
      )}

      {/* Demo Controls - Remove in production */}
      <div className="mt-8 pt-4 border-t">
        <Button variant="outline" onClick={toggleEmptyState} className="text-xs">
          Toggle Empty State (Demo)
        </Button>
      </div>

      {/* Invite Members Dialog */}
      <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Invite Team Members</DialogTitle>
            <DialogDescription>Send invitations to collaborate on this project.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email Address</Label>
              <Input id="email" placeholder="colleague@example.com" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Role</Label>
              <Select defaultValue="editor">
                <SelectTrigger id="role">
                  <SelectValue placeholder="Select a role" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin">Admin</SelectItem>
                  <SelectItem value="editor">Editor</SelectItem>
                  <SelectItem value="viewer">Viewer</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="message">Message (Optional)</Label>
              <Textarea id="message" placeholder="I'd like you to join our project..." rows={3} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              className="bg-violet-600 hover:bg-violet-700 text-white"
              onClick={() => {
                // In a real app, you would send the invitation here
                setInviteDialogOpen(false)
                // Show a success toast or notification
              }}
            >
              Send Invitation
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Task Sidebar */}
      <CreateTaskSidebar
        open={createTaskOpen}
        onOpenChange={setCreateTaskOpen}
        initialStage="To Do"
        onTaskCreated={(newTask) => {
          // Handle the new task (in a real app, you would add it to your tasks list)
          setShowEmptyState(false)
          // Show a success message or update the UI
        }}
      />
    </div>
  )
}
