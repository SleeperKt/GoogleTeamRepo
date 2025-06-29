"use client"

import type React from "react"
import { useState, useEffect, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import {
  ArrowLeft,
  Calendar,
  Info,
  Loader2,
  Save,
  Users,
  Tags,
  Workflow,

  AlertTriangle,
  UserPlus,
  Mail,
  Shield,
  Crown,
  Edit,
  Eye,
  MoreHorizontal,
  Clock,
  CheckCircle,
  XCircle,
  Trash2,
  Plus,
  Palette,
  GripVertical,
  UserCheck,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Separator } from "@/components/ui/separator"
import { toast } from "@/hooks/use-toast"
import { API_BASE_URL, invitationApi } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useUserPermissions } from "@/hooks/use-user-permissions"
import { SendInvitationDialog } from "@/components/send-invitation-dialog"
import { ParticipantRole, InvitationStatus, ProjectInvitation } from "@/lib/types"
import { useProjectLabels, ProjectLabel } from "@/hooks/use-project-labels"
import { useProjectWorkflowStages, ProjectWorkflowStage } from "@/hooks/use-project-workflow-stages"
import { useProject } from "@/contexts/project-context"

// Types
interface Project {
  id: number
  name: string
  description: string
  publicId: string
  status: number
  priority: number
  createdAt: string
}

interface ProjectSettings {
  id: number
  projectId: number
  timezone?: string
  startDate?: string
  endDate?: string
  enableNotifications: boolean
  enableCommentsNotifications: boolean
  enableTaskAssignmentNotifications: boolean
  createdAt: string
  updatedAt: string
}

interface WorkflowStage {
  id: number
  name: string
  color: string
  order: number
  isDefault: boolean
  isCompleted: boolean
  createdAt: string
  taskCount?: number
}

// Timezone options
const timezoneOptions = [
  { value: "America/New_York", label: "Eastern Time (ET)" },
  { value: "America/Chicago", label: "Central Time (CT)" },
  { value: "America/Denver", label: "Mountain Time (MT)" },
  { value: "America/Los_Angeles", label: "Pacific Time (PT)" },
  { value: "Europe/London", label: "Greenwich Mean Time (GMT)" },
  { value: "Europe/Paris", label: "Central European Time (CET)" },
  { value: "Asia/Tokyo", label: "Japan Standard Time (JST)" },
  { value: "Australia/Sydney", label: "Australian Eastern Time (AET)" },
]

// Participant interface
interface Participant {
  userId: string
  userName: string
  email: string
  role: ParticipantRole
  joinedAt: string
}

// Helper functions
const getRoleLabel = (role: ParticipantRole): string => {
  switch (role) {
    case ParticipantRole.Owner:
      return "Owner"
    case ParticipantRole.Admin:
      return "Admin"
    case ParticipantRole.Editor:
      return "Editor"
    case ParticipantRole.Viewer:
      return "Viewer"
    default:
      return "Unknown"
  }
}

const getRoleIcon = (role: ParticipantRole) => {
  switch (role) {
    case ParticipantRole.Owner:
      return <Crown className="h-4 w-4 text-yellow-600" />
    case ParticipantRole.Admin:
      return <Shield className="h-4 w-4 text-red-600" />
    case ParticipantRole.Editor:
      return <Edit className="h-4 w-4 text-blue-600" />
    case ParticipantRole.Viewer:
      return <Eye className="h-4 w-4 text-gray-600" />
    default:
      return null
  }
}

const getRoleBadgeVariant = (role: ParticipantRole) => {
  switch (role) {
    case ParticipantRole.Owner:
      return "default" // Gold-like
    case ParticipantRole.Admin:
      return "destructive" // Red
    case ParticipantRole.Editor:
      return "secondary" // Blue-ish
    case ParticipantRole.Viewer:
      return "outline" // Gray
    default:
      return "outline"
  }
}

