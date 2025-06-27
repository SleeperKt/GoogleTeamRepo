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
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { toast } from "@/hooks/use-toast"
import { API_BASE_URL } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useUserPermissions } from "@/hooks/use-user-permissions"

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

export default function ProjectGeneralSettingsPage() {
  const params = useParams()
  const router = useRouter()
  const { user, token } = useAuth()
  const projectId = params.slug as string
  
  const { refreshPermissions, ...permissions } = useUserPermissions(projectId)
  
  const [loading, setLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [project, setProject] = useState<Project | null>(null)
  const [settings, setSettings] = useState<ProjectSettings | null>(null)
  const [workflow, setWorkflow] = useState<WorkflowStage[]>([])
  
  // Timeout ref for debounced saving
  const updateProjectTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const updateSettingsTimeoutRef = useRef<NodeJS.Timeout | null>(null)

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

  // Handle form input changes
  const handleInputChange = (field: string, value: string | boolean) => {
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
              name: field === 'name' ? value : project.name,
              description: field === 'description' ? value : project.description,
              status: project.status,
              priority: project.priority,
            }),
          })

          if (!response.ok) {
            // Revert optimistic update on failure
            setProject(project)
            throw new Error('Failed to update project')
          }

          // Show success message
          toast({
            title: "Success",
            description: "Project updated successfully",
          })
          
          // Clear any previous errors on successful save
          setError(null)
        } catch (err) {
          console.error('Project update error:', err)
          setError(err instanceof Error ? err.message : 'Failed to update project')
          // Revert optimistic update on error
          setProject(project)
          toast({
            title: "Error",
            description: "Failed to update project",
            variant: "destructive",
          })
        } finally {
          setIsSaving(false)
        }
      }, 1000) // Wait 1 second after user stops typing
    } else {
      // Update settings properties
      if (!settings) return
      
      // Optimistic update for settings
      const updatedSettings = { ...settings, [field]: value }
      setSettings(updatedSettings)
      
      // Clear existing timeout
      if (updateSettingsTimeoutRef.current) {
        clearTimeout(updateSettingsTimeoutRef.current)
      }
      
      // Debounce the API call
      updateSettingsTimeoutRef.current = setTimeout(async () => {
        try {
          setIsSaving(true)
          const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectId}/settings`, {
            method: 'PUT',
            headers: {
              'Authorization': `Bearer ${token}`,
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedSettings),
          })

          if (!response.ok) {
            // Revert optimistic update on failure
            setSettings(settings)
            throw new Error('Failed to update settings')
          }

          const result = await safeParseResponse(response, updatedSettings)
          setSettings(result)
          
          // Show success message
          toast({
            title: "Success",
            description: "Settings updated successfully",
          })
          
          setError(null) // Clear errors on success
        } catch (err) {
          console.error('Settings update error:', err)
          setError(err instanceof Error ? err.message : 'Failed to update settings')
          // Revert optimistic update on error
          setSettings(settings)
          toast({
            title: "Error",
            description: "Failed to update settings",
            variant: "destructive",
          })
        } finally {
          setIsSaving(false)
        }
      }, 1000) // Wait 1 second after user stops typing
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

      {/* General Settings Card */}
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
        </CardContent>
      </Card>
    </div>
  )
} 