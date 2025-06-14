"use client"

import type React from "react"

import { createContext, useContext, useState, useEffect } from "react"

// Sample projects data
const SAMPLE_PROJECTS = [
  {
    id: "testproject-dev",
    name: "TestProject-Dev",
    description: "Development project for the TestProject platform",
    status: "Active",
    lastUpdated: "1 hour ago",
    currentSprint: "Sprint 4 (May 15 - May 29)",
    avatar: "TP",
    color: "bg-violet-100 text-violet-600",
  },
  {
    id: "marketing-website",
    name: "Marketing Website",
    description: "Company marketing website redesign",
    status: "On Hold",
    lastUpdated: "2 days ago",
    currentSprint: null,
    avatar: "MW",
    color: "bg-blue-100 text-blue-600",
  },
  {
    id: "mobile-app",
    name: "Mobile App",
    description: "iOS and Android mobile application",
    status: "Active",
    lastUpdated: "30 minutes ago",
    currentSprint: "Sprint 2 (May 20 - June 3)",
    avatar: "MA",
    color: "bg-green-100 text-green-600",
  },
  {
    id: "api-redesign",
    name: "API Redesign",
    description: "Backend API architecture overhaul",
    status: "Planning",
    lastUpdated: "1 day ago",
    currentSprint: null,
    avatar: "AR",
    color: "bg-orange-100 text-orange-600",
  },
]

interface Project {
  id: string
  name: string
  description: string
  status: string
  lastUpdated: string
  currentSprint: string | null
  avatar: string
  color: string
}

interface ProjectContextType {
  currentProject: Project | null
  projects: Project[]
  setCurrentProject: (project: Project) => void
  switchProject: (projectId: string) => void
}

const ProjectContext = createContext<ProjectContextType | undefined>(undefined)

export function ProjectProvider({ children }: { children: React.ReactNode }) {
  const [currentProject, setCurrentProjectState] = useState<Project | null>(null)
  const [projects] = useState<Project[]>(SAMPLE_PROJECTS)

  // Load saved project from localStorage on mount
  useEffect(() => {
    const savedProjectId = localStorage.getItem("currentProjectId")
    if (savedProjectId) {
      const project = projects.find((p) => p.id === savedProjectId)
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
  }, [projects])

  const setCurrentProject = (project: Project) => {
    setCurrentProjectState(project)
    localStorage.setItem("currentProjectId", project.id)
  }

  const switchProject = (projectId: string) => {
    const project = projects.find((p) => p.id === projectId)
    if (project) {
      setCurrentProject(project)
    }
  }

  return (
    <ProjectContext.Provider
      value={{
        currentProject,
        projects,
        setCurrentProject,
        switchProject,
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