const getInvitationStatusBadge = (status: InvitationStatus) => {
  switch (status) {
    case InvitationStatus.Pending:
      return <Badge variant="outline"><Clock className="h-3 w-3 mr-1" />Pending</Badge>
    case InvitationStatus.Accepted:
      return <Badge variant="default" className="bg-green-600"><CheckCircle className="h-3 w-3 mr-1" />Accepted</Badge>
    case InvitationStatus.Declined:
      return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Declined</Badge>
    case InvitationStatus.Cancelled:
      return <Badge variant="outline" className="text-gray-500"><XCircle className="h-3 w-3 mr-1" />Cancelled</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

// Members & Access Tab Component
interface MembersAndAccessTabProps {
  projectId: number
  projectPublicId: string
  permissions: any
}

function MembersAndAccessTab({ projectId, projectPublicId, permissions }: MembersAndAccessTabProps) {
  const { token, user } = useAuth()
  const [participants, setParticipants] = useState<Participant[]>([])
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Fetch participants
  const fetchParticipants = async () => {
    if (!token || !projectPublicId) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch participants: ${response.status}`)
      }

      const data = await response.json()
      // Handle ASP.NET response format
      const participantArray = Array.isArray(data) ? data : ((data as any)?.$values || [])
      setParticipants(participantArray)
    } catch (err) {
      console.error('Error fetching participants:', err)
      setError(err instanceof Error ? err.message : 'Failed to load participants')
    }
  }

  // Fetch invitations
  const fetchInvitations = async () => {
    if (!projectId || !permissions.canInviteUsers) return

    try {
      const data = await invitationApi.getProjectInvitations(projectId)
      const invitationArray = Array.isArray(data) ? data : ((data as any)?.$values || [])
      setInvitations(invitationArray)
    } catch (err) {
      console.error('Error fetching invitations:', err)
      // Don't set error for invitations as it's not critical
    }
  }

  // Load data
  const loadData = async () => {
    setLoading(true)
    setError(null)
    
    try {
      await Promise.all([
        fetchParticipants(),
        fetchInvitations()
      ])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadData()
  }, [projectId, projectPublicId, token, permissions.canInviteUsers])

  // Handle invitation sent
  const handleInvitationSent = () => {
    loadData() // Refresh data
    toast({
      title: "Success",
      description: "Invitation sent successfully",
    })
  }

  // Handle cancel invitation
  const handleCancelInvitation = async (invitationId: number) => {
    try {
      await invitationApi.cancelInvitation(invitationId)
      await loadData() // Refresh data
      toast({
        title: "Success",
        description: "Invitation cancelled successfully",
      })
    } catch (error) {
      console.error('Error cancelling invitation:', error)
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      })
    }
  }

  // Handle role change
  const handleRoleChange = async (participant: Participant, newRole: ParticipantRole) => {
    if (newRole === participant.role) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/participants/${participant.userId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRole }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to update role: ${response.status} ${errorText}`)
      }

      await loadData() // Refresh data
      toast({
        title: "Success",
        description: `Role updated to ${getRoleLabel(newRole)}`,
      })
    } catch (error) {
      console.error('Error updating role:', error)
      toast({
        title: "Error",
        description: "Failed to update participant role",
        variant: "destructive",
      })
    }
  }

  // Handle remove participant
  const handleRemoveParticipant = async (participant: Participant) => {
    if (!confirm(`Are you sure you want to remove ${participant.userName} from this project?`)) {
      return
    }

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/${projectId}/participants/${participant.userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(`Failed to remove participant: ${response.status} ${errorText}`)
      }

      await loadData() // Refresh data
      toast({
        title: "Success",
        description: `${participant.userName} removed from project`,
      })
    } catch (error) {
      console.error('Error removing participant:', error)
      toast({
        title: "Error",
        description: "Failed to remove participant",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Members & Access</CardTitle>
          <CardDescription>Manage team members and their access levels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Current Members */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Team Members</CardTitle>
              <CardDescription>
                {participants.length} member{participants.length !== 1 ? 's' : ''} in this project
              </CardDescription>
            </div>
            {permissions.canInviteUsers && (
              <SendInvitationDialog 
                projectId={projectId}
                onInvitationSent={handleInvitationSent}
                trigger={
                  <Button size="sm" className="bg-violet-600 hover:bg-violet-700 text-white">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Invite Member
                  </Button>
                }
              />
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}
          
          <div className="space-y-3">
            {participants.map((participant) => {
              // Determine if current user can edit this participant's role
              const isSelf = participant.userId === user?.id
              const isAdminRequester = permissions.role === ParticipantRole.Admin
              const canEditParticipant = permissions.canManageProject &&
                participant.role !== ParticipantRole.Owner &&
                !(isAdminRequester && (isSelf || participant.role === ParticipantRole.Admin))

              return (
                <div key={participant.userId} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <Avatar className="h-10 w-10">
                      <AvatarImage src={`https://api.dicebear.com/7.x/initials/svg?seed=${participant.userName}`} />
                      <AvatarFallback>
                        {participant.userName?.split(' ').map(n => n[0]).join('').toUpperCase() || 'U'}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{participant.userName}</p>
                        {getRoleIcon(participant.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">{participant.email}</p>
                      <p className="text-xs text-muted-foreground">
                        Joined {new Date(participant.joinedAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {canEditParticipant && (
                      <div className="flex items-center space-x-2">
                        {/* Role Selector */}
                        <Select
                          value={participant.role.toString()}
                          onValueChange={(value) => handleRoleChange(participant, parseInt(value) as ParticipantRole)}
                        >
                          <SelectTrigger className="w-24 h-8">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            {permissions.role === ParticipantRole.Owner && (
                              <SelectItem value={ParticipantRole.Admin.toString()}>
                                Admin
                              </SelectItem>
                            )}
                            <SelectItem value={ParticipantRole.Editor.toString()}>
                              Editor
                            </SelectItem>
                            <SelectItem value={ParticipantRole.Viewer.toString()}>
                              Viewer
                            </SelectItem>
                          </SelectContent>
                        </Select>
                        
                        {/* More Actions */}
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem 
                              onClick={() => handleRemoveParticipant(participant)}
                              className="text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Remove from project
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    )}
                    
                    {/* Show role badge for non-editable roles */}
                    {(!canEditParticipant) && (
                      <Badge variant={getRoleBadgeVariant(participant.role)}>
                        {getRoleLabel(participant.role)}
                      </Badge>
                    )}
                  </div>
                </div>
              )
            })}
            
            {participants.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                <Users className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No team members found</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pending Invitations */}
      {permissions.canInviteUsers && invitations.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Pending Invitations</CardTitle>
            <CardDescription>
              {invitations.filter(inv => inv.status === InvitationStatus.Pending).length} pending invitation{invitations.filter(inv => inv.status === InvitationStatus.Pending).length !== 1 ? 's' : ''}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {invitations.map((invitation) => (
                <div key={invitation.id} className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className="h-10 w-10 bg-gray-100 rounded-full flex items-center justify-center">
                      <Mail className="h-5 w-5 text-gray-600" />
                    </div>
                    <div>
                      <div className="flex items-center space-x-2">
                        <p className="font-medium">{invitation.inviteeName}</p>
                        {getRoleIcon(invitation.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">{invitation.inviteeEmail}</p>
                      <p className="text-xs text-muted-foreground">
                        Invited {new Date(invitation.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {getInvitationStatusBadge(invitation.status)}
                    <Badge variant="outline">
                      {getRoleLabel(invitation.role)}
                    </Badge>
                    {invitation.status === InvitationStatus.Pending && permissions.canInviteUsers && (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleCancelInvitation(invitation.id)}
                      >
                        <XCircle className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Access Control Information */}
      <Card>
        <CardHeader>
          <CardTitle>Access Levels</CardTitle>
          <CardDescription>Understanding project roles and permissions</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Crown className="h-5 w-5 text-yellow-600 mt-0.5" />
              <div>
                <p className="font-medium">Owner</p>
                <p className="text-sm text-muted-foreground">
                  Full access to all project features including deletion and ownership transfer
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-red-600 mt-0.5" />
              <div>
                <p className="font-medium">Admin</p>
                <p className="text-sm text-muted-foreground">
                  Can manage project settings, invite members, and perform administrative tasks
                </p>
              </div>
            </div>
                         <Separator />
            <div className="flex items-start space-x-3">
              <Edit className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <p className="font-medium">Editor</p>
                <p className="text-sm text-muted-foreground">
                  Can create, update, and delete tasks but cannot change project settings or invite members
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start space-x-3">
              <Eye className="h-5 w-5 text-gray-600 mt-0.5" />
              <div>
                <p className="font-medium">Viewer</p>
                <p className="text-sm text-muted-foreground">
                  Can view project content but cannot make changes
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Tags & Labels Tab Component
interface TagsAndLabelsTabProps {
  projectId: number
  projectPublicId: string
  permissions: any
}

function TagsAndLabelsTab({ projectId, projectPublicId, permissions }: TagsAndLabelsTabProps) {
  const { labels, loading, error, createLabel, updateLabel, deleteLabel, refreshLabels } = useProjectLabels(projectPublicId)
  const [editingLabel, setEditingLabel] = useState<ProjectLabel | null>(null)
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState("#3b82f6")
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)

  // Predefined color options
  const colorOptions = [
    "#3b82f6", // Blue
    "#10b981", // Green  
    "#f59e0b", // Yellow
    "#ef4444", // Red
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#84cc16", // Lime
    "#ec4899", // Pink
    "#6b7280", // Gray
  ]

  // Handle create new label
  const handleCreateLabel = async () => {
    if (!newLabelName.trim()) {
      toast({
        title: "Error",
        description: "Label name is required",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await createLabel(newLabelName.trim(), newLabelColor)
      if (result) {
        toast({
          title: "Success",
          description: "Label created successfully",
        })
        setNewLabelName("")
        setNewLabelColor("#3b82f6")
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Error creating label:', error)
      toast({
        title: "Error",
        description: "Failed to create label",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Handle edit label
  const handleEditLabel = async (label: ProjectLabel, newName: string, newColor: string) => {
    if (!newName.trim()) {
      toast({
        title: "Error",
        description: "Label name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await updateLabel(label.id, newName.trim(), newColor)
      if (result) {
        toast({
          title: "Success",
          description: "Label updated successfully",
        })
        setEditingLabel(null)
      }
    } catch (error) {
      console.error('Error updating label:', error)
      toast({
        title: "Error",
        description: "Failed to update label",
        variant: "destructive",
      })
    }
  }

  // Handle delete label
  const handleDeleteLabel = async (label: ProjectLabel) => {
    if (!confirm(`Are you sure you want to delete the "${label.name}" label? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteLabel(label.id)
      if (result) {
        toast({
          title: "Success",
          description: "Label deleted successfully",
        })
      }
    } catch (error) {
      console.error('Error deleting label:', error)
      toast({
        title: "Error",
        description: "Failed to delete label",
        variant: "destructive",
      })
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Tags & Labels</CardTitle>
          <CardDescription>Organize your tasks with custom labels</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Labels Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Project Labels</CardTitle>
              <CardDescription>
                Create and manage labels to organize your tasks and content
              </CardDescription>
            </div>
            {permissions.canManageProject && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                size="sm" 
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Label
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Create Label Form */}
          {showCreateForm && permissions.canManageProject && (
            <Card className="mb-6 border-violet-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Create New Label</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-label-name">Label Name</Label>
                  <Input
                    id="new-label-name"
                    value={newLabelName}
                    onChange={(e) => setNewLabelName(e.target.value)}
                    placeholder="Enter label name"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewLabelColor(color)}
                        className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                          newLabelColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newLabelColor}
                      onChange={(e) => setNewLabelColor(e.target.value)}
                      className="w-8 h-8 rounded border"
                    />
                    <span className="text-sm text-muted-foreground">Custom color</span>
                  </div>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <Badge 
                    variant="outline" 
                    style={{ 
                      backgroundColor: newLabelColor, 
                      color: '#000',
                      borderColor: newLabelColor 
                    }}
                  >
                    {newLabelName || 'Label Name'}
                  </Badge>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateLabel}
                    disabled={isCreating || !newLabelName.trim()}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Label
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewLabelName("")
                      setNewLabelColor("#3b82f6")
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Labels List */}
          <div className="space-y-3">
            {labels.length > 0 ? (
              labels.map((label) => (
                <div key={label.id} className="flex items-center justify-between p-3 border rounded-lg">
                  {editingLabel?.id === label.id ? (
                    <EditLabelForm
                      label={label}
                      colorOptions={colorOptions}
                      onSave={handleEditLabel}
                      onCancel={() => setEditingLabel(null)}
                    />
                  ) : (
                    <>
                      <div className="flex items-center space-x-3">
                        <GripVertical className="h-4 w-4 text-muted-foreground" />
                        <Badge 
                          variant="outline" 
                          style={{ 
                            backgroundColor: label.color, 
                            color: '#000',
                            borderColor: label.color 
                          }}
                        >
                          {label.name}
                        </Badge>
                        <span className="text-sm text-muted-foreground">
                          Created {new Date(label.createdAt).toLocaleDateString()}
                        </span>
                      </div>
                      {permissions.canManageProject && (
                        <div className="flex items-center space-x-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => setEditingLabel(label)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDeleteLabel(label)}
                            className="text-red-600 hover:text-red-700"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </div>
              ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Tags className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No labels created yet</p>
                {permissions.canManageProject && (
                  <p className="text-sm">Click "Add Label" to create your first label</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Label Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Label Usage</CardTitle>
          <CardDescription>How to use labels in your project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Tags className="h-5 w-5 text-violet-600 mt-0.5" />
              <div>
                <p className="font-medium">Task Organization</p>
                <p className="text-sm text-muted-foreground">
                  Assign labels to tasks to categorize and filter them by type, priority, or feature area
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start space-x-3">
              <Palette className="h-5 w-5 text-violet-600 mt-0.5" />
              <div>
                <p className="font-medium">Visual Organization</p>
                <p className="text-sm text-muted-foreground">
                  Use different colors to create visual distinction between label categories
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start space-x-3">
              <Eye className="h-5 w-5 text-violet-600 mt-0.5" />
              <div>
                <p className="font-medium">Filtering & Search</p>
                <p className="text-sm text-muted-foreground">
                  Filter tasks by labels in the backlog and board views for better project visibility
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Workflow Tab Component
interface WorkflowTabProps {
  projectId: number
  projectPublicId: string
  permissions: any
}

function WorkflowTab({ projectId, projectPublicId, permissions }: WorkflowTabProps) {
  const { stages, loading, error, createStage, updateStage, deleteStage, reorderStages } = useProjectWorkflowStages(projectPublicId)
  const [editingStage, setEditingStage] = useState<ProjectWorkflowStage | null>(null)
  const [newStageName, setNewStageName] = useState("")
  const [newStageColor, setNewStageColor] = useState("#3b82f6")
  const [newStageIsCompleted, setNewStageIsCompleted] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [draggedStage, setDraggedStage] = useState<ProjectWorkflowStage | null>(null)

  // Predefined color options
  const colorOptions = [
    "#6b7280", // Gray - To Do
    "#3b82f6", // Blue - In Progress  
    "#f59e0b", // Yellow - In Review
    "#10b981", // Green - Done
    "#8b5cf6", // Purple
    "#06b6d4", // Cyan
    "#f97316", // Orange
    "#84cc16", // Lime
    "#ec4899", // Pink
    "#ef4444", // Red
  ]

  // Handle create new stage
  const handleCreateStage = async () => {
    if (!newStageName.trim()) {
      toast({
        title: "Error",
        description: "Stage name is required",
        variant: "destructive",
      })
      return
    }

    setIsCreating(true)
    try {
      const result = await createStage(newStageName.trim(), newStageColor, newStageIsCompleted)
      if (result) {
        toast({
          title: "Success",
          description: "Workflow stage created successfully",
        })
        setNewStageName("")
        setNewStageColor("#3b82f6")
        setNewStageIsCompleted(false)
        setShowCreateForm(false)
      }
    } catch (error) {
      console.error('Error creating workflow stage:', error)
      toast({
        title: "Error",
        description: "Failed to create workflow stage",
        variant: "destructive",
      })
    } finally {
      setIsCreating(false)
    }
  }

  // Handle edit stage
  const handleEditStage = async (stage: ProjectWorkflowStage, newName: string, newColor: string, newIsCompleted: boolean) => {
    if (!newName.trim()) {
      toast({
        title: "Error",
        description: "Stage name is required",
        variant: "destructive",
      })
      return
    }

    try {
      const result = await updateStage(stage.id, newName.trim(), newColor, stage.order, newIsCompleted)
      if (result) {
        toast({
          title: "Success",
          description: "Workflow stage updated successfully",
        })
        setEditingStage(null)
      }
    } catch (error) {
      console.error('Error updating workflow stage:', error)
      toast({
        title: "Error",
        description: "Failed to update workflow stage",
        variant: "destructive",
      })
    }
  }

  // Handle delete stage
  const handleDeleteStage = async (stage: ProjectWorkflowStage) => {
    if (stage.taskCount && stage.taskCount > 0) {
      toast({
        title: "Cannot Delete Stage",
        description: `This stage contains ${stage.taskCount} task(s). Move or complete all tasks before deleting.`,
        variant: "destructive",
      })
      return
    }

    if (!confirm(`Are you sure you want to delete the "${stage.name}" stage? This action cannot be undone.`)) {
      return
    }

    try {
      const result = await deleteStage(stage.id)
      if (result) {
        toast({
          title: "Success",
          description: "Workflow stage deleted successfully",
        })
      }
    } catch (error) {
      console.error('Error deleting workflow stage:', error)
      toast({
        title: "Error",
        description: "Failed to delete workflow stage",
        variant: "destructive",
      })
    }
  }

  // Handle drag and drop reordering
  const handleDragStart = (stage: ProjectWorkflowStage) => {
    setDraggedStage(stage)
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: React.DragEvent, targetStage: ProjectWorkflowStage) => {
    e.preventDefault()
    
    if (!draggedStage || draggedStage.id === targetStage.id) {
      setDraggedStage(null)
      return
    }

    // Create new order based on drag and drop
    const sortedStages = [...stages].sort((a, b) => a.order - b.order)
    const draggedIndex = sortedStages.findIndex(s => s.id === draggedStage.id)
    const targetIndex = sortedStages.findIndex(s => s.id === targetStage.id)
    
    if (draggedIndex === -1 || targetIndex === -1) return

    // Remove dragged item and insert at target position
    const newStages = [...sortedStages]
    const [draggedItem] = newStages.splice(draggedIndex, 1)
    newStages.splice(targetIndex, 0, draggedItem)

    // Create new stage IDs array in the new order
    const newStageIds = newStages.map(s => s.id)

    try {
      const result = await reorderStages(newStageIds)
      if (result) {
        toast({
          title: "Success",
          description: "Workflow stages reordered successfully",
        })
      }
    } catch (error) {
      console.error('Error reordering workflow stages:', error)
      toast({
        title: "Error",
        description: "Failed to reorder workflow stages",
        variant: "destructive",
      })
    } finally {
      setDraggedStage(null)
    }
  }

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Workflow</CardTitle>
          <CardDescription>Customize your project workflow stages</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32">
            <Loader2 className="h-6 w-6 animate-spin" />
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      {/* Workflow Stages Management */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Workflow Stages</CardTitle>
              <CardDescription>
                Define the stages that tasks move through in your project workflow
              </CardDescription>
            </div>
            {permissions.canManageProject && (
              <Button 
                onClick={() => setShowCreateForm(true)}
                size="sm" 
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Stage
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
              {error}
            </div>
          )}

          {/* Create Stage Form */}
          {showCreateForm && permissions.canManageProject && (
            <Card className="mb-6 border-violet-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Create New Stage</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="new-stage-name">Stage Name</Label>
                  <Input
                    id="new-stage-name"
                    value={newStageName}
                    onChange={(e) => setNewStageName(e.target.value)}
                    placeholder="Enter stage name"
                    maxLength={50}
                  />
                </div>

                <div className="space-y-2">
                  <Label>Color</Label>
                  <div className="flex flex-wrap gap-2">
                    {colorOptions.map((color) => (
                      <button
                        key={color}
                        type="button"
                        onClick={() => setNewStageColor(color)}
                        className={`w-8 h-8 rounded-full border-2 hover:scale-110 transition-transform ${
                          newStageColor === color ? 'border-gray-800' : 'border-gray-300'
                        }`}
                        style={{ backgroundColor: color }}
                        title={color}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={newStageColor}
                      onChange={(e) => setNewStageColor(e.target.value)}
                      className="w-8 h-8 rounded border"
                    />
                    <span className="text-sm text-muted-foreground">Custom color</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="new-stage-completed"
                    checked={newStageIsCompleted}
                    onCheckedChange={setNewStageIsCompleted}
                  />
                  <Label htmlFor="new-stage-completed">Mark as completion stage</Label>
                  <span className="text-sm text-muted-foreground">(Tasks in this stage are considered done)</span>
                </div>

                {/* Preview */}
                <div className="space-y-2">
                  <Label>Preview</Label>
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant="outline" 
                      style={{ 
                        backgroundColor: newStageColor, 
                        color: '#fff',
                        borderColor: newStageColor 
                      }}
                    >
                      {newStageName || 'Stage Name'}
                    </Badge>
                    {newStageIsCompleted && (
                      <Badge variant="outline" className="text-green-600 border-green-600">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Completion Stage
                      </Badge>
                    )}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    onClick={handleCreateStage}
                    disabled={isCreating || !newStageName.trim()}
                    className="bg-violet-600 hover:bg-violet-700 text-white"
                  >
                    {isCreating ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Creating...
                      </>
                    ) : (
                      <>
                        <Plus className="mr-2 h-4 w-4" />
                        Create Stage
                      </>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setShowCreateForm(false)
                      setNewStageName("")
                      setNewStageColor("#3b82f6")
                      setNewStageIsCompleted(false)
                    }}
                  >
                    Cancel
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Stages List */}
          <div className="space-y-3">
            {stages.length > 0 ? (
              stages
                .sort((a, b) => a.order - b.order)
                .map((stage, index) => (
                  <div 
                    key={stage.id} 
                    className={`flex items-center justify-between p-4 border rounded-lg transition-colors ${
                      draggedStage?.id === stage.id ? 'bg-gray-100' : 'hover:bg-gray-50'
                    }`}
                    draggable={permissions.canManageProject}
                    onDragStart={() => handleDragStart(stage)}
                    onDragOver={handleDragOver}
                    onDrop={(e) => handleDrop(e, stage)}
                  >
                    {editingStage?.id === stage.id ? (
                      <EditStageForm
                        stage={stage}
                        colorOptions={colorOptions}
                        onSave={handleEditStage}
                        onCancel={() => setEditingStage(null)}
                      />
                    ) : (
                      <>
                        <div className="flex items-center space-x-3">
                          {permissions.canManageProject && (
                            <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                          )}
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            #{index + 1}
                          </div>
                          <Badge 
                            variant="outline" 
                            style={{ 
                              backgroundColor: stage.color, 
                              color: '#fff',
                              borderColor: stage.color 
                            }}
                          >
                            {stage.name}
                          </Badge>
                          {stage.isCompleted && (
                            <Badge variant="outline" className="text-green-600 border-green-600">
                              <CheckCircle className="h-3 w-3 mr-1" />
                              Completion
                            </Badge>
                          )}
                          {stage.isDefault && (
                            <Badge variant="outline" className="text-blue-600 border-blue-600">
                              Default
                            </Badge>
                          )}
                          <span className="text-sm text-muted-foreground">
                            {stage.taskCount || 0} task{(stage.taskCount || 0) !== 1 ? 's' : ''}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            Created {new Date(stage.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        {permissions.canManageProject && (
                          <div className="flex items-center space-x-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => setEditingStage(stage)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteStage(stage)}
                              className="text-red-600 hover:text-red-700"
                              disabled={(stage.taskCount ?? 0) > 0}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                ))
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <Workflow className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p>No workflow stages found</p>
                {permissions.canManageProject && (
                  <p className="text-sm">Click "Add Stage" to create your first workflow stage</p>
                )}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Workflow Usage Information */}
      <Card>
        <CardHeader>
          <CardTitle>Workflow Usage</CardTitle>
          <CardDescription>How workflow stages work in your project</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-start space-x-3">
              <Workflow className="h-5 w-5 text-violet-600 mt-0.5" />
              <div>
                <p className="font-medium">Task Progression</p>
                <p className="text-sm text-muted-foreground">
                  Tasks move through these stages from start to completion. Drag and drop to reorder stages.
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start space-x-3">
              <CheckCircle className="h-5 w-5 text-violet-600 mt-0.5" />
              <div>
                <p className="font-medium">Completion Stages</p>
                <p className="text-sm text-muted-foreground">
                  Mark stages as "completion stages" to indicate when tasks are considered done
                </p>
              </div>
            </div>
            <Separator />
            <div className="flex items-start space-x-3">
              <Palette className="h-5 w-5 text-violet-600 mt-0.5" />
              <div>
                <p className="font-medium">Visual Organization</p>
                <p className="text-sm text-muted-foreground">
                  Use different colors to visually distinguish between different types of workflow stages
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

// Edit Stage Form Component
interface EditStageFormProps {
  stage: ProjectWorkflowStage
  colorOptions: string[]
  onSave: (stage: ProjectWorkflowStage, newName: string, newColor: string, newIsCompleted: boolean) => void
  onCancel: () => void
}

function EditStageForm({ stage, colorOptions, onSave, onCancel }: EditStageFormProps) {
  const [name, setName] = useState(stage.name)
  const [color, setColor] = useState(stage.color)
  const [isCompleted, setIsCompleted] = useState(stage.isCompleted)

  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-center space-x-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Stage name"
          maxLength={50}
          className="max-w-xs"
        />
        <div className="flex gap-1">
          {colorOptions.slice(0, 6).map((colorOption) => (
            <button
              key={colorOption}
              type="button"
              onClick={() => setColor(colorOption)}
              className={`w-6 h-6 rounded-full border hover:scale-110 transition-transform ${
                color === colorOption ? 'border-gray-800 border-2' : 'border-gray-300'
              }`}
              style={{ backgroundColor: colorOption }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 rounded border"
          />
        </div>
        <div className="flex items-center space-x-2">
          <Switch
            id={`edit-stage-completed-${stage.id}`}
            checked={isCompleted}
            onCheckedChange={setIsCompleted}
          />
          <Label htmlFor={`edit-stage-completed-${stage.id}`} className="text-sm">Completion</Label>
        </div>
        <Badge 
          variant="outline" 
          style={{ 
            backgroundColor: color, 
            color: '#fff',
            borderColor: color 
          }}
        >
          {name || 'Stage Name'}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave(stage, name, color, isCompleted)}
          disabled={!name.trim()}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

// Danger Zone Tab Component
interface DangerZoneTabProps {
  projectId: number
  projectPublicId: string
  projectName: string
  permissions: any
}

function DangerZoneTab({ projectId, projectPublicId, projectName, permissions }: DangerZoneTabProps) {
  const router = useRouter()
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [deleteConfirmation, setDeleteConfirmation] = useState("")
  const [isDeleting, setIsDeleting] = useState(false)
  const [showTransferDialog, setShowTransferDialog] = useState(false)
  const [transferEmail, setTransferEmail] = useState("")
  const [isTransferring, setIsTransferring] = useState(false)
  const [participants, setParticipants] = useState<Participant[]>([])
  const { token } = useAuth()
  const { refreshProjects } = useProject()

  // Only show if user is owner
  if (!permissions.canDeleteProject) {
    return null
  }

  // Fetch participants for transfer ownership
  const fetchParticipants = async () => {
    if (!token || !projectPublicId) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/participants`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch participants: ${response.status}`)
      }

      const data = await response.json()
      const participantArray = Array.isArray(data) ? data : ((data as any)?.$values || [])
      setParticipants(participantArray.filter((p: Participant) => p.role !== ParticipantRole.Owner))
    } catch (err) {
      console.error('Error fetching participants:', err)
    }
  }

  const handleTransferOwnership = async () => {
    if (!transferEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    setIsTransferring(true)
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/transfer-ownership`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newOwnerEmail: transferEmail }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Transfer ownership API error:', response.status, response.statusText, errorText)
        
        if (response.status === 403) {
          throw new Error('You do not have permission to transfer ownership.')
        } else if (response.status === 400) {
          throw new Error(errorText || 'The specified user is not a member of this project.')
        } else {
          throw new Error(`Failed to transfer ownership: ${response.status} ${response.statusText}`)
        }
      }
      
      toast({
        title: "Success",
        description: "Project ownership transferred successfully",
      })
      
      // Redirect to projects page since user is no longer owner
      setTimeout(() => {
        router.push('/projects')
      }, 1500)
      
    } catch (error) {
      console.error('Error transferring ownership:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to transfer ownership",
        variant: "destructive",
      })
    } finally {
      setIsTransferring(false)
      setShowTransferDialog(false)
      setTransferEmail("")
    }
  }

  const handleDeleteProject = async () => {
    if (deleteConfirmation !== projectName) {
      toast({
        title: "Error",
        description: `Please type "${projectName}" to confirm deletion`,
        variant: "destructive",
      })
      return
    }

    setIsDeleting(true)
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        throw new Error('Authentication token not found')
      }

      console.log('Deleting project:', projectPublicId)
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete project API error:', response.status, response.statusText, errorText)
        
        if (response.status === 403) {
          throw new Error('You do not have permission to delete this project. Only the project owner can delete projects.')
        } else if (response.status === 404) {
          throw new Error('Project not found.')
        } else {
          throw new Error(`Failed to delete project: ${response.status} ${response.statusText}`)
        }
      }
      
      toast({
        title: "Success",
        description: "Project deleted successfully",
      })
      
      // Clear any stored reference to the now-deleted project so that the
      // ProjectContext falls back to an empty/default state.
      if (typeof window !== "undefined") {
        try {
          localStorage.removeItem("currentProjectId")
        } catch (_) {
          /* noop */
        }
      }
      
      // Refresh global project list so other components update immediately
      refreshProjects()
      
      // Small delay to show the success message before redirecting
      setTimeout(() => {
        router.push('/projects')
      }, 1000)
      
    } catch (error) {
      console.error('Error deleting project:', error)
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to delete project",
        variant: "destructive",
      })
      setIsDeleting(false)
      setShowDeleteDialog(false)
      setDeleteConfirmation("")
    }
  }

  return (
    <div className="space-y-6">
      {/* Warning Banner */}
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="flex items-start space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-600 mt-0.5" />
          <div>
            <h3 className="text-sm font-medium text-red-800">Danger Zone</h3>
            <p className="text-sm text-red-700 mt-1">
              The actions in this section are destructive and irreversible. Please proceed with caution.
            </p>
          </div>
        </div>
      </div>

      {/* Delete Project Section */}
      <Card className="border-red-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-red-600">Delete Project</CardTitle>
              <CardDescription>
                Permanently delete this project and all of its data. This action cannot be undone.
              </CardDescription>
            </div>
            <Button
              variant="destructive"
              onClick={() => setShowDeleteDialog(true)}
              className="bg-red-600 hover:bg-red-700"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete Project
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              When you delete a project, the following will be permanently removed:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
              <li>All tasks and their comments</li>
              <li>All project files and attachments</li>
              <li>All team member access and permissions</li>
              <li>All project settings and configurations</li>
              <li>All project history and activity logs</li>
            </ul>
            <div className="bg-red-50 border border-red-200 rounded p-3 mt-4">
              <p className="text-sm text-red-800 font-medium">
                ⚠️ This action is irreversible. Make sure you have backed up any important data before proceeding.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      {showDeleteDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-red-600 flex items-center">
                <AlertTriangle className="h-5 w-5 mr-2" />
                Delete Project
              </CardTitle>
              <CardDescription>
                This action cannot be undone. This will permanently delete the project and all of its data.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                             <div>
                 <p className="text-sm text-muted-foreground mb-2">
                   Please type <span className="font-mono font-bold text-red-600">{projectName}</span> to confirm:
                 </p>
                 <Input
                   value={deleteConfirmation}
                   onChange={(e) => setDeleteConfirmation(e.target.value)}
                   placeholder={`Type "${projectName}" here`}
                   className="font-mono"
                   autoComplete="off"
                   autoFocus
                 />
                 {deleteConfirmation && deleteConfirmation !== projectName && (
                   <p className="text-sm text-red-600 mt-1">
                     Project name doesn't match. Please type exactly: <span className="font-mono font-bold">{projectName}</span>
                   </p>
                 )}
                 {deleteConfirmation === projectName && (
                   <p className="text-sm text-green-600 mt-1 flex items-center">
                     <CheckCircle className="h-4 w-4 mr-1" />
                     Confirmed. You can now delete the project.
                   </p>
                 )}
               </div>
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowDeleteDialog(false)
                    setDeleteConfirmation("")
                  }}
                  disabled={isDeleting}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  variant="destructive"
                  onClick={handleDeleteProject}
                  disabled={deleteConfirmation !== projectName || isDeleting}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  {isDeleting ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2 className="mr-2 h-4 w-4" />
                      Delete Project
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Transfer Ownership Section */}
      <Card className="border-orange-200">
        <CardHeader>
          <div className="flex items-start justify-between">
            <div>
              <CardTitle className="text-orange-600">Transfer Ownership</CardTitle>
              <CardDescription>
                Transfer project ownership to another team member. You will become an admin.
              </CardDescription>
            </div>
            <Button
              variant="outline"
              onClick={() => {
                setShowTransferDialog(true)
                fetchParticipants()
              }}
              className="border-orange-300 text-orange-600 hover:bg-orange-50"
            >
              <UserCheck className="h-4 w-4 mr-2" />
              Transfer Ownership
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">
              When you transfer ownership:
            </p>
            <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside ml-4">
              <li>The new owner will have full control over the project</li>
              <li>You will automatically become an admin</li>
              <li>Only existing project members can become owners</li>
              <li>This action cannot be undone (only the new owner can transfer back)</li>
            </ul>
          </div>
        </CardContent>
      </Card>

      {/* Future Features Section */}
      <Card className="border-gray-200 opacity-50">
        <CardHeader>
          <CardTitle className="text-gray-500">Future Features</CardTitle>
          <CardDescription>
            Additional actions that may be added in the future
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 border rounded-lg">
              <div>
                <h4 className="font-medium text-gray-500">Reset Project Data</h4>
                <p className="text-sm text-gray-400">Remove all tasks and data while keeping the project</p>
              </div>
              <Button variant="outline" disabled className="text-gray-400">
                Coming Soon
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Transfer Ownership Dialog */}
      {showTransferDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <Card className="w-full max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-orange-600 flex items-center">
                <UserCheck className="h-5 w-5 mr-2" />
                Transfer Ownership
              </CardTitle>
              <CardDescription>
                Transfer project ownership to another team member. You will become an admin.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="transfer-email">New Owner Email</Label>
                <Input
                  id="transfer-email"
                  type="email"
                  value={transferEmail}
                  onChange={(e) => setTransferEmail(e.target.value)}
                  placeholder="Enter team member's email"
                  autoComplete="off"
                  autoFocus
                />
                <p className="text-sm text-muted-foreground mt-1">
                  Only existing project members can become owners
                </p>
              </div>

              {participants.length > 0 && (
                <div>
                  <Label className="text-sm font-medium">Current Team Members:</Label>
                  <div className="mt-2 space-y-2 max-h-32 overflow-y-auto">
                    {participants.map((participant) => (
                      <div
                        key={participant.userId}
                        className="flex items-center justify-between p-2 border rounded cursor-pointer hover:bg-gray-50"
                        onClick={() => setTransferEmail(participant.email)}
                      >
                        <div className="flex items-center space-x-2">
                          <Avatar className="h-6 w-6">
                            <AvatarFallback className="text-xs">
                              {participant.userName.charAt(0).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <p className="text-sm font-medium">{participant.userName}</p>
                            <p className="text-xs text-muted-foreground">{participant.email}</p>
                          </div>
                        </div>
                        <Badge variant={getRoleBadgeVariant(participant.role)}>
                          {getRoleLabel(participant.role)}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              <div className="flex gap-3 pt-4">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowTransferDialog(false)
                    setTransferEmail("")
                  }}
                  disabled={isTransferring}
                  className="flex-1"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleTransferOwnership}
                  disabled={!transferEmail.trim() || isTransferring}
                  className="flex-1 bg-orange-600 hover:bg-orange-700"
                >
                  {isTransferring ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Transferring...
                    </>
                  ) : (
                    <>
                      <UserCheck className="mr-2 h-4 w-4" />
                      Transfer Ownership
                    </>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}

// Edit Label Form Component
interface EditLabelFormProps {
  label: ProjectLabel
  colorOptions: string[]
  onSave: (label: ProjectLabel, newName: string, newColor: string) => void
  onCancel: () => void
}

function EditLabelForm({ label, colorOptions, onSave, onCancel }: EditLabelFormProps) {
  const [name, setName] = useState(label.name)
  const [color, setColor] = useState(label.color)

  return (
    <div className="flex-1 space-y-3">
      <div className="flex items-center space-x-3">
        <Input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Label name"
          maxLength={50}
          className="max-w-xs"
        />
        <div className="flex gap-1">
          {colorOptions.slice(0, 6).map((colorOption) => (
            <button
              key={colorOption}
              type="button"
              onClick={() => setColor(colorOption)}
              className={`w-6 h-6 rounded-full border hover:scale-110 transition-transform ${
                color === colorOption ? 'border-gray-800 border-2' : 'border-gray-300'
              }`}
              style={{ backgroundColor: colorOption }}
            />
          ))}
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-6 h-6 rounded border"
          />
        </div>
        <Badge 
          variant="outline" 
          style={{ 
            backgroundColor: color, 
            color: '#000',
            borderColor: color 
          }}
        >
          {name || 'Label Name'}
        </Badge>
      </div>
      <div className="flex gap-2">
        <Button
          size="sm"
          onClick={() => onSave(label, name, color)}
          disabled={!name.trim()}
          className="bg-violet-600 hover:bg-violet-700 text-white"
        >
          Save
        </Button>
        <Button variant="outline" size="sm" onClick={onCancel}>
          Cancel
        </Button>
      </div>
    </div>
  )
}

export default function ProjectGeneralSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const { setCurrentProject, refreshProjects } = useProject()
  const projectId = params.slug as string
  
  const { refreshPermissions, ...permissions } = useUserPermissions(projectId)
  
  // Debug logging
  console.log('🔧 Settings Page Debug:', {
    projectId,
    permissions,
    user: user?.email,
    token: !!token
  })
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [settings, setSettings] = useState<ProjectSettings | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowStage[]>([])
  
  // Timeout ref for debounced saving
  const updateProjectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const updateSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Track if there are unsaved changes
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  
  // Active tab state
  const [activeTab, setActiveTab] = useState("general")

  // Safe response parser
  const safeParseResponse = async (response: Response, fallbackData?: any) => {
    try {
      const contentType = response.headers.get('content-type')
      if (contentType && contentType.includes('application/json')) {
        const responseText = await response.text()
        if (responseText.trim()) {
          return JSON.parse(responseText)
        }
      }
      return fallbackData || {}
    } catch (error) {
      console.warn('Failed to parse JSON response:', error)
      return fallbackData || {}
    }
  }

  // Helper function to format dates for HTML date inputs
  const formatDateForInput = (dateString?: string): string => {
    if (!dateString) return ''
    try {
      // Parse the date and format as YYYY-MM-DD
      const date = new Date(dateString)
      if (isNaN(date.getTime())) return ''
      return date.toISOString().split('T')[0]
    } catch {
      return ''
    }
  }

  // Fetch project data
  const fetchProject = async () => {
    if (!token || !projectId) return null

    try {
      console.log('Fetching project with publicId:', projectId) // Debug log
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        console.error('Failed to fetch project:', response.status, response.statusText)
        throw new Error(`Failed to fetch project: ${response.status}`)
      }

      const projectData = await safeParseResponse(response)
      console.log('Fetched project data:', projectData) // Debug log
      
      // Verify we got the correct project
      if (projectData && projectData.publicId !== projectId) {
        console.error('Project mismatch! Expected:', projectId, 'Got:', projectData.publicId)
        throw new Error('Project ID mismatch - got wrong project from API')
      }
      
      return projectData
    } catch (err) {
      console.error('Error fetching project:', err)
      throw err
    }
  }

  // Fetch project settings
  const fetchSettings = async () => {
    if (!token || !projectId) return null

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        if (response.status === 404) {
          // No settings exist yet, return defaults
          return {
            timezone: "America/New_York",
            startDate: "",
            endDate: "",
            enableNotifications: true,
            enableCommentsNotifications: true,
            enableTaskAssignmentNotifications: true,
          }
        }
        throw new Error(`Failed to fetch settings: ${response.status}`)
      }

      return await safeParseResponse(response)
    } catch (err) {
      console.error('Error fetching settings:', err)
      throw err
    }
  }

  // Fetch workflow stages
  const fetchWorkflow = async () => {
    if (!token || !projectId) return []

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings/workflow`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch workflow: ${response.status}`)
      }

      return await safeParseResponse(response, [])
    } catch (err) {
      console.error('Error fetching workflow:', err)
      return []
    }
  }

  // Load all data
  const fetchData = async () => {
    if (!token || !projectId) {
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      setError(null)

      const [projectData, settingsData, workflowData] = await Promise.all([
        fetchProject(),
        fetchSettings(),
        fetchWorkflow(),
      ])

      setProject(projectData)
      setSettings(settingsData)
      setWorkflow(workflowData)
    } catch (err) {
      console.error('Error fetching data:', err)
      setError(err instanceof Error ? err.message : 'Failed to load data')
    } finally {
      setLoading(false)
    }
  }

  // Load data on mount and when dependencies change
  useEffect(() => {
    // Only fetch if we have both token and projectId
    if (token && projectId) {
      console.log('⚡ Settings: Loading data for project:', projectId)
      fetchData()
    } else {
      console.log('⚠️ Settings: Missing dependencies - token:', !!token, 'projectId:', projectId)
    }
  }, [token, projectId])

  // Add cleanup for timeouts on unmount
  useEffect(() => {
    return () => {
      if (updateProjectTimeoutRef.current) {
        clearTimeout(updateProjectTimeoutRef.current)
      }
      if (updateSettingsTimeoutRef.current) {
        clearTimeout(updateSettingsTimeoutRef.current)
      }
    }
  }, [])

  // Manual save function
  const handleManualSave = async () => {
    if (!project || !settings || !projectId || !token || !hasUnsavedChanges) return

    try {
      setIsSaving(true)
      setError(null)

      // Save project changes
      const projectResponse = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: project.name,
          description: project.description,
          status: project.status,
          priority: project.priority,
        }),
      })

      if (!projectResponse.ok) {
        const errorText = await projectResponse.text()
        throw new Error(`Failed to save project: ${projectResponse.status} ${errorText}`)
      }

      // Save settings changes
      const settingsResponse = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(settings),
      })

      if (!settingsResponse.ok) {
        const errorText = await settingsResponse.text()
        throw new Error(`Failed to save settings: ${settingsResponse.status} ${errorText}`)
      }

      // Update settings with response
      const updatedSettings = await safeParseResponse(settingsResponse, settings)
      setSettings(updatedSettings)

      // Also update the project context if project name/description changed
      if (project) {
        const transformedProject = {
          id: project.id,
          name: project.name,
          description: project.description,
          status: "Active",
          statusValue: project.status || 1,
          priority: "Medium",
          priorityValue: project.priority || 2,
          lastUpdated: new Date().toLocaleDateString(),
          currentSprint: null,
          avatar: project.name.substring(0, 2).toUpperCase(),
          color: "bg-violet-100 text-violet-600",
          publicId: project.publicId ?? project.id.toString(),
        }
        setCurrentProject(transformedProject)
        refreshProjects()
      }

      // Clear unsaved changes flag
      setHasUnsavedChanges(false)

      // Show success message
      toast({
        title: "Success",
        description: "All changes saved successfully",
      })

    } catch (err) {
      console.error('Manual save error:', err)
      setError(err instanceof Error ? err.message : 'Failed to save changes')
      toast({
        title: "Error",
        description: "Failed to save changes",
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle form input changes
  const handleInputChange = (field: string, value: string | boolean) => {
    if (field === 'name' || field === 'description') {
      // Update project properties
      if (!project || !projectId || !token) return
      
      // Store the current project state and new value for the API call
      const currentProject = project
      const updatedProject = { ...project, [field]: value }
      
      // Optimistic update - immediately update the UI
      setProject(updatedProject)
      
      // Mark as having unsaved changes
      setHasUnsavedChanges(true)
      
      // Clear existing timeout
      if (updateProjectTimeoutRef.current) {
        clearTimeout(updateProjectTimeoutRef.current)
      }
      
      // Debounce the API call
      updateProjectTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true)
          console.log('Updating project:', updatedProject) // Debug log
          
          const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              name: updatedProject.name,
              description: updatedProject.description,
              status: updatedProject.status,
              priority: updatedProject.priority,
            }),
          })

          console.log('API Response:', response.status, response.statusText) // Debug log

          if (!response.ok) {
            const errorText = await response.text()
            console.error('API Error:', errorText) // Debug log
            // Revert optimistic update on failure
            setProject(currentProject)
            throw new Error(`Failed to update project: ${response.status} ${response.statusText}`)
          }

          // Get the updated project from the API response
          const updatedProjectFromApi = await safeParseResponse(response, updatedProject)
          setProject(updatedProjectFromApi)

          // Update the project context as well (for ProjectSelector)
          const transformedProject = {
            id: updatedProjectFromApi.id,
            name: updatedProjectFromApi.name,
            description: updatedProjectFromApi.description,
            status: "Active", // Keep existing status
            statusValue: updatedProjectFromApi.status || 1,
            priority: "Medium", // Keep existing priority  
            priorityValue: updatedProjectFromApi.priority || 2,
            lastUpdated: new Date().toLocaleDateString(),
            currentSprint: null,
            avatar: updatedProjectFromApi.name.substring(0, 2).toUpperCase(),
            color: "bg-violet-100 text-violet-600",
            publicId: updatedProjectFromApi.publicId ?? updatedProjectFromApi.id.toString(),
          }
          setCurrentProject(transformedProject)
          
          // Refresh the projects list to ensure everything is in sync
          refreshProjects()

          // Show success message
          toast({
            title: "Success",
            description: "Project updated successfully",
          })
          
          // Clear any previous errors on successful save
          setError(null)
          
          // Clear unsaved changes flag
          setHasUnsavedChanges(false)
        } catch (err) {
          console.error('Project update error:', err)
          setError(err instanceof Error ? err.message : 'Failed to update project')
          // Revert optimistic update on error
          setProject(currentProject)
          toast({
            title: "Error",
            description: "Failed to update project",
            variant: "destructive",
          })
        } finally {
          setIsSaving(false)
        }
      }, 5000) // Wait 5 seconds after user stops typing (longer delay for manual save preference)
    } else {
      // Update settings properties
      if (!settings) return
      
      // Store current settings and create updated version
      const currentSettings = settings
      const updatedSettings = { ...settings, [field]: value }
      
      // Optimistic update for settings
      setSettings(updatedSettings)
      
      // Mark as having unsaved changes
      setHasUnsavedChanges(true)
      
      // Clear existing timeout
      if (updateSettingsTimeoutRef.current) {
        clearTimeout(updateSettingsTimeoutRef.current)
      }
      
      // Debounce the API call
      updateSettingsTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true)
          console.log('Updating settings:', updatedSettings) // Debug log
          
          const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedSettings),
          })

          console.log('Settings API Response:', response.status, response.statusText) // Debug log

          if (!response.ok) {
            const errorText = await response.text()
            console.error('Settings API Error:', errorText) // Debug log
            // Revert optimistic update on failure
            setSettings(currentSettings)
            throw new Error(`Failed to update settings: ${response.status} ${response.statusText}`)
          }

          const result = await safeParseResponse(response, updatedSettings)
          setSettings(result)
          
          // Show success message
          toast({
            title: "Success",
            description: "Settings updated successfully",
          })
          
          setError(null) // Clear errors on success
          
          // Clear unsaved changes flag
          setHasUnsavedChanges(false)
        } catch (err) {
          console.error('Settings update error:', err)
          setError(err instanceof Error ? err.message : 'Failed to update settings')
          // Revert optimistic update on error
          setSettings(currentSettings)
          toast({
            title: "Error",
            description: "Failed to update settings",
            variant: "destructive",
          })
        } finally {
          setIsSaving(false)
        }
      }, 5000) // Wait 5 seconds after user stops typing (longer delay for manual save preference)
    }
  }

  // Loading state
  if (loading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  // Error state
  if (!project) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-4">The project you're looking for doesn't exist or you don't have access to it.</p>
        </div>
      </div>
    )
  }

  const projectSettings = {
    name: project?.name || '',
    description: project?.description || '',
    startDate: formatDateForInput(settings?.startDate),
    endDate: formatDateForInput(settings?.endDate),
    timezone: settings?.timezone || '',
    enableNotifications: settings?.enableNotifications ?? true,
    enableCommentsNotifications: settings?.enableCommentsNotifications ?? true,
    enableTaskAssignmentNotifications: settings?.enableTaskAssignmentNotifications ?? true,
  }

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {project.name} Settings
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">
            {project.description || "No description"}
          </span>
          {isSaving ? (
            <span className="text-sm text-muted-foreground flex items-center">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Saving changes...
            </span>
          ) : hasUnsavedChanges ? (
            <span className="text-sm text-amber-600 flex items-center">
              <div className="w-2 h-2 bg-amber-500 rounded-full mr-2"></div>
              Unsaved changes - click Save Changes to save
            </span>
          ) : (
            <span className="text-sm text-green-600 flex items-center">
              <div className="w-2 h-2 bg-green-500 rounded-full mr-2"></div>
              All changes saved
            </span>
          )}
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
      </div>

      {/* Settings Tabs */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar Navigation */}
        <div className="lg:col-span-1">
          <Card>
            <CardContent className="p-0">
              <Tabs value={activeTab} onValueChange={setActiveTab} orientation="vertical">
                <TabsList className="flex flex-col h-auto w-full bg-transparent p-1 space-y-1">
                  <TabsTrigger
                    value="general"
                    className="w-full justify-start rounded-md border-l-2 border-transparent px-4 py-3 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600 dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
                  >
                    <Info className="mr-2 h-4 w-4" />
                    General
                  </TabsTrigger>
                  <TabsTrigger
                    value="members"
                    className="w-full justify-start rounded-md border-l-2 border-transparent px-4 py-3 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600 dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
                  >
                    <Users className="mr-2 h-4 w-4" />
                    Members & Access
                  </TabsTrigger>
                  <TabsTrigger
                    value="labels"
                    className="w-full justify-start rounded-md border-l-2 border-transparent px-4 py-3 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600 dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
                  >
                    <Tags className="mr-2 h-4 w-4" />
                    Tags & Labels
                  </TabsTrigger>
                  <TabsTrigger
                    value="workflow"
                    className="w-full justify-start rounded-md border-l-2 border-transparent px-4 py-3 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600 dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
                  >
                    <Workflow className="mr-2 h-4 w-4" />
                    Workflow
                  </TabsTrigger>

                  {permissions.canDeleteProject && (
                    <TabsTrigger
                      value="danger"
                      className="w-full justify-start rounded-md border-l-2 border-transparent px-4 py-3 text-red-600 data-[state=active]:border-red-600 data-[state=active]:bg-red-50 data-[state=active]:text-red-600 dark:text-red-400 dark:data-[state=active]:bg-red-950 dark:data-[state=active]:text-red-400"
                    >
                      <AlertTriangle className="mr-2 h-4 w-4" />
                      Danger Zone
                    </TabsTrigger>
                  )}
                </TabsList>
              </Tabs>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
        <div className="lg:col-span-3">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            {/* General Settings Tab */}
            <TabsContent value="general" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>General Settings</CardTitle>
                  <CardDescription>Configure basic project information and preferences</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
          {!permissions.canManageProject && (
            <div className="bg-amber-50 border border-amber-200 rounded-md p-4 mb-4">
              <div className="flex items-start gap-3">
                <Info className="h-5 w-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h4 className="font-medium text-amber-800 mb-1">Read-only Access</h4>
                  <p className="text-sm text-amber-700">
                    You have {permissions.role === 3 ? 'Editor' : 'Viewer'} access to this project. Only project admins and owners can modify general settings.
                  </p>
                </div>
              </div>
            </div>
          )}
          
          <div className="space-y-2">
            <Label htmlFor="project-name">Project Name</Label>
            <Input
              id="project-name"
              value={projectSettings.name || ''}
              onChange={permissions.canManageProject ? (e) => handleInputChange("name", e.target.value) : undefined}
              readOnly={!permissions.canManageProject}
              placeholder="Enter project name"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="project-description">Description</Label>
            <Textarea
              id="project-description"
              value={projectSettings.description || ''}
              onChange={permissions.canManageProject ? (e) => handleInputChange("description", e.target.value) : undefined}
              rows={3}
              readOnly={!permissions.canManageProject}
              placeholder="Enter project description"
            />
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
                  disabled={!permissions.canManageProject}
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
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
                  disabled={!permissions.canManageProject}
                />
                <Calendar className="absolute right-3 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="timezone">Timezone</Label>
            <Select
              value={projectSettings.timezone}
              onValueChange={(value) => handleInputChange("timezone", value)}
              disabled={!permissions.canManageProject}
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

          {/* Save Changes Button */}
          {permissions.canManageProject && (
            <div className="flex items-center justify-between pt-6 border-t">
              <div className="flex items-center gap-2">
                {hasUnsavedChanges && (
                  <div className="flex items-center gap-2 text-sm text-amber-600">
                    <div className="w-2 h-2 bg-amber-500 rounded-full"></div>
                    Unsaved changes
                  </div>
                )}
                {!hasUnsavedChanges && !isSaving && (
                  <div className="flex items-center gap-2 text-sm text-green-600">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    All changes saved
                  </div>
                )}
              </div>
              <Button
                onClick={handleManualSave}
                disabled={!hasUnsavedChanges || isSaving}
                className="bg-violet-600 hover:bg-violet-700 text-white"
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="mr-2 h-4 w-4" />
                    Save Changes
                  </>
                )}
              </Button>
            </div>
          )}
                </CardContent>
              </Card>
            </TabsContent>

            {/* Members & Access Tab */}
            <TabsContent value="members" className="mt-0">
              <MembersAndAccessTab 
                projectId={project.id}
                projectPublicId={projectId}
                permissions={permissions}
              />
            </TabsContent>

            <TabsContent value="labels" className="mt-0">
              <TagsAndLabelsTab 
                projectId={project.id}
                projectPublicId={projectId}
                permissions={permissions}
              />
            </TabsContent>

            <TabsContent value="workflow" className="mt-0">
              <WorkflowTab 
                projectId={project.id}
                projectPublicId={projectId}
                permissions={permissions}
              />
            </TabsContent>



            {permissions.canDeleteProject && (
              <TabsContent value="danger" className="mt-0">
                <DangerZoneTab 
                  projectId={project.id}
                  projectPublicId={projectId}
                  projectName={project.name}
                  permissions={permissions}
                />
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
} 