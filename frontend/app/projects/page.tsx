"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { FolderKanban, Plus, Search } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"

// Add these imports at the top
import { Star } from "lucide-react"
import { useRouter, useSearchParams } from "next/navigation"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useProject } from "@/contexts/project-context"
import { PROJECT_PRIORITIES, PROJECT_STATUSES } from "@/lib/task-constants"

// Initially empty; will be filled from backend

// Helper functions to map enum values to labels
const getStatusLabel = (statusValue: number): string => {
  const status = PROJECT_STATUSES.find(s => s.value === statusValue)
  return status ? status.label : "Active"
}

const getPriorityLabel = (priorityValue: number): string => {
  const priority = PROJECT_PRIORITIES.find(p => p.value === priorityValue)
  return priority ? priority.label : "Medium"
}

const getPriorityColor = (priorityValue: number): string => {
  const priority = PROJECT_PRIORITIES.find(p => p.value === priorityValue)
  return priority ? priority.color : "text-yellow-500"
}

// Status badge color mapping
const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "On Hold": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
}

export default function ProjectsPage() {
  const [searchQuery, setSearchQuery] = useState("")
  const [statusFilter, setStatusFilter] = useState("All")
  const [sortBy, setSortBy] = useState("Last Updated")
  const [showEmptyState, setShowEmptyState] = useState(false) // Will switch to true when project list empty
  const [createProjectDialogOpen, setCreateProjectDialogOpen] = useState(false)


  const [projectList, setProjectList] = useState<any[]>([])

  const { token, user } = useAuth()
  const { refreshProjects } = useProject()
  const searchParams = useSearchParams()

  // Helper functions for starred projects persistence
  const getStarredProjectsKey = () => `starred-projects-${user?.id || 'default'}`
  
  const getStarredProjects = (): string[] => {
    if (typeof window === 'undefined') return []
    try {
      const stored = localStorage.getItem(getStarredProjectsKey())
      return stored ? JSON.parse(stored) : []
    } catch {
      return []
    }
  }

  const saveStarredProjects = (starredIds: string[]) => {
    if (typeof window === 'undefined') return
    try {
      localStorage.setItem(getStarredProjectsKey(), JSON.stringify(starredIds))
    } catch (err) {
      console.error('Failed to save starred projects:', err)
    }
  }

  useEffect(() => {
    async function loadProjects() {
      try {
        const json = await apiRequest<any>("/api/projects") as any;
        const arr = Array.isArray(json) ? json : Array.isArray(json.$values) ? json.$values : [];
        const starredIds = getStarredProjects();
        
        setProjectList(
          arr.map((p: any) => {
            const projectId = p.publicId ?? p.id.toString();
            return {
              id: projectId,
              name: p.name,
              description: p.description ?? "",
              status: getStatusLabel(p.status || 1),
              statusValue: p.status || 1,
              priority: getPriorityLabel(p.priority || 2),
              priorityValue: p.priority || 2,
              lastUpdated: new Date(p.createdAt).toLocaleDateString(),
              owner: "Me",
              initials: p.name.slice(0, 2).toUpperCase(),
              starred: starredIds.includes(projectId),
            };
          }),
        );
      } catch (err) {
        console.error("Failed to load projects", err)
      }
    }

    if (token) {
      loadProjects()
    }
  }, [token, user?.id])

  useEffect(() => {
    setShowEmptyState(projectList.length === 0)
  }, [projectList])

  // Check for create query parameter
  useEffect(() => {
    if (searchParams.get('create') === 'true') {
      setCreateProjectDialogOpen(true)
    }
  }, [searchParams])

  // Check for refresh query parameter and reload projects
  useEffect(() => {
    if (searchParams.get('refresh') === 'true' && token) {
      // Force refresh the projects context
      refreshProjects()
      
      // Reload local project list with a slight delay to ensure backend deletion is complete
      const reloadWithDelay = setTimeout(async () => {
        try {
          const json = await apiRequest<any>("/api/projects") as any;
          const arr = Array.isArray(json) ? json : Array.isArray(json.$values) ? json.$values : [];
          const starredIds = getStarredProjects();
          
          setProjectList(
            arr.map((p: any) => {
              const projectId = p.publicId ?? p.id.toString();
              return {
                id: projectId,
                name: p.name,
                description: p.description ?? "",
                status: getStatusLabel(p.status || 1),
                statusValue: p.status || 1,
                priority: getPriorityLabel(p.priority || 2),
                priorityValue: p.priority || 2,
                lastUpdated: new Date(p.createdAt).toLocaleDateString(),
                owner: "Me",
                initials: p.name.slice(0, 2).toUpperCase(),
                starred: starredIds.includes(projectId),
              };
            }),
          );
          
          // Clear the refresh parameter from URL after processing
          const url = new URL(window.location.href)
          url.searchParams.delete('refresh')
          window.history.replaceState({}, '', url.toString())
        } catch (err) {
          console.error("Failed to reload projects", err)
        }
      }, 300) // Small delay to ensure backend operation is complete
      
      return () => clearTimeout(reloadWithDelay)
    }
  }, [searchParams, token, refreshProjects])



  const toggleProjectStar = (projectId: string) => {
    const updatedList = projectList.map((p) => (p.id === projectId ? { ...p, starred: !p.starred } : p))
    setProjectList(updatedList)
    
    // Update localStorage with new starred state
    const starredIds = updatedList.filter(p => p.starred).map(p => p.id)
    saveStarredProjects(starredIds)
  }

  // Update the filtered projects to use projectList instead of projects
  const filteredProjects = projectList
    .filter((project) => {
      // Apply search filter
      const matchesSearch =
        project.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        project.description.toLowerCase().includes(searchQuery.toLowerCase())

      // Apply status filter
      const matchesStatus = statusFilter === "All" || project.status === statusFilter

      return matchesSearch && matchesStatus
    })
    .sort((a, b) => {
      // Apply sorting
      if (sortBy === "Name") {
        return a.name.localeCompare(b.name)
      } else if (sortBy === "Status") {
        return a.status.localeCompare(b.status)
      } else {
        // Default: Last Updated (just for demo - in real app would parse dates)
        return a.lastUpdated.localeCompare(b.lastUpdated)
      }
    })

  const starredProjects = filteredProjects.filter((project) => project.starred)
  const nonStarredProjects = filteredProjects.filter((project) => !project.starred)

  return (
    <div className="p-4 md:p-6">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <h1 className="text-2xl md:text-3xl font-bold">Projects</h1>
        <Button
          size="lg"
          className="bg-violet-600 hover:bg-violet-700 text-white"
          onClick={() => setCreateProjectDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" /> Create New Project
        </Button>
      </div>

      {/* Toolbar Section */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-grow">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search projects..."
              className="pl-8"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <div className="flex flex-col sm:flex-row gap-4">
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Filter by status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All</SelectItem>
                {PROJECT_STATUSES.map((status) => (
                  <SelectItem key={status.value} value={status.label}>
                    {status.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Name">Sort by Name</SelectItem>
                <SelectItem value="Last Updated">Sort by Last Updated</SelectItem>
                <SelectItem value="Status">Sort by Status</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {(showEmptyState || filteredProjects.length === 0) && (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <FolderKanban className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No projects yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Click 'Create New Project' to get started with your first project.
          </p>
          <Button
            size="lg"
            className="bg-violet-600 hover:bg-violet-700 text-white"
            onClick={() => setCreateProjectDialogOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" /> Create New Project
          </Button>
        </div>
      )}

      {/* Project Display Section */}
      {!showEmptyState && filteredProjects.length > 0 && (
        <>
          {/* Starred Projects */}
          {starredProjects.length > 0 && (
            <div className="mb-8">
              <h2 className="text-lg font-medium mb-4">Starred</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {starredProjects.map((project) => (
                  <ProjectCard
                    key={project.id}
                    project={project}
                    onToggleStar={toggleProjectStar}
                  />
                ))}
              </div>
            </div>
          )}

          {/* All Projects */}
          <div>
            <h2 className="text-lg font-medium mb-4">All Projects</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {nonStarredProjects.map((project) => (
                <ProjectCard
                  key={project.id}
                  project={project}
                  onToggleStar={toggleProjectStar}
                />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Create Project Dialog */}
      <Dialog open={createProjectDialogOpen} onOpenChange={setCreateProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Project</DialogTitle>
            <DialogDescription>Add a new project to your workspace.</DialogDescription>
          </DialogHeader>
          <form
            onSubmit={async (e) => {
              e.preventDefault()
              const form = e.target as HTMLFormElement
              const nameInput = form.elements.namedItem("project-name") as HTMLInputElement
              const descriptionInput = form.elements.namedItem(
                "project-description",
              ) as HTMLTextAreaElement
              const statusSelect = form.elements.namedItem("project-status") as HTMLSelectElement
              const prioritySelect = form.elements.namedItem("project-priority") as HTMLSelectElement
              const newProjectPayload = {
                name: nameInput.value,
                description: descriptionInput.value,
                status: parseInt(statusSelect.value),
                priority: parseInt(prioritySelect.value),
              }

              try {
                const created = await apiRequest<any>("/api/projects", {
                  method: "POST",
                  body: JSON.stringify(newProjectPayload),
                })
                // map backend project to UI shape
                const mapped = {
                  id: created.publicId ?? created.id.toString(),
                  name: created.name,
                  description: created.description ?? "",
                  status: getStatusLabel(created.status || newProjectPayload.status),
                  statusValue: created.status || newProjectPayload.status,
                  priority: getPriorityLabel(created.priority || newProjectPayload.priority),
                  priorityValue: created.priority || newProjectPayload.priority,
                  lastUpdated: new Date(created.createdAt).toLocaleDateString(),
                  owner: "Me",
                  initials: created.name.slice(0, 2).toUpperCase(),
                  starred: false,
                }
                setProjectList((prev) => [...prev, mapped])
                setCreateProjectDialogOpen(false)
                // Persist the new project as the active scope so that ProjectContext
                // selects it when we refresh the list. This guarantees that the
                // current project is switched to the newly created one across
                // the entire app.
                if (typeof window !== "undefined") {
                  try {
                    localStorage.setItem("currentProjectId", created.id.toString())
                  } catch (_) {
                    /* noop */
                  }
                }
                // Refresh projects in all contexts
                refreshProjects()
              } catch (err: any) {
                console.error(err)
                alert(err.message ?? "Failed to create project")
              }
            }}
          >
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input id="project-name" placeholder="Enter project name" required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea id="project-description" placeholder="Enter project description" rows={3} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="project-status">Status</Label>
                  <Select name="project-status" defaultValue="1">
                    <SelectTrigger>
                      <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Active</SelectItem>
                      <SelectItem value="2">On Hold</SelectItem>
                      <SelectItem value="3">Completed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="project-priority">Priority</Label>
                  <Select name="project-priority" defaultValue="2">
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">Low</SelectItem>
                      <SelectItem value="2">Medium</SelectItem>
                      <SelectItem value="3">High</SelectItem>
                      <SelectItem value="4">Critical</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" type="button" onClick={() => setCreateProjectDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" className="bg-violet-600 hover:bg-violet-700 text-white">
                Create Project
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>


    </div>
  )
}

// Project Card Component
function ProjectCard({
  project,
  onToggleStar,
}: {
  project: any
  onToggleStar: (projectId: string) => void
}) {
  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on star button
    if ((e.target as HTMLElement).closest("[data-star-button]")) {
      return
    }

    // Navigate to project page - convert name to URL-friendly format
    router.push(`/projects/${project.id}`)
  }

  const handleStarClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    onToggleStar(project.id)
  }

  return (
    <Card
      className="overflow-hidden transition-all duration-200 hover:shadow-md hover:border-violet-200 cursor-pointer bg-white dark:bg-gray-800"
      onClick={handleCardClick}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-100 dark:bg-violet-900 text-violet-600 dark:text-violet-300">
              <FolderKanban className="h-4 w-4" />
            </div>
            <CardTitle className="text-base">{project.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
              onClick={handleStarClick}
              data-star-button
            >
              <Star className={`h-4 w-4 ${project.starred ? "text-yellow-400 fill-yellow-400" : "text-gray-400"}`} />
            </Button>

          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="line-clamp-2 min-h-[40px]">{project.description}</CardDescription>
        <div className="mt-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Badge className={`${statusColors[project.status]} font-normal`}>{project.status}</Badge>
            <Badge variant="outline" className={`${getPriorityColor(project.priorityValue)} border-current font-normal`}>
              {project.priority}
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src="/placeholder-user.jpg" alt={project.owner} />
              <AvatarFallback className="text-xs bg-violet-100 text-violet-600">{project.initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-500 dark:text-gray-400">Updated {project.lastUpdated}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
