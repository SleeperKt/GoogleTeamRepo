"use client"

import type React from "react"

import { useState, useEffect, useCallback, useRef } from "react"
import { useSearchParams } from "next/navigation"
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
import { API_BASE_URL } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useProject } from "@/contexts/project-context"
import { useProjectLabels, type ProjectLabel } from "@/hooks/use-project-labels"
import { SendInvitationDialog } from "@/components/send-invitation-dialog"
import { invitationApi } from "@/lib/api"
import { toast } from "@/hooks/use-toast"

// Types
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
  taskCount: number
  tasks?: number
}

interface Project {
  id: number
  name: string
  description: string
  publicId: string
  status: number
  priority: number
  createdAt: string
}

interface TeamMember {
  userId: string
  userName: string
  role: number // Role comes as number from API
  joinedAt: string
  email: string
}

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
  const { user, token } = useAuth()
  const { currentProject } = useProject()
  const projectId = currentProject?.publicId // Use selected project from context
  
  // Use labels hook
  const { 
    labels, 
    loading: labelsLoading, 
    error: labelsError, 
    createLabel: hookCreateLabel, 
    updateLabel: hookUpdateLabel, 
    deleteLabel: hookDeleteLabel 
  } = useProjectLabels(projectId)
  
  const [activeTab, setActiveTab] = useState("general")
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [showDeleteDialog, setShowDeleteDialog] = useState(false)
  const [editingLabel, setEditingLabel] = useState<number | null>(null)
  const [editingLabelData, setEditingLabelData] = useState<{name: string, color: string}>({name: "", color: ""})
  const [newLabelName, setNewLabelName] = useState("")
  const [newLabelColor, setNewLabelColor] = useState(labelColors[0])
  const [draggedWorkflowId, setDraggedWorkflowId] = useState<number | null>(null)
  const [showEmptyState, setShowEmptyState] = useState(false)
  
  // Real data state
  const [project, setProject] = useState<Project | null>(null)
  const [settings, setSettings] = useState<ProjectSettings | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowStage[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [pendingInvites, setPendingInvites] = useState<any[]>([])
  
  // Workflow editing states
  const [editingWorkflowId, setEditingWorkflowId] = useState<number | null>(null)
  const [newWorkflowName, setNewWorkflowName] = useState("")
  
  // Debounced update refs
  const updateProjectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  // Helper function to safely parse JSON responses
  const safeParseResponse = async (response: Response, fallbackData?: any) => {
    const contentType = response.headers.get('content-type')
    if (contentType && contentType.includes('application/json')) {
      const responseText = await response.text()
      if (responseText.trim()) {
        try {
          return JSON.parse(responseText)
        } catch (parseError) {
          console.warn('Failed to parse JSON response:', parseError)
          return fallbackData
        }
      } else {
        console.warn('Empty JSON response received')
        return fallbackData
      }
    } else {
      console.warn('Non-JSON response received')
      return fallbackData
    }
  }

  // Fetch data on component mount
  useEffect(() => {
    if (currentProject) {
      fetchData()
      fetchProjectInvitations()
    }
  }, [currentProject, token])

  // Cleanup timeout on unmount
  useEffect(() => {
    return () => {
      if (updateProjectTimeoutRef.current) {
        clearTimeout(updateProjectTimeoutRef.current)
      }
    }
  }, [])

  const fetchData = async () => {
    if (!token) return

    try {
      setLoading(true)
      setError(null)

      if (projectId) {
        // Fetch project-specific data
        const projectResponse = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        })

        if (projectResponse.ok) {
          const projectData = await projectResponse.json()
          setProject(projectData)
        }

        // Fetch project settings, workflow, and team in parallel (labels managed by hook)
        const [settingsRes, workflowRes, teamRes] = await Promise.all([
          fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
          fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings/workflow`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          }),
          fetch(`${API_BASE_URL}/api/projects/public/${projectId}/participants`, {
            headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
          })
        ])

        if (settingsRes.ok) {
          const settingsData = await settingsRes.json()
          setSettings(settingsData)
        }

        // Labels are managed by the hook

        if (workflowRes.ok) {
          const workflowData = await workflowRes.json()
          console.log('Workflow data received:', workflowData) // Debug log
          
          // Handle .NET serialization format with $values for workflow too
          let workflowArray = [];
          if (Array.isArray(workflowData)) {
            workflowArray = workflowData;
          } else if (workflowData && workflowData.$values && Array.isArray(workflowData.$values)) {
            workflowArray = workflowData.$values;
          }
          
          console.log('Parsed workflow array:', workflowArray);
          setWorkflow(workflowArray)
        } else {
          console.error('Failed to fetch workflow:', workflowRes.status, workflowRes.statusText)
        }

        if (teamRes.ok) {
          const teamData = await teamRes.json()
          console.log('Team data received:', teamData) // Debug log
          console.log('Team data type:', typeof teamData, 'Is array:', Array.isArray(teamData)) // More debug
          console.log('Current user:', user) // Debug current user
          
          // Handle different response structures
          let membersArray = [];
          if (Array.isArray(teamData)) {
            membersArray = teamData;
          } else if (teamData && teamData.$values && Array.isArray(teamData.$values)) {
            // Handle .NET serialization format with $values
            membersArray = teamData.$values;
          } else if (teamData && teamData.data && Array.isArray(teamData.data)) {
            membersArray = teamData.data;
          } else if (teamData && typeof teamData === 'object') {
            // If it's a single object, wrap it in an array
            membersArray = [teamData];
          }
          
          console.log('Parsed members array:', membersArray);
          if (membersArray.length > 0) {
            console.log('First member properties:', Object.keys(membersArray[0]));
            console.log('First member object:', membersArray[0]);
          }
          setTeamMembers(membersArray)
        } else {
          console.error('Failed to fetch team members:', teamRes.status, teamRes.statusText)
          const errorText = await teamRes.text()
          console.error('Error details:', errorText)
        }
      } else {
        // Global settings - could be user preferences (not implemented yet)
        // For now, use empty states
        setProject(null)
        setSettings(null)
        setWorkflow([])
        setTeamMembers([])
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred')
    } finally {
      setLoading(false)
    }
  }

  // Role mapping from numbers to strings
  const getRoleName = (roleNumber: number): string => {
    switch (roleNumber) {
      case 1: return 'Owner'
      case 2: return 'Admin'
      case 3: return 'Editor'
      case 4: return 'Viewer'
      default: return 'Editor'
    }
  }

  // Create a combined projectSettings object for the UI
  const projectSettings = {
    name: project?.name || '',
    description: project?.description || '',
    defaultStatus: settings?.defaultTaskView || '',
    startDate: settings?.startDate || '',
    endDate: settings?.endDate || '',
    timezone: settings?.timezone || '',
    workflow: workflow.map(stage => ({ ...stage, tasks: stage.tasks || stage.taskCount || 0 })),
    labels: labels,
    members: teamMembers.map(member => ({
      id: member.userId,
      name: member.userName || 'Unknown User',
      email: member.email || '',
      role: getRoleName(member.role), // Convert numeric role to string
      avatar: '', // Add avatar logic if needed
      initials: (member.userName || 'U').split(' ').map(n => n[0]).join('').toUpperCase(),
      joinedAt: member.joinedAt
    })),
    pendingInvites: pendingInvites,
    integrations: [] as Array<{id: number, name: string, logo: string, status: string, details: string}> // Add empty integrations array for now
  }

  // Debug log
  console.log('Team members count:', teamMembers.length)
  console.log('Project settings members:', projectSettings.members.length)

  // Handle form input changes
  const handleInputChange = (field: string, value: string) => {
    if (field === 'name' || field === 'description') {
      // Update project properties
      if (!project || !projectId || !token) return
      
      // Optimistic update - immediately update the UI
      setProject(prev => prev ? { ...prev, [field]: value } : null)
      
      // Clear existing timeout
      if (updateProjectTimeoutRef.current) {
        clearTimeout(updateProjectTimeoutRef.current)
      }
      
      // Debounce the API call
      updateProjectTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true)
          const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({
              ...project,
              [field]: value
            }),
          })

          if (!response.ok) {
            // Revert optimistic update on failure
            setProject(project)
            throw new Error('Failed to update project')
          }

          // Handle potentially empty response
          let updated = project
          const contentType = response.headers.get('content-type')
          if (contentType && contentType.includes('application/json')) {
            const responseText = await response.text()
            if (responseText.trim()) {
              try {
                updated = JSON.parse(responseText)
              } catch (parseError) {
                console.warn('Failed to parse JSON response, using optimistic update:', parseError)
                // Keep the optimistic update since the API call was successful
                updated = { ...project, [field]: value }
              }
            } else {
              // Empty response but successful - keep optimistic update
              updated = { ...project, [field]: value }
            }
          } else {
            // Non-JSON response but successful - keep optimistic update
            updated = { ...project, [field]: value }
          }
          
          setProject(updated)
          // Clear any previous errors on successful save
          setError(null)
        } catch (err) {
          console.error('Project update error:', err)
          setError(err instanceof Error ? err.message : 'Failed to update project')
          // Revert optimistic update on error
          setProject(project)
        } finally {
          setIsSaving(false)
        }
      }, 1000) // Wait 1 second after user stops typing
    } else {
      // Update settings properties
      if (!settings) return
      
      const settingsFieldMap: { [key: string]: string } = {
        'defaultStatus': 'defaultTaskView',
        'startDate': 'startDate',
        'endDate': 'endDate',
        'timezone': 'timezone'
      }
      
      const settingsField = settingsFieldMap[field] || field
      updateSettings({ [settingsField]: value })
    }
  }

  // Update settings
  const updateSettings = async (updatedSettings: Partial<ProjectSettings>) => {
    if (!token || !settings || !projectId) return

    try {
      setIsSaving(true)
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...settings,
          ...updatedSettings
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update settings')
      }

      const updated = await safeParseResponse(response, { ...settings, ...updatedSettings })
      setSettings(updated)
      setError(null) // Clear errors on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle member role change
  const handleRoleChange = async (memberId: string, newRole: string) => {
    if (!token || !currentProject) return

    // Convert role string back to number for API
    const getRoleNumber = (roleName: string): number => {
      switch (roleName) {
        case 'Owner': return 1
        case 'Admin': return 2
        case 'Editor': return 3
        case 'Viewer': return 4
        default: return 3
      }
    }

    try {
      setIsSaving(true)
      const response = await fetch(`${API_BASE_URL}/api/projects/${currentProject.id}/participants/${memberId}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRole: getRoleNumber(newRole) }),
      })

      if (response.ok) {
        // Update local state with numeric role
        setTeamMembers(prev => prev.map(member => 
          member.userId === memberId ? { ...member, role: getRoleNumber(newRole) } : member
        ))
        
        // Show success message
        toast({
          title: "Success",
          description: "Member role updated successfully",
        })
      } else {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to update member role')
      }
    } catch (err) {
      console.error('Error updating member role:', err)
      setError(err instanceof Error ? err.message : 'Failed to update member role')
      
      // Show error toast
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update member role',
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle member removal
  const handleRemoveMember = async (memberId: string) => {
    if (!token || !currentProject) return

    try {
      setIsSaving(true)
      const response = await fetch(`${API_BASE_URL}/api/projects/${currentProject.id}/participants/${memberId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (response.ok) {
        // Update local state
        setTeamMembers(prev => prev.filter(member => member.userId !== memberId))
        
        // Show success message
        toast({
          title: "Success",
          description: "Member removed successfully",
        })
      } else {
        const errorText = await response.text()
        throw new Error(errorText || 'Failed to remove member')
      }
    } catch (err) {
      console.error('Error removing member:', err)
      setError(err instanceof Error ? err.message : 'Failed to remove member')
      
      // Show error toast
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to remove member',
        variant: "destructive",
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Handle invite member
  const handleInviteMember = async (email: string, role: string) => {
    if (!token || !projectId) return

    try {
      setIsSaving(true)
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/participants`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email, role }),
      })

      if (response.ok) {
        // Add to pending invites
        const newInvite = { email, role, sentAt: "Just now" }
        setPendingInvites(prev => [...prev, newInvite])
      }
    } catch (err) {
      setError('Failed to invite member')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle cancel invite
  const handleCancelInvite = async (invitationId: number) => {
    try {
      setIsSaving(true)
      await invitationApi.cancelInvitation(invitationId)
      // Refresh pending invitations after cancellation
      fetchProjectInvitations()
    } catch (err) {
      setError('Failed to cancel invitation')
    } finally {
      setIsSaving(false)
    }
  }

  // Handle add label
  const handleAddLabel = async () => {
    if (!newLabelName.trim()) return

    try {
      const newLabel = await hookCreateLabel(newLabelName, newLabelColor)
      if (newLabel) {
        setNewLabelName("")
        setNewLabelColor(labelColors[0])
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create label')
    }
  }

  // Update existing label function to work with real data
  const handleUpdateLabel = async (labelId: number, name: string, color: string) => {
    try {
      const updatedLabel = await hookUpdateLabel(labelId, name, color)
      if (updatedLabel) {
        setEditingLabel(null)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update label')
    }
  }

  // Delete label function
  const handleDeleteLabel = async (labelId: number) => {
    try {
      await hookDeleteLabel(labelId)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete label')
    }
  }



  // Handle workflow drag start
  const handleWorkflowDragStart = (e: React.DragEvent, id: number) => {
    setDraggedWorkflowId(id)
  }

  // Handle workflow drag over
  const handleWorkflowDragOver = (e: React.DragEvent) => {
    e.preventDefault()
  }

  // Handle workflow drop (reorder workflow stages)
  const handleWorkflowDrop = async (e: React.DragEvent, targetId: number) => {
    e.preventDefault()

    if (draggedWorkflowId === null || draggedWorkflowId === targetId || !token || !projectId) return

    const sourceIndex = workflow.findIndex((item) => item.id === draggedWorkflowId)
    const targetIndex = workflow.findIndex((item) => item.id === targetId)

    if (sourceIndex === -1 || targetIndex === -1) return

    const newWorkflow = [...workflow]
    const [movedItem] = newWorkflow.splice(sourceIndex, 1)
    newWorkflow.splice(targetIndex, 0, movedItem)

    // Update order values based on new positions
    const updatedWorkflow = newWorkflow.map((stage, index) => ({
      ...stage,
      order: index
    }))

    try {
      // The backend expects StageIds array in the correct order
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings/workflow/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stageIds: updatedWorkflow.map(stage => stage.id)
        }),
      })

      if (response.ok) {
        setWorkflow(updatedWorkflow)
        console.log('✅ Workflow stages reordered successfully')
        
        // Trigger board refresh by posting a message to other tabs/windows
        // This will notify the board page that workflow has changed
        if (typeof window !== 'undefined') {
          window.localStorage.setItem('workflowChanged', Date.now().toString())
          // Also trigger a custom event for same-tab communication
          window.dispatchEvent(new CustomEvent('workflowReordered', { 
            detail: { projectId, updatedWorkflow } 
          }))
        }
      } else {
        console.error('❌ Failed to reorder workflow stages:', await response.text())
        setError('Failed to reorder workflow stages')
      }
    } catch (err) {
      console.error('❌ Error reordering workflow stages:', err)
      setError('Failed to reorder workflow stages')
    }

    setDraggedWorkflowId(null)
  }

  // Handle add workflow stage
  const handleAddWorkflowStage = async (name: string) => {
    if (!token || !projectId) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings/workflow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          color: '#94a3b8', // Default color
          order: workflow.length
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to create workflow stage')
      }

      const fallbackStage = { 
        id: Date.now(), // Temporary ID
        name, 
        color: '#94a3b8', 
        order: workflow.length,
        isDefault: false,
        isCompleted: false,
        createdAt: new Date().toISOString(),
        taskCount: 0 
      }
      const newStage = await safeParseResponse(response, fallbackStage)
      setWorkflow(prev => [...prev, newStage])
      setNewWorkflowName("")
      setError(null) // Clear errors on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow stage')
    }
  }

  // Handle rename workflow stage
  const handleRenameWorkflowStage = async (id: number, newName: string) => {
    if (!token || !projectId) return

    try {
      const stage = workflow.find(w => w.id === id)
      if (!stage) return

      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings/workflow/${id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name: newName,
          color: stage.color,
          order: stage.order,
          isDefault: stage.isDefault,
          isCompleted: stage.isCompleted
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to update workflow stage')
      }

      const fallbackStage = { ...stage, name: newName }
      const updatedStage = await safeParseResponse(response, fallbackStage)
      setWorkflow(prev => prev.map(w => w.id === id ? updatedStage : w))
      setEditingWorkflowId(null)
      setError(null) // Clear errors on success
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow stage')
    }
  }

  // Handle delete workflow stage
  const handleDeleteWorkflowStage = async (id: number) => {
    if (!token || !projectId) return

    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings/workflow/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        throw new Error('Failed to delete workflow stage')
      }

      setWorkflow(prev => prev.filter(w => w.id !== id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow stage')
    }
  }

  // Handle toggle integration (placeholder - integrations not implemented yet)
  const handleToggleIntegration = (id: number) => {
    // TODO: Implement real integration management
    console.log('Toggle integration:', id)
  }

  // Toggle empty state for demo
  const toggleEmptyState = () => {
    setShowEmptyState(!showEmptyState)
  }

  // Function to fetch project invitations
  const fetchProjectInvitations = async () => {
    if (!currentProject) return

    try {
      const invitations = await invitationApi.getProjectInvitations(currentProject.id)
      
      // Debug: Log what we received
      console.log("Received invitations:", invitations)
      console.log("Is array?", Array.isArray(invitations))
      console.log("Type:", typeof invitations)
      
      // Ensure we always have an array
      const invitationArray = Array.isArray(invitations) ? invitations : []
      
      // Filter to only show pending invitations
      const pending = invitationArray.filter(inv => inv.status === 0) // Pending status
      setPendingInvites(pending.map(inv => ({
        email: inv.inviteeEmail,
        role: inv.role === 1 ? "Owner" : inv.role === 2 ? "Admin" : inv.role === 3 ? "Editor" : "Viewer",
        sentAt: new Date(inv.createdAt).toLocaleDateString(),
        id: inv.id
      })))
    } catch (error) {
      console.error("Failed to fetch project invitations:", error)
      // Reset to empty array on error
      setPendingInvites([])
    }
  }

  // Function to handle invitation sent callback
  const handleInvitationSent = () => {
    fetchProjectInvitations() // Refresh pending invitations
    fetchData() // Refresh team members in case invitation was immediately accepted
  }

  // Show loading state while fetching data
  if (loading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex items-center justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin" />
          <span className="ml-2">Loading settings...</span>
        </div>
      </div>
    )
  }

  // Show error state
  if (error && !projectId) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
          <AlertCircle className="h-12 w-12 text-red-500 mb-4" />
          <h3 className="text-xl font-medium mb-2">Unable to load settings</h3>
          <p className="text-gray-500 mb-4">{error}</p>
          <Button onClick={fetchData}>Try Again</Button>
        </div>
      </div>
    )
  }

  // If no project selected, show project selection message
  if (!currentProject) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="mb-6">
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Settings</h1>
          <p className="text-muted-foreground">Please select a project from the dropdown to configure its settings</p>
        </div>
        
        <Card>
          <CardContent className="py-12 text-center">
            <Info className="h-12 w-12 text-blue-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Project Settings</h3>
            <p className="text-muted-foreground">
              Select a project from the top-left dropdown to view and edit its settings
            </p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">
          {currentProject.name} Settings
        </h1>
        <div className="flex items-center gap-2">
          {currentProject.description && (
            <span className="text-muted-foreground">{currentProject.description}</span>
          )}
          {isSaving ? (
            <span className="text-sm text-muted-foreground flex items-center">
              <Loader2 className="h-3 w-3 mr-1 animate-spin" />
              Saving changes...
            </span>
          ) : (
            <span className="text-sm text-muted-foreground">Changes saved automatically</span>
          )}
        </div>
        {error && (
          <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md text-red-600 text-sm">
            {error}
          </div>
        )}
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
                      value={projectSettings.name || ''}
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
                    {currentProject && (
                      <SendInvitationDialog 
                        projectId={currentProject.id} 
                        onInvitationSent={handleInvitationSent}
                        trigger={
                          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                            <Plus className="mr-2 h-4 w-4" /> Invite Member
                          </Button>
                        }
                      />
                    )}
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
                      {teamMembers.map((member, index) => {
                        const memberRoleName = getRoleName(member.role)
                        const isCurrentUser = member.userId === user?.id
                        const isOwner = member.role === 1 // Owner role
                        const currentUserRole = teamMembers.find(m => m.userId === user?.id)?.role
                        const currentUserIsOwner = currentUserRole === 1
                        
                        return (
                          <div key={member.userId || `member-${index}`} className="px-4 py-3">
                            <div className="grid grid-cols-12 gap-4 items-center">
                              <div className="col-span-6 flex items-center gap-3">
                                <Avatar className="h-8 w-8">
                                  <AvatarFallback>
                                    {member.userName.split(' ').map(n => n[0]).join('').toUpperCase()}
                                  </AvatarFallback>
                                </Avatar>
                                <div>
                                  <div className="font-medium">{member.userName}</div>
                                  <div className="text-sm text-muted-foreground">{member.email}</div>
                                </div>
                              </div>
                              <div className="col-span-3">
                                <Select
                                  value={memberRoleName}
                                  onValueChange={(value) => handleRoleChange(member.userId, value)}
                                  disabled={!currentUserIsOwner || isOwner || isCurrentUser}
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
                                {isOwner || isCurrentUser ? (
                                  <Badge variant="outline">{isOwner ? "Owner" : "You"}</Badge>
                                ) : currentUserIsOwner ? (
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                    onClick={() => handleRemoveMember(member.userId)}
                                  >
                                    <Trash className="h-4 w-4" />
                                    <span className="sr-only md:not-sr-only md:ml-2">Remove</span>
                                  </Button>
                                ) : null}
                              </div>
                            </div>
                          </div>
                        )
                      })}
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
                                    onClick={() => handleCancelInvite(invite.id)}
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
                                    value={editingLabelData.name}
                                    onChange={(e) => {
                                      setEditingLabelData(prev => ({ ...prev, name: e.target.value }))
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
                                          editingLabelData.color === color ? "ring-2 ring-offset-1 ring-violet-600" : "",
                                        )}
                                        style={{ backgroundColor: color }}
                                        onClick={() => {
                                          setEditingLabelData(prev => ({ ...prev, color }))
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
                                    onClick={() => handleUpdateLabel(label.id, editingLabelData.name, editingLabelData.color)}
                                  >
                                    <Check className="h-4 w-4" />
                                    <span className="sr-only md:not-sr-only md:ml-2">Save</span>
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => {
                                    setEditingLabel(label.id)
                                    setEditingLabelData({ name: label.name, color: label.color })
                                  }}>
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
                            <Input 
                              id="stage-name" 
                              placeholder="e.g., In Testing"
                              value={newWorkflowName}
                              onChange={(e) => setNewWorkflowName(e.target.value)}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setNewWorkflowName("")}>
                            Cancel
                          </Button>
                          <Button
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                            onClick={() => handleAddWorkflowStage(newWorkflowName)}
                            disabled={!newWorkflowName.trim()}
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
                      {workflow.map((stage) => (
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
                              <Badge variant="outline">{stage.taskCount || stage.tasks || 0}</Badge>
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
                                      const taskCount = stage.taskCount || stage.tasks || 0
                                      if (taskCount > 0) {
                                        if (
                                          confirm(
                                            `This stage contains ${taskCount} tasks. Are you sure you want to delete it?`,
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
                          {workflow.map((stage) => (
                            <div
                              key={stage.id}
                              className="flex-shrink-0 w-40 bg-white dark:bg-gray-800 rounded-md border shadow-sm p-3"
                            >
                              <div className="font-medium mb-2">{stage.name}</div>
                              <div className="text-sm text-muted-foreground">{stage.taskCount || stage.tasks || 0} tasks</div>
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
