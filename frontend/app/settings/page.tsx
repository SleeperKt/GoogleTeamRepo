"use client"

import type React from "react"

import { useState } from "react"
import {
  AlertCircle,
  ArrowRight,
  Calendar,
  Check,
  Edit,
  GripVertical,
  Info,
  Loader2,
  MoreHorizontal,
  Plus,
  Trash,
  X,
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { cn } from "@/lib/utils"

// Update the project name and description in the sample data
const projectData = {
  name: "TestProject-Dev",
  description: "Development project for the TestProject platform",
  defaultStatus: "To Do",
  startDate: "2023-05-01",
  endDate: "2023-08-31",
  timezone: "America/New_York",
  lastUpdated: "2 minutes ago",
  members: [
    {
      id: 1,
      name: "Alex Kim",
      email: "alex@example.com",
      role: "Admin",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "AK",
    },
    {
      id: 2,
      name: "Sarah Lee",
      email: "sarah@example.com",
      role: "Editor",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "SL",
    },
    {
      id: 3,
      name: "Michael Johnson",
      email: "michael@example.com",
      role: "Editor",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "MJ",
    },
    {
      id: 4,
      name: "Jessica Taylor",
      email: "jessica@example.com",
      role: "Viewer",
      avatar: "/placeholder.svg?height=32&width=32",
      initials: "JT",
    },
  ],
  pendingInvites: [
    {
      email: "david@example.com",
      role: "Editor",
      sentAt: "1 day ago",
    },
  ],
  labels: [
    { id: 1, name: "Frontend", color: "#93c5fd" },
    { id: 2, name: "Backend", color: "#86efac" },
    { id: 3, name: "Bug", color: "#fca5a5" },
    { id: 4, name: "Feature", color: "#c4b5fd" },
    { id: 5, name: "Documentation", color: "#fcd34d" },
  ],
  workflow: [
    { id: 1, name: "To Do", tasks: 4 },
    { id: 2, name: "In Progress", tasks: 12 },
    { id: 3, name: "Review", tasks: 8 },
    { id: 4, name: "Done", tasks: 24 },
  ],
  integrations: [
    {
      id: 1,
      name: "GitHub",
      logo: "/placeholder.svg?height=40&width=40",
      status: "connected",
      details: "Connected to GuildTorch/frontend repository",
    },
    {
      id: 2,
      name: "Slack",
      logo: "/placeholder.svg?height=40&width=40",
      status: "connected",
      details: "Connected to #project-updates channel",
    },
    {
      id: 3,
      name: "Figma",
      logo: "/placeholder.svg?height=40&width=40",
      status: "disconnected",
      details: null,
    },
  ],
}

// Role options
const roleOptions = [
  { value: "Admin", label: "Admin" },
  { value: "Editor", label: "Editor" },
  { value: "Viewer", label: "Viewer" },
]

// Timezone options (abbreviated list)
const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
]

