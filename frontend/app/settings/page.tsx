"use client"

import { useEffect } from "react"
import { useRouter } from "next/navigation"
import { Loader2 } from "lucide-react"
import { useProject } from "@/contexts/project-context"

export default function GlobalSettingsRedirect() {
  const router = useRouter()
  const { currentProject } = useProject()

  useEffect(() => {
    if (currentProject?.publicId) {
      // Redirect to the current project's settings
      router.replace(`/projects/${currentProject.publicId}/settings`)
    } else {
      // If no project is selected, redirect to projects page
      router.replace("/projects")
    }
  }, [currentProject, router])

  return (
    <div className="flex items-center justify-center h-screen">
      <div className="text-center">
        <Loader2 className="h-8 w-8 animate-spin mx-auto mb-4" />
        <p className="text-muted-foreground">Redirecting to project settings...</p>
      </div>
    </div>
  )
} 