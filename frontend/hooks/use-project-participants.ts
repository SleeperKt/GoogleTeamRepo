import { useState, useEffect } from "react"
import { TeamMember } from "@/lib/types"
import { apiRequest } from "@/lib/api"

export function useProjectParticipants(projectPublicId?: string, isOpen: boolean = false) {
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadParticipants = async () => {
      if (!isOpen || !projectPublicId) {
        setTeamMembers([])
        return
      }

      setIsLoading(true)
      setError(null)

      try {
        // First get internal project id
        const project: { id: number } = await apiRequest(`/api/projects/public/${projectPublicId}`)
        if (!project?.id) {
          throw new Error("Project not found")
        }

        // Fetch participants
        const raw = await apiRequest(`/api/projects/${project.id}/participants`)

        // Backend (ASP.NET) may wrap collections in {$values:[...]}. Normalize here.
        const participantArray: Array<any> = Array.isArray(raw)
          ? raw
          : Array.isArray((raw as any)?.$values)
            ? (raw as any).$values
            : []

        const members: TeamMember[] = participantArray.map((p) => ({
          id: p.userId || p.UserId,
          name: p.userName || p.UserName,
          initials: (p.userName || p.UserName || "")
            .split(" ")
            .map((n: string) => n[0])
            .join("")
            .toUpperCase(),
        }))

        setTeamMembers(members)
      } catch (err) {
        console.error("Failed to load project participants", err)
        setError(err instanceof Error ? err.message : "Failed to load participants")
        setTeamMembers([])
      } finally {
        setIsLoading(false)
      }
    }

    loadParticipants()
  }, [isOpen, projectPublicId])

  return {
    teamMembers,
    isLoading,
    error,
  }
} 