// Predefined colors for labels
const labelColors = [
  "#93c5fd", // blue
  "#86efac", // green
  "#fca5a5", // red
  "#c4b5fd", // purple
  "#fcd34d", // yellow
  "#fdba74", // orange
  "#f9a8d4", // pink
  "#a5b4fc", // indigo
  "#d1d5db", // gray
]

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("general")
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingLabel, setEditingLabel] = useState<number | null>(null)
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState(labelColors[0])
  const [projectSettings, setProjectSettings] = useState(projectData)
  const [draggedWorkflowId, setDraggedWorkflowId] = useState<number | null>(null)
  const [showEmptyState, setShowEmptyState] = useState(false)

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    setProjectSettings({
      ...projectSettings,
      [field]: value,
    })

    // Simulate saving
    simulateSave()
  }

  // Simulate saving with a delay
  const simulateSave = () => {
    setIsSaving(true)
    setTimeout(() => {
      setIsSaving(false)
    }, 1000)
  }

  // Handle member role change
  const handleRoleChange = (memberId: number, newRole: string) => {
    const updatedMembers = projectSettings.members.map((member) =>
      member.id === memberId ? { ...member, role: newRole } : member,
    )

    setProjectSettings({
      ...projectSettings,
      members: updatedMembers,
    })

    simulateSave()
  }

  // Handle member removal
  const handleRemoveMember = (memberId: number) => {
    const updatedMembers = projectSettings.members.filter((member) => member.id !== memberId)

    setProjectSettings({
      ...projectSettings,
      members: updatedMembers,
    })

    simulateSave()
  }

  // Handle invite member
  const handleInviteMember = (email: string, role: string) => {
    const newInvite = {
      email,
      role,
      sentAt: "Just now",
    }

    setProjectSettings({
      ...projectSettings,
      pendingInvites: [...projectSettings.pendingInvites, newInvite],
    })

    simulateSave()
  }

  // Handle cancel invite
  const handleCancelInvite = (email: string) => {
    const updatedInvites = projectSettings.pendingInvites.filter((invite) => invite.email !== email)

    setProjectSettings({
      ...projectSettings,
      pendingInvites: updatedInvites,
    })

    simulateSave()
  }

  // Handle add label
  const handleAddLabel = () => {
    if (!newLabelName.trim()) return

    const newLabel = {
      id: Math.max(0, ...projectSettings.labels.map((l) => l.id)) + 1,
      name: newLabelName,
      color: newLabelColor,
    }

    setProjectSettings({
      ...projectSettings,
      labels: [...projectSettings.labels, newLabel],
    })

    setNewLabelName("")
    simulateSave()
  }

  // Handle update label
  const handleUpdateLabel = (labelId: number, name: string, color: string) => {
    const updatedLabels = projectSettings.labels.map((label) =>
      label.id === labelId ? { ...label, name, color } : label,
    )

    setProjectSettings({
      ...projectSettings,
      labels: updatedLabels,
    })

    setEditingLabel(null)
    simulateSave()
  }

  // Handle delete label
  const handleDeleteLabel = (labelId: number) => {
    const updatedLabels = projectSettings.labels.filter((label) => label.id !== labelId)

    setProjectSettings({
      ...projectSettings,
      labels: updatedLabels,
    })

    simulateSave()
  }

  // Handle workflow drag start
  const handleWorkflowDragStart = (e: React.DragEvent, id: number) => {
    setDraggedWorkflowId(id)
  }

  // Handle workflow drag over
  const handleWorkflowDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle workflow drop
  const handleWorkflowDrop = (e: React.DragEvent, targetId: number) => {
    e.preventDefault()

    if (draggedWorkflowId === null || draggedWorkflowId === targetId) return

    const sourceIndex = projectSettings.workflow.findIndex((item) => item.id === draggedWorkflowId)
    const targetIndex = projectSettings.workflow.findIndex((item) => item.id === targetId)

    if (sourceIndex === -1 || targetIndex === -1) return

    const newWorkflow = [...projectSettings.workflow]
    const [movedItem] = newWorkflow.splice(sourceIndex, 1)
    newWorkflow.splice(targetIndex, 0, movedItem)

    setProjectSettings({
      ...projectSettings,
      workflow: newWorkflow,
    })

    setDraggedWorkflowId(null)
    simulateSave()
  }

  // Handle add workflow stage
  const handleAddWorkflowStage = (name: string) => {
    const newStage = {
      id: Math.max(0, ...projectSettings.workflow.map((w) => w.id)) + 1,
      name,
      tasks: 0,
    }

    setProjectSettings({
      ...projectSettings,
      workflow: [...projectSettings.workflow, newStage],
    })

    simulateSave()
  }

  // Handle rename workflow stage
  const handleRenameWorkflowStage = (id: number, newName: string) => {
    const updatedWorkflow = projectSettings.workflow.map((stage) =>
      stage.id === id ? { ...stage, name: newName } : stage,
    )

    setProjectSettings({
      ...projectSettings,
      workflow: updatedWorkflow,
    })

    simulateSave()
  }

  // Handle delete workflow stage
  const handleDeleteWorkflowStage = (id: number) => {
    const updatedWorkflow = projectSettings.workflow.filter((stage) => stage.id !== id)

    setProjectSettings({
      ...projectSettings,
      workflow: updatedWorkflow,
    })

    simulateSave()
  }

  // Handle toggle integration
  const handleToggleIntegration = (id: number) => {
    const updatedIntegrations = projectSettings.integrations.map((integration) =>
      integration.id === id
        ? {
            ...integration,
            status: integration.status === "connected" ? "disconnected" : "connected",
            details: integration.status === "connected" ? null : `Connected to ${integration.name}`,
          }
        : integration,
    )

    setProjectSettings({
      ...projectSettings,
      integrations: updatedIntegrations,
    })

    simulateSave()
  }

  // Toggle empty state for demo
  const toggleEmptyState = () => {
    setShowEmptyState(!showEmptyState)
  }

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
        <div className="flex items-center gap-2">
          <span className="font-medium">{projectSettings.name}</span>
          {isSaving ? (
            <span className="text-sm text-muted-foreground flex items-center">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Saving changes...
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Changes saved automatically</span>
          )}
        </div>
      </div>

      {/* Empty State */}
      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <Cog className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">Project settings unavailable</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            You don't have permission to view or edit project settings. Please contact a project administrator.
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <ArrowRight className="mr-2 h-4 w-4" /> Return to Project
          </Button>
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-6">
          {/* Settings Navigation */}
          <div className="w-full md:w-64 flex-shrink-0">
            <Card>
              <CardContent className="p-0">
                <Tabs orientation="vertical" value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <TabsList className="flex flex-col h-auto w-full rounded-none bg-transparent p-0">
                    <TabsTrigger
                      value="general"
                      className="justify-start rounded-none border-l-2 border-transparent px-4 py-3 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600 dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
                    >
                      General
                    </TabsTrigger>
                    <TabsTrigger
                      value="members"
                      className="justify-start rounded-none border-l-2 border-transparent px-4 py-3 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600 dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
                    >
                      Members & Access
                    </TabsTrigger>
                    <TabsTrigger
                      value="labels"
                      className="justify-start rounded-none border-l-2 border-transparent px-4 py-3 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600 dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
                    >
                      Tags & Labels
                    </TabsTrigger>
                    <TabsTrigger
                      value="workflow"
                      className="justify-start rounded-none border-l-2 border-transparent px-4 py-3 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600 dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
                    >
                      Workflow
                    </TabsTrigger>
                    <TabsTrigger
                      value="integrations"
                      className="justify-start rounded-none border-l-2 border-transparent px-4 py-3 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600 dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
                    >
                      Integrations
                    </TabsTrigger>
                    <TabsTrigger
                      value="danger"
                      className="justify-start rounded-none border-l-2 border-transparent px-4 py-3 text-red-600 data-[state=active]:border-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-600 dark:text-red-400 dark:data-[state=active]:bg-red-950 dark:data-[state=active]:text-red-400"
                    >
                      Danger Zone
                    </TabsTrigger>
                  </TabsList>
                </Tabs>
              </CardContent>
            </Card>
          </div>

          {/* Settings Content */}
          <div className="flex-1">
            {/* General Settings */}
            {activeTab === "general" && (
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure basic project information and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="space-y-2">
                    <Label htmlFor="project-name">Project Name</Label>
                    <Input
                      id="project-name"
                      value={projectSettings.name}
                      onChange={(e) => handleInputChange("name", e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="project-description">Description</Label>
                    <Textarea
                      id="project-description"
                      value={projectSettings.description}
                      onChange={(e) => handleInputChange("description", e.target.value)}
                      rows={3}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="default-status">Default Status</Label>
                    <Select
                      value={projectSettings.defaultStatus}
                      onValueChange={(value) => handleInputChange("defaultStatus", value)}
                    >
                      <SelectTrigger id="default-status">
                        <SelectValue placeholder="Select a default status" />
                      </SelectTrigger>
                      <SelectContent>
                        {projectSettings.workflow.map((stage) => (
                          <SelectItem key={stage.id} value={stage.name}>
                            {stage.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">New tasks will be assigned this status by default</p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="start-date">Start Date</Label>
                      <div className="relative">
                        <Input
                          id="start-date"
                          type="date"
                          value={projectSettings.startDate}
                          onChange={(e) => handleInputChange("startDate", e.target.value)}
                        />
                        <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="end-date">End Date</Label>
                      <div className="relative">
                        <Input
                          id="end-date"
                          type="date"
                          value={projectSettings.endDate}
                          onChange={(e) => handleInputChange("endDate", e.target.value)}
                        />
                        <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground" />
                      </div>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="timezone">Timezone</Label>
                    <Select
                      value={projectSettings.timezone}
                      onValueChange={(value) => handleInputChange("timezone", value)}
                    >
                      <SelectTrigger id="timezone">
                        <SelectValue placeholder="Select a timezone" />
                      </SelectTrigger>
                      <SelectContent>
                        {timezoneOptions.map((timezone) => (
                          <SelectItem key={timezone.value} value={timezone.value}>
                            {timezone.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-sm text-muted-foreground">
                      All dates and times will be displayed in this timezone
                    </p>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="auto-assign">Auto-assign tasks</Label>
                      <Switch id="auto-assign" />
                    </div>
                    <p className="text-sm text-muted-foreground">
                      Automatically assign new tasks to team members based on workload
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Members & Access */}
            {activeTab === "members" && (
              <Card>
                <CardHeader>
                  <CardTitle>Members & Access</CardTitle>
                  <CardDescription>Manage team members and their access levels</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Project Members</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                          <Plus className="mr-2 h-4 w-4" /> Invite Member
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Invite Team Member</DialogTitle>
                          <DialogDescription>Send an invitation to join this project</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="invite-email">Email Address</Label>
                            <Input id="invite-email" placeholder="colleague@example.com" />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invite-role">Role</Label>
                            <Select defaultValue="Editor">
                              <SelectTrigger id="invite-role">
                                <SelectValue placeholder="Select a role" />
                              </SelectTrigger>
                              <SelectContent>
                                {roleOptions.map((role) => (
                                  <SelectItem key={role.value} value={role.value}>
                                    {role.label}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="invite-message">Message (Optional)</Label>
                            <Textarea id="invite-message" placeholder="I'd like you to join our project..." rows={3} />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {}}>
                            Cancel
                          </Button>
                          <Button
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                            onClick={() => handleInviteMember("colleague@example.com", "Editor")}
                          >
                            Send Invitation
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="border rounded-md">
                    <div className="bg-muted/50 px-4 py-2 border-b">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                        <div className="col-span-6">Member</div>
                        <div className="col-span-3">Role</div>
                        <div className="col-span-3 text-right">Actions</div>
                      </div>
                    </div>
                    <div className="divide-y">
                      {projectSettings.members.map((member) => (
                        <div key={member.id} className="px-4 py-3">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-6 flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.avatar} alt={member.name} />
                                <AvatarFallback>{member.initials}</AvatarFallback>
                              </Avatar>
                              <div>
                                <div className="font-medium">{member.name}</div>
                                <div className="text-sm text-muted-foreground">{member.email}</div>
                              </div>
                            </div>
                            <div className="col-span-3">
                              <Select
                                value={member.role}
                                onValueChange={(value) => handleRoleChange(member.id, value)}
                                disabled={member.id === 1} // Disable for project owner
                              >
                                <SelectTrigger className="h-8">
                                  <SelectValue placeholder="Select a role" />
                                </SelectTrigger>
                                <SelectContent>
                                  {roleOptions.map((role) => (
                                    <SelectItem key={role.value} value={role.value}>
                                      {role.label}
                                    </SelectItem>
                                  ))}
                                </SelectContent>
                              </Select>
                            </div>
                            <div className="col-span-3 flex justify-end">
                              {member.id === 1 ? (
                                <Badge variant="outline">Owner</Badge>
                              ) : (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  onClick={() => handleRemoveMember(member.id)}
                                >
                                  <Trash className="h-4 w-4" />
                                  <span className="sr-only md:not-sr-only md:ml-2">Remove</span>
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {projectSettings.pendingInvites.length > 0 && (
                    <div>
                      <h3 className="text-lg font-medium mb-3">Pending Invitations</h3>
                      <div className="border rounded-md">
                        <div className="bg-muted/50 px-4 py-2 border-b">
                          <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                            <div className="col-span-5">Email</div>
                            <div className="col-span-3">Role</div>
                            <div className="col-span-2">Sent</div>
                            <div className="col-span-2 text-right">Actions</div>
                          </div>
                        </div>
                        <div className="divide-y">
                          {projectSettings.pendingInvites.map((invite, index) => (
                            <div key={index} className="px-4 py-3">
                              <div className="grid grid-cols-12 gap-4 items-center">
                                <div className="col-span-5 text-sm">{invite.email}</div>
                                <div className="col-span-3">
                                  <Badge variant="outline">{invite.role}</Badge>
                                </div>
                                <div className="col-span-2 text-sm text-muted-foreground">{invite.sentAt}</div>
                                <div className="col-span-2 flex justify-end">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleCancelInvite(invite.email)}
                                  >
                                    <X className="h-4 w-4" />
                                    <span className="sr-only md:not-sr-only md:ml-2">Cancel</span>
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="bg-muted/30 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium mb-1">About Access Roles</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Admin:</strong> Full access to all project settings and can manage members
                        </p>
                        <p className="text-sm text-muted-foreground mb-2">
                          <strong>Editor:</strong> Can create and edit tasks, but cannot modify project settings
                        </p>
                        <p className="text-sm text-muted-foreground">
                          <strong>Viewer:</strong> Can only view tasks and project information
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Tags & Labels */}
            {activeTab === "labels" && (
              <Card>
                <CardHeader>
                  <CardTitle>Tags & Labels</CardTitle>
                  <CardDescription>Manage custom labels to categorize and organize tasks</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex flex-col sm:flex-row sm:items-end gap-3">
                    <div className="space-y-2 flex-1">
                      <Label htmlFor="new-label-name">New Label Name</Label>
                      <Input
                        id="new-label-name"
                        value={newLabelName}
                        onChange={(e) => setNewLabelName(e.target.value)}
                        placeholder="Enter label name"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-label-color">Color</Label>
                      <div className="flex gap-1">
                        {labelColors.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={cn(
                              "w-6 h-6 rounded-full border",
                              newLabelColor === color ? "ring-2 ring-offset-2 ring-violet-600" : "",
                            )}
                            style={{ backgroundColor: color }}
                            onClick={() => setNewLabelColor(color)}
                            aria-label={`Select color ${color}`}
                          />
                        ))}
                      </div>
                    </div>
                    <Button
                      className="bg-violet-600 hover:bg-violet-700 text-white mt-2 sm:mt-0"
                      onClick={handleAddLabel}
                      disabled={!newLabelName.trim()}
                    >
                      <Plus className="mr-2 h-4 w-4" /> Add Label
                    </Button>
                  </div>

                  <div className="border rounded-md">
                    <div className="bg-muted/50 px-4 py-2 border-b">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                        <div className="col-span-1">Color</div>
                        <div className="col-span-7">Name</div>
                        <div className="col-span-4 text-right">Actions</div>
                      </div>
                    </div>
                    <div className="divide-y">
                      {projectSettings.labels.map((label) => (
                        <div key={label.id} className="px-4 py-3">
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-1">
                              <div className="w-6 h-6 rounded-full" style={{ backgroundColor: label.color }} />
                            </div>
                            <div className="col-span-7">
                              {editingLabel === label.id ? (
                                <div className="flex gap-2">
                                  <Input
                                    value={label.name}
                                    onChange={(e) => {
                                      const updatedLabels = projectSettings.labels.map((l) =>
                                        l.id === label.id ? { ...l, name: e.target.value } : l,
                                      )
                                      setProjectSettings({
                                        ...projectSettings,
                                        labels: updatedLabels,
                                      })
                                    }}
                                    className="h-8"
                                  />
                                  <div className="flex gap-1">
                                    {labelColors.map((color) => (
                                      <button
                                        key={color}
                                        type="button"
                                        className={cn(
                                          "w-6 h-6 rounded-full border",
                                          label.color === color ? "ring-2 ring-offset-1 ring-violet-600" : "",
                                        )}
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                          const updatedLabels = projectSettings.labels.map((l) =>
                                            l.id === label.id ? { ...l, color } : l,
                                          )
                                          setProjectSettings({
                                            ...projectSettings,
                                            labels: updatedLabels,
                                          })
                                        }}
                                        aria-label={`Select color ${color}`}
                                      />
                                    ))}
                                  </div>
                                </div>
                              ) : (
                                <div className="font-medium">{label.name}</div>
                              )}
                            </div>
                            <div className="col-span-4 flex justify-end gap-2">
                              {editingLabel === label.id ? (
                                <>
                                  <Button variant="outline" size="sm" onClick={() => setEditingLabel(null)}>
                                    <X className="h-4 w-4" />
                                    <span className="sr-only md:not-sr-only md:ml-2">Cancel</span>
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-green-600 hover:text-green-700 hover:bg-green-50"
                                    onClick={() => handleUpdateLabel(label.id, label.name, label.color)}
                                  >
                                    <Check className="h-4 w-4" />
                                    <span className="sr-only md:not-sr-only md:ml-2">Save</span>
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => setEditingLabel(label.id)}>
                                    <Edit className="h-4 w-4" />
                                    <span className="sr-only md:not-sr-only md:ml-2">Edit</span>
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleDeleteLabel(label.id)}
                                  >
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only md:not-sr-only md:ml-2">Delete</span>
                                  </Button>
                                </>
                              )}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium mb-1">Using Labels</h4>
                        <p className="text-sm text-muted-foreground">
                          Labels help categorize tasks and make them easier to filter. You can apply multiple labels to
                          a single task.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Workflow */}
            {activeTab === "workflow" && (
              <Card>
                <CardHeader>
                  <CardTitle>Workflow Configuration</CardTitle>
                  <CardDescription>Customize task statuses and workflow stages</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Workflow Stages</h3>
                    <Dialog>
                      <DialogTrigger asChild>
                        <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                          <Plus className="mr-2 h-4 w-4" /> Add Stage
                        </Button>
                      </DialogTrigger>
                      <DialogContent>
                        <DialogHeader>
                          <DialogTitle>Add Workflow Stage</DialogTitle>
                          <DialogDescription>Create a new stage for your project workflow</DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4 py-4">
                          <div className="space-y-2">
                            <Label htmlFor="stage-name">Stage Name</Label>
                            <Input id="stage-name" placeholder="e.g., In Testing" />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => {}}>
                            Cancel
                          </Button>
                          <Button
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                            onClick={() => handleAddWorkflowStage("In Testing")}
                          >
                            Add Stage
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  <div className="border rounded-md">
                    <div className="bg-muted/50 px-4 py-2 border-b">
                      <div className="grid grid-cols-12 gap-4 text-sm font-medium text-muted-foreground">
                        <div className="col-span-1"></div>
                        <div className="col-span-7">Stage Name</div>
                        <div className="col-span-2">Tasks</div>
                        <div className="col-span-2 text-right">Actions</div>
                      </div>
                    </div>
                    <div className="divide-y">
                      {projectSettings.workflow.map((stage) => (
                        <div
                          key={stage.id}
                          className={cn(
                            "px-4 py-3",
                            draggedWorkflowId === stage.id ? "bg-violet-50 dark:bg-violet-900/20" : "",
                          )}
                          draggable
                          onDragStart={(e) => handleWorkflowDragStart(e, stage.id)}
                          onDragOver={handleWorkflowDragOver}
                          onDrop={(e) => handleWorkflowDrop(e, stage.id)}
                        >
                          <div className="grid grid-cols-12 gap-4 items-center">
                            <div className="col-span-1">
                              <GripVertical className="h-5 w-5 text-muted-foreground cursor-move" />
                            </div>
                            <div className="col-span-7">
                              <div className="font-medium">{stage.name}</div>
                            </div>
                            <div className="col-span-2">
                              <Badge variant="outline">{stage.tasks}</Badge>
                            </div>
                            <div className="col-span-2 flex justify-end gap-2">
                              <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                  <Button variant="ghost" size="sm">
                                    <MoreHorizontal className="h-4 w-4" />
                                  </Button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end">
                                  <DropdownMenuItem
                                    onClick={() => {
                                      const newName = prompt("Enter new name", stage.name)
                                      if (newName) handleRenameWorkflowStage(stage.id, newName)
                                    }}
                                  >
                                    <Edit className="mr-2 h-4 w-4" />
                                    Rename
                                  </DropdownMenuItem>
                                  <DropdownMenuItem
                                    className="text-red-600"
                                    onClick={() => {
                                      if (stage.tasks > 0) {
                                        if (
                                          confirm(
                                            `This stage contains ${stage.tasks} tasks. Are you sure you want to delete it?`,
                                          )
                                        ) {
                                          handleDeleteWorkflowStage(stage.id)
                                        }
                                      } else {
                                        handleDeleteWorkflowStage(stage.id)
                                      }
                                    }}
                                  >
                                    <Trash className="mr-2 h-4 w-4" />
                                    Delete
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="bg-muted/30 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium mb-1">Workflow Preview</h4>
                        <p className="text-sm text-muted-foreground mb-4">
                          This is how your workflow will appear on the board. Drag and drop stages to reorder them.
                        </p>
                        <div className="flex gap-4 overflow-x-auto pb-2">
                          {projectSettings.workflow.map((stage) => (
                            <div
                              key={stage.id}
                              className="flex-shrink-0 w-40 bg-white dark:bg-gray-800 rounded-md border shadow-sm p-3"
                            >
                              <div className="font-medium mb-2">{stage.name}</div>
                              <div className="text-sm text-muted-foreground">{stage.tasks} tasks</div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Integrations */}
            {activeTab === "integrations" && (
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>Connect your project with other tools and services</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {projectSettings.integrations.map((integration) => (
                      <Card key={integration.id} className="overflow-hidden">
                        <CardContent className="p-0">
                          <div className="flex items-center p-4 border-b">
                            <div className="h-10 w-10 mr-3">
                              <img
                                src={integration.logo || "/placeholder.svg"}
                                alt={integration.name}
                                className="h-full w-full object-contain"
                              />
                            </div>
                            <div className="flex-1">
                              <h4 className="font-medium">{integration.name}</h4>
                              {integration.status === "connected" ? (
                                <Badge className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                                  Connected
                                </Badge>
                              ) : (
                                <Badge variant="outline">Disconnected</Badge>
                              )}
                            </div>
                          </div>
                          <div className="p-4">
                            {integration.status === "connected" ? (
                              <>
                                <p className="text-sm text-muted-foreground mb-4">{integration.details}</p>
                                <div className="flex justify-between">
                                  <Button variant="outline" size="sm">
                                    <Cog className="mr-2 h-4 w-4" />
                                    Configure
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleToggleIntegration(integration.id)}
                                  >
                                    Disconnect
                                  </Button>
                                </div>
                              </>
                            ) : (
                              <>
                                <p className="text-sm text-muted-foreground mb-4">
                                  Connect your project with {integration.name} to streamline your workflow.
                                </p>
                                <Button
                                  className="bg-violet-600 hover:bg-violet-700 text-white"
                                  onClick={() => handleToggleIntegration(integration.id)}
                                >
                                  Connect
                                </Button>
                              </>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    ))}

                    {/* Add Integration Card */}
                    <Card className="border-dashed">
                      <CardContent className="p-6 flex flex-col items-center justify-center text-center h-full">
                        <div className="rounded-full bg-muted p-3 mb-3">
                          <Plus className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <h4 className="font-medium mb-1">Add Integration</h4>
                        <p className="text-sm text-muted-foreground mb-3">
                          Browse available integrations for your project
                        </p>
                        <Button variant="outline">Browse Integrations</Button>
                      </CardContent>
                    </Card>
                  </div>

                  <div className="bg-muted/30 rounded-md p-4">
                    <div className="flex items-start gap-3">
                      <Info className="h-5 w-5 text-muted-foreground flex-shrink-0 mt-0.5" />
                      <div>
                        <h4 className="font-medium mb-1">About Integrations</h4>
                        <p className="text-sm text-muted-foreground">
                          Integrations allow you to connect your project with other tools and services to streamline
                          your workflow. You can automatically sync tasks, receive notifications, and more.
                        </p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Danger Zone */}
            {activeTab === "danger" && (
              <Card className="border-red-200 dark:border-red-900">
                <CardHeader className="border-b border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-950">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400" />
                    <CardTitle className="text-red-600 dark:text-red-400">Danger Zone</CardTitle>
                  </div>
                  <CardDescription className="text-red-600/80 dark:text-red-400/80">
                    Destructive actions that cannot be undone
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-6 pt-6">
                  <div className="border border-red-200 dark:border-red-900 rounded-md">
                    <div className="p-4 border-b border-red-200 dark:border-red-900">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium mb-1">Transfer Project Ownership</h3>
                          <p className="text-sm text-muted-foreground">
                            Transfer ownership of this project to another team member
                          </p>
                        </div>
                        <Button variant="outline">Transfer Ownership</Button>
                      </div>
                    </div>

                    <div className="p-4 border-b border-red-200 dark:border-red-900">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium mb-1">Archive Project</h3>
                          <p className="text-sm text-muted-foreground">Archive this project and make it read-only</p>
                        </div>
                        <Button variant="outline">Archive Project</Button>
                      </div>
                    </div>

                    <div className="p-4">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-medium text-red-600 dark:text-red-400 mb-1">Delete Project</h3>
                          <p className="text-sm text-muted-foreground">
                            Permanently delete this project and all its data
                          </p>
                        </div>
                        <Dialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                          <DialogTrigger asChild>
                            <Button variant="destructive">Delete Project</Button>
                          </DialogTrigger>
                          <DialogContent>
                            <DialogHeader>
                              <DialogTitle className="text-red-600">Delete Project</DialogTitle>
                              <DialogDescription>
                                This action cannot be undone. This will permanently delete the project and all
                                associated data.
                              </DialogDescription>
                            </DialogHeader>
                            <div className="py-4">
                              <div className="bg-red-50 dark:bg-red-950 p-4 rounded-md mb-4">
                                <div className="flex items-start gap-3">
                                  <AlertCircle className="h-5 w-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" />
                                  <div>
                                    <h4 className="font-medium text-red-600 dark:text-red-400 mb-1">Warning</h4>
                                    <p className="text-sm text-red-600/80 dark:text-red-400/80">
                                      You are about to delete <strong>{projectSettings.name}</strong> and all its data,
                                      including:
                                    </p>
                                    <ul className="list-disc list-inside text-sm text-red-600/80 dark:text-red-400/80 mt-2 space-y-1">
                                      <li>All tasks and their history</li>
                                      <li>All comments and attachments</li>
                                      <li>All team member associations</li>
                                      <li>All integrations and connections</li>
                                    </ul>
                                  </div>
                                </div>
                              </div>
                              <div className="space-y-2">
                                <Label htmlFor="confirm-delete">
                                  Type <strong>{projectSettings.name}</strong> to confirm
                                </Label>
                                <Input id="confirm-delete" placeholder={projectSettings.name} />
                              </div>
                            </div>
                            <DialogFooter>
                              <Button variant="outline" onClick={() => setShowDeleteDialog(false)}>
                                Cancel
                              </Button>
                              <Button variant="destructive">I understand, delete this project</Button>
                            </DialogFooter>
                          </DialogContent>
                        </Dialog>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* Demo Controls - Remove in production */}
      <div className="mt-8 pt-4 border-t">
        <Button variant="outline" onClick={toggleEmptyState} className="text-xs">
          Toggle Empty State (Demo)
        </Button>
      </div>
    </div>
  )
}

import { Cog } from "lucide-react"
