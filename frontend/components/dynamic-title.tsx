"use client"

import { useEffect } from "react"
import { usePathname } from "next/navigation"
import { useProject } from "@/contexts/project-context"

export function DynamicTitle() {
  const pathname = usePathname()
  const { currentProject } = useProject()

  useEffect(() => {
    // Get page name from pathname
    const getPageName = (path: string) => {
      // Exact matches first
      if (path === "/projects") return "All Projects"
      if (path === "/profile") return "Profile" 
      if (path === "/billing") return "Billing"
      if (path === "/settings") return "Settings"
      if (path === "/backlog") return "Backlog"
      if (path === "/timeline") return "Timeline"
      if (path === "/" || path === "") return "Dashboard"
      
      // Handle project-specific pages
      if (path.includes("/board")) return "Board"
      if (path.includes("/backlog")) return "Backlog"
      if (path.includes("/reports")) return "Reports"
      if (path.includes("/activities")) return "Activities"
      if (path.includes("/timeline")) return "Timeline"
      if (path.includes("/settings")) return "Settings"
      
      // Handle project detail page (just the project slug)
      const projectMatch = path.match(/^\/projects\/([^\/]+)$/)
      if (projectMatch) return "Overview"
      
      // Default fallback
      return "Project Management"
    }

    const pageName = getPageName(pathname)
    
    // Build title based on context - always start with ProjectHub
    let title = "ProjectHub"
    
    // Check if we're in a project-specific context
    const isProjectPage = pathname.startsWith("/projects/") && pathname !== "/projects"
    
    if (currentProject && isProjectPage) {
      // If we're in a project-specific page: ProjectHub - Project Name - Page
      title = `ProjectHub - ${currentProject.name} - ${pageName}`
    } else if (pageName !== "Project Management") {
      // For global pages: ProjectHub - Page Name
      title = `ProjectHub - ${pageName}`
    }
    // If it's the default case, just keep "ProjectHub"
    
    // Debug logging
    console.log('DynamicTitle Debug:', {
      pathname,
      currentProject: currentProject?.name || 'none',
      pageName,
      isProjectPage,
      finalTitle: title
    })
    
    // Update document title
    document.title = title
  }, [pathname, currentProject])

  return null // This component doesn't render anything
} 