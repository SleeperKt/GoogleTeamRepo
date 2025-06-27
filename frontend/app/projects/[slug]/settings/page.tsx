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
  Zap,
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
  enableTimeTracking: boolean
  enableCommentsNotifications: boolean
  enableTaskAssignmentNotifications: boolean
  defaultTaskView: string
  allowGuestAccess: boolean
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
  const { token } = useAuth()
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

  // Handle remove participant (placeholder - would need backend implementation)
  const handleRemoveParticipant = async (participantId: string) => {
    // This would require backend implementation
    toast({
      title: "Info",
      description: "Remove participant functionality coming soon",
    })
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
            {participants.map((participant) => (
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
                  <Badge variant={getRoleBadgeVariant(participant.role)}>
                    {getRoleLabel(participant.role)}
                  </Badge>
                  {permissions.canManageProject && participant.role !== ParticipantRole.Owner && (
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleRemoveParticipant(participant.userId)}>
                          <Trash2 className="h-4 w-4 mr-2" />
                          Remove from project
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  )}
                </div>
              </div>
            ))}
            
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

  // Fetch project data
  const fetchProject = async () => {
    if (!token || !projectId) return null

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error(`Failed to fetch project: ${response.status}`)
      }

      return await safeParseResponse(response)
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
            enableTimeTracking: false,
            enableCommentsNotifications: true,
            enableTaskAssignmentNotifications: true,
            defaultTaskView: "board",
            allowGuestAccess: false,
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

  // Load data on mount
  useEffect(() => {
    fetchData()
  }, [token, projectId])

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
          <Button onClick={() => router.push('/projects')} variant="outline">
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Projects
          </Button>
        </div>
      </div>
    )
  }

  const projectSettings = {
    name: project?.name || '',
    description: project?.description || '',
    defaultStatus: settings?.defaultTaskView || '',
    startDate: settings?.startDate || '',
    endDate: settings?.endDate || '',
    timezone: settings?.timezone || '',
    enableNotifications: settings?.enableNotifications ?? true,
    enableTimeTracking: settings?.enableTimeTracking ?? false,
    enableCommentsNotifications: settings?.enableCommentsNotifications ?? true,
    enableTaskAssignmentNotifications: settings?.enableTaskAssignmentNotifications ?? true,
    allowGuestAccess: settings?.allowGuestAccess ?? false,
  }

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center gap-4 mb-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => router.push(`/projects/${projectId}`)}
            className="text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Project
          </Button>
        </div>
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {project.name} Settings
        </h1>
        <div className="flex items-center gap-2">
          {project.description && (
            <span className="text-muted-foreground">{project.description}</span>
          )}
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
                  <TabsTrigger
                    value="integrations"
                    className="w-full justify-start rounded-md border-l-2 border-transparent px-4 py-3 data-[state=active]:border-violet-600 data-[state=active]:bg-violet-50 data-[state=active]:text-violet-600 dark:data-[state=active]:bg-violet-950 dark:data-[state=active]:text-violet-300"
                  >
                    <Zap className="mr-2 h-4 w-4" />
                    Integrations
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
            {/* Debug info */}
            <p className="text-xs text-muted-foreground">
              Can manage: {permissions.canManageProject.toString()} | Role: {permissions.role} | Loading: {permissions.isLoading.toString()}
            </p>
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



          <div className="space-y-2">
            <Label htmlFor="default-status">Default Task View</Label>
            <Select
              value={projectSettings.defaultStatus}
              onValueChange={(value) => handleInputChange("defaultTaskView", value)}
              disabled={!permissions.canManageProject}
            >
              <SelectTrigger id="default-status">
                <SelectValue placeholder="Select a default view" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="board">Board View</SelectItem>
                <SelectItem value="list">List View</SelectItem>
                <SelectItem value="calendar">Calendar View</SelectItem>
              </SelectContent>
            </Select>
            <p className="text-sm text-muted-foreground">Default view for project tasks</p>
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

          <div className="space-y-4">
            <h3 className="text-lg font-medium">Notifications</h3>
            
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-notifications">Enable Notifications</Label>
                <Switch 
                  id="enable-notifications" 
                  checked={projectSettings.enableNotifications}
                  onCheckedChange={(checked) => handleInputChange("enableNotifications", checked)}
                  disabled={!permissions.canManageProject}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Receive general project notifications
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-comments">Comment Notifications</Label>
                <Switch 
                  id="enable-comments" 
                  checked={projectSettings.enableCommentsNotifications}
                  onCheckedChange={(checked) => handleInputChange("enableCommentsNotifications", checked)}
                  disabled={!permissions.canManageProject}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Get notified when someone comments on tasks
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-assignments">Task Assignment Notifications</Label>
                <Switch 
                  id="enable-assignments" 
                  checked={projectSettings.enableTaskAssignmentNotifications}
                  onCheckedChange={(checked) => handleInputChange("enableTaskAssignmentNotifications", checked)}
                  disabled={!permissions.canManageProject}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Get notified when tasks are assigned to you
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="enable-time-tracking">Enable Time Tracking</Label>
                <Switch 
                  id="enable-time-tracking" 
                  checked={projectSettings.enableTimeTracking}
                  onCheckedChange={(checked) => handleInputChange("enableTimeTracking", checked)}
                  disabled={!permissions.canManageProject}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Allow team members to track time on tasks
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="allow-guest-access">Allow Guest Access</Label>
                <Switch 
                  id="allow-guest-access" 
                  checked={projectSettings.allowGuestAccess}
                  onCheckedChange={(checked) => handleInputChange("allowGuestAccess", checked)}
                  disabled={!permissions.canManageProject}
                />
              </div>
              <p className="text-sm text-muted-foreground">
                Allow external collaborators to view project tasks
              </p>
            </div>
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
              <Card>
                <CardHeader>
                  <CardTitle>Workflow</CardTitle>
                  <CardDescription>Customize your project workflow stages</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Workflow management coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="integrations" className="mt-0">
              <Card>
                <CardHeader>
                  <CardTitle>Integrations</CardTitle>
                  <CardDescription>Connect external tools and services</CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">Integrations coming soon...</p>
                </CardContent>
              </Card>
            </TabsContent>

            {permissions.canDeleteProject && (
              <TabsContent value="danger" className="mt-0">
                <Card>
                  <CardHeader>
                    <CardTitle>Danger Zone</CardTitle>
                    <CardDescription>Irreversible and destructive actions</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <p className="text-muted-foreground">Danger zone actions coming soon...</p>
                  </CardContent>
                </Card>
              </TabsContent>
            )}
          </Tabs>
        </div>
      </div>
    </div>
  )
} 