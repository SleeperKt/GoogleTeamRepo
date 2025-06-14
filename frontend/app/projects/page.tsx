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
import { MoreHorizontal, Trash, Edit, Star } from "lucide-react"
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
import { useRouter } from "next/navigation"
import { apiRequest } from "@/lib/api"
import { useAuth } from "@/contexts/auth-context"
import { useProject } from "@/contexts/project-context"

// Initially empty; will be filled from backend

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

  // Add these state variables in the main component
  const [editingProject, setEditingProject] = useState<any>(null)
  const [editProjectDialogOpen, setEditProjectDialogOpen] = useState(false)
  const [deleteProjectDialogOpen, setDeleteProjectDialogOpen] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState<any>(null)
  const [projectList, setProjectList] = useState<any[]>([])

  const { token } = useAuth()
  const { refreshProjects } = useProject()

  useEffect(() => {
    async function loadProjects() {
      try {
        const json = await apiRequest<any>("/api/projects") as any;
        const arr = Array.isArray(json) ? json : Array.isArray(json.$values) ? json.$values : [];
        setProjectList(
          arr.map((p: any) => ({
            id: p.id,
            name: p.name,
            description: p.description ?? "",
            status: "Active",
            lastUpdated: new Date(p.createdAt).toLocaleDateString(),
            owner: "Me",
            initials: p.name.slice(0, 2).toUpperCase(),
            starred: false,
          })),
        );
      } catch (err) {
        console.error("Failed to load projects", err)
      }
    }

    if (token) {
      loadProjects()
    }
  }, [token])

  useEffect(() => {
    setShowEmptyState(projectList.length === 0)
  }, [projectList])

  // Add these handler functions
  const handleEditProject = (project: any) => {
    setEditingProject(project)
    setEditProjectDialogOpen(true)
  }

  const handleDeleteProject = (project: any) => {
    setProjectToDelete(project)
    setDeleteProjectDialogOpen(true)
  }

  const confirmDeleteProject = async () => {
    if (!projectToDelete) return
    try {
      await apiRequest(`/api/projects/${projectToDelete.id}`, { method: "DELETE" })
      setProjectList(projectList.filter((p) => p.id !== projectToDelete.id))
    } catch (err: any) {
      console.error(err)
      alert(err.message ?? "Failed to delete project")
    } finally {
      setDeleteProjectDialogOpen(false)
      setProjectToDelete(null)
    }
  }

  const saveProjectChanges = async (e: React.FormEvent) => {
    e.preventDefault()
    const formData = new FormData(e.target as HTMLFormElement)
    const payload = {
      id: editingProject.id,
      name: formData.get("project-name") as string,
      description: formData.get("project-description") as string,
    }

    try {
      await apiRequest(`/api/projects/${editingProject.id}`, {
        method: "PUT",
        body: JSON.stringify(payload),
      })
      setProjectList(projectList.map((p) => (p.id === editingProject.id ? { ...p, ...payload } : p)))
      setEditProjectDialogOpen(false)
      setEditingProject(null)
    } catch (err: any) {
      console.error(err)
      alert(err.message ?? "Failed to update project")
    }
  }

  const toggleProjectStar = (projectId: number) => {
    setProjectList(projectList.map((p) => (p.id === projectId ? { ...p, starred: !p.starred } : p)))
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
                <SelectItem value="Active">Active</SelectItem>
                <SelectItem value="On Hold">On Hold</SelectItem>
                <SelectItem value="Completed">Completed</SelectItem>
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
          <Button size="lg" className="bg-violet-600 hover:bg-violet-700 text-white">
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
                    onEdit={handleEditProject}
                    onDelete={handleDeleteProject}
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
                  onEdit={handleEditProject}
                  onDelete={handleDeleteProject}
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
              const newProjectPayload = {
                name: nameInput.value,
                description: descriptionInput.value,
              }

              try {
                const created = await apiRequest<any>("/api/projects", {
                  method: "POST",
                  body: JSON.stringify(newProjectPayload),
                })
                // map backend project to UI shape
                const mapped = {
                  id: created.id,
                  name: created.name,
                  description: created.description ?? "",
                  status: "Active",
                  lastUpdated: new Date(created.createdAt).toLocaleDateString(),
                  owner: "Me",
                  initials: created.name.slice(0, 2).toUpperCase(),
                  starred: false,
                }
                setProjectList((prev) => [...prev, mapped])
                setCreateProjectDialogOpen(false)
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

      {/* Edit Project Dialog */}
      <Dialog open={editProjectDialogOpen} onOpenChange={setEditProjectDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Project</DialogTitle>
            <DialogDescription>Update your project details.</DialogDescription>
          </DialogHeader>
          <form onSubmit={saveProjectChanges}>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="project-name">Project name</Label>
                <Input id="project-name" name="project-name" defaultValue={editingProject?.name || ""} required />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-description">Description</Label>
                <Textarea
                  id="project-description"
                  name="project-description"
                  defaultValue={editingProject?.description || ""}
                  rows={3}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="project-status">Status</Label>
                <Select name="project-status" defaultValue={editingProject?.status || "Active"}>
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
              <Button variant="outline" type="button" onClick={() => setEditProjectDialogOpen(false)}>
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
      <AlertDialog open={deleteProjectDialogOpen} onOpenChange={setDeleteProjectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the project "{projectToDelete?.name}" and all
              of its data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={confirmDeleteProject} className="bg-red-600 hover:bg-red-700 text-white">
              Delete Project
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

// Project Card Component
function ProjectCard({
  project,
  onEdit,
  onDelete,
  onToggleStar,
}: {
  project: any
  onEdit: (project: any) => void
  onDelete: (project: any) => void
  onToggleStar: (projectId: number) => void
}) {
  const router = useRouter()

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't navigate if clicking on dropdown or star button
    if (
      (e.target as HTMLElement).closest("[data-dropdown-trigger]") ||
      (e.target as HTMLElement).closest("[data-star-button]")
    ) {
      return
    }

    // Navigate to project page - convert name to URL-friendly format
    const projectSlug = project.name
      .toLowerCase()
      .replace(/\s+/g, "-")
      .replace(/[^a-z0-9-]/g, "")
    router.push(`/projects/${projectSlug}`)
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
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 hover:bg-gray-100 dark:hover:bg-gray-700"
                  data-dropdown-trigger
                >
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onEdit(project)
                  }}
                >
                  <Edit className="mr-2 h-4 w-4" />
                  Edit Project
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation()
                    onDelete(project)
                  }}
                  className="text-red-600 focus:text-red-600"
                >
                  <Trash className="mr-2 h-4 w-4" />
                  Delete Project
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <CardDescription className="line-clamp-2 min-h-[40px]">{project.description}</CardDescription>
        <div className="mt-4 flex items-center justify-between">
          <Badge className={`${statusColors[project.status]} font-normal`}>{project.status}</Badge>
          <div className="flex items-center gap-2">
            <Avatar className="h-6 w-6">
              <AvatarImage src={`/placeholder.svg?height=32&width=32`} alt={project.owner} />
              <AvatarFallback className="text-xs bg-violet-100 text-violet-600">{project.initials}</AvatarFallback>
            </Avatar>
            <span className="text-sm text-gray-500 dark:text-gray-400">Updated {project.lastUpdated}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
