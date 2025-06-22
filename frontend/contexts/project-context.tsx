"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { API_BASE_URL } from "@/lib/api"

interface Project {
  id: number
  name: string
  description: string
  status?: string
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

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const { token, isHydrated } = useAuth()
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null)
  const [projects, setProjects] = useState<Project[]>([])

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
        status: "Active",
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

  // Load saved project from localStorage on mount or set first project as default
  useEffect(() => {
    if (!isHydrated || projects.length === 0) return
    
    const savedProjectId = localStorage.getItem("currentProjectId")
    if (savedProjectId) {
      const project = projects.find((p) => p.id.toString() === savedProjectId)
      if (project) {
        setCurrentProjectState(project)
      } else {
        // Fallback to first project if saved project not found
        setCurrentProjectState(projects[0])
      }
    } else {
      // Default to first project
      setCurrentProjectState(projects[0])
    }
  }, [isHydrated, projects])

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
