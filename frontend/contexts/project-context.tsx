"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { usePathname } from "next/navigation"
import { API_BASE_URL } from "@/lib/api"
import { PROJECT_STATUSES, PROJECT_PRIORITIES } from "@/lib/task-constants"

interface Project {
  id: number
  name: string
  description: string
  status?: string
  statusValue?: number
  priority?: string
  priorityValue?: number
  lastUpdated?: string
  currentSprint?: string | null
  avatar?: string
  color?: string
  publicId: string
}

interface ProjectContextType {
  currentProject: Project | null
  projects: Project[]
  setCurrentProject: (project: Project) => void
  switchProject: (projectId: number) => void
  refreshProjects: () => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

// Helper functions to map enum values to labels
const getStatusLabel = (statusValue: number): string => {
  const status = PROJECT_STATUSES.find(s => s.value === statusValue)
  return status ? status.label : "Active"
}

const getPriorityLabel = (priorityValue: number): string => {
  const priority = PROJECT_PRIORITIES.find(p => p.value === priorityValue)
  return priority ? priority.label : "Medium"
}

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { token, isHydrated } = useAuth()
  const pathname = usePathname()
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

  // Extract project ID from pathname
  const getProjectIdFromUrl = (): string | null => {
    const projectMatch = pathname.match(/^\/projects\/([^\/]+)/)
    return projectMatch ? projectMatch[1] : null
  }

  // Fetch projects from API
  const fetchProjects = async () => {
    if (!token) {
      setProjects([])
      return
    }
    
    try {
      const res = await fetch(`${API_BASE_URL}/api/Projects`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      
      if (!res.ok) {
        if (res.status === 401) {
          console.log("Unauthorized access to projects, user may need to re-login")
          setProjects([])
          return
        }
        throw new Error(`Failed to fetch projects: ${res.status} ${res.statusText}`)
      }
      
      const json = await res.json()
      const projectsData = Array.isArray(json)
        ? json
        : Array.isArray(json.$values)
        ? json.$values
        : []
      
      // Transform API data
      const transformedProjects = projectsData.map((p: any) => ({
        id: p.id,
        name: p.name,
        description: p.description,
        status: getStatusLabel(p.status || 1),
        statusValue: p.status || 1,
        priority: getPriorityLabel(p.priority || 2),
        priorityValue: p.priority || 2,
        lastUpdated: new Date(p.createdAt ?? Date.now()).toLocaleDateString(),
        currentSprint: null,
        avatar: p.name.substring(0, 2).toUpperCase(),
        color: "bg-violet-100 text-violet-600",
        publicId: p.publicId ?? p.id.toString(),
      }))
      
      setProjects(transformedProjects)
    } catch (error) {
      console.error("Error fetching projects:", error)
      setProjects([])
    }
  }

  // Only fetch projects after hydration and when we have a token
  useEffect(() => {
    if (isHydrated && token) {
      fetchProjects()
    } else if (isHydrated && !token) {
      setProjects([])
    }
  }, [isHydrated, token])

  // Load project based on URL, localStorage, or default to first project
  useEffect(() => {
    if (!isHydrated || projects.length === 0) return
    
    const urlProjectId = getProjectIdFromUrl()
    
    // 1. First priority: URL parameter (for specific project pages)
    if (urlProjectId) {
      const urlProject = projects.find((p) => p.publicId === urlProjectId || p.id.toString() === urlProjectId)
      if (urlProject) {
        console.log('🎯 Setting project from URL:', urlProject.name, urlProject.publicId)
        setCurrentProjectState(urlProject)
        // Also save to localStorage for future sessions
        localStorage.setItem("currentProjectId", urlProject.id.toString())
        return
      } else {
        console.warn('⚠️ Project from URL not found:', urlProjectId)
      }
    }
    
    // 2. Second priority: Saved project from localStorage (for general pages)
    const savedProjectId = localStorage.getItem("currentProjectId")
    if (savedProjectId) {
      const savedProject = projects.find((p) => p.id.toString() === savedProjectId)
      if (savedProject) {
        console.log('💾 Setting project from localStorage:', savedProject.name)
        setCurrentProjectState(savedProject)
        return
      } else {
        console.warn('⚠️ Saved project not found:', savedProjectId)
      }
    }
    
    // 3. Final fallback: First project in list
    console.log('🔄 Defaulting to first project:', projects[0]?.name)
    setCurrentProjectState(projects[0])
    localStorage.setItem("currentProjectId", projects[0].id.toString())
  }, [isHydrated, projects, pathname])

  const setCurrentProject = (project: Project) => {
    setCurrentProjectState(project)
    if (typeof window !== "undefined") {
      localStorage.setItem("currentProjectId", project.id.toString())
    }
  }

  const switchProject = (projectId: number) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setCurrentProject(project)
    }
  }

  const refreshProjects = () => {
    if (isHydrated && token) {
      fetchProjects()
    }
  }

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        setCurrentProject,
        switchProject,
        refreshProjects,
      }}
    >
      {children}
    </ProjectContext.Provider>
  )
}

export function useProject() {
  const context = useContext(ProjectContext)
  if (context === undefined) {
    throw new Error("useProject must be used within a ProjectProvider")
  }
  return context
}
