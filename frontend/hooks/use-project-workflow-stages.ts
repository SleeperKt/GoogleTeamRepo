"use client"

import { useState, useEffect, useCallback } from "react"
import { API_BASE_URL } from "@/lib/api"

export interface ProjectWorkflowStage {
  id: number
  name: string
  color: string
  order: number
  isDefault: boolean
  isCompleted: boolean
  createdAt: string
  taskCount: number
}

interface UseProjectWorkflowStagesReturn {
  stages: ProjectWorkflowStage[]
  loading: boolean
  error: string | null
  fetchStages: () => Promise<void>
  refreshStages: () => void
}

export function useProjectWorkflowStages(projectPublicId?: string): UseProjectWorkflowStagesReturn {
  const [stages, setStages] = useState<ProjectWorkflowStage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchStages = useCallback(async () => {
    if (!projectPublicId) return

    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/settings/workflow`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch workflow stages')
      }

      const data = await response.json()
      // Handle .NET serialization format
      let stagesArray = []
      if (Array.isArray(data)) {
        stagesArray = data
      } else if (data && data.$values && Array.isArray(data.$values)) {
        stagesArray = data.$values
      }
      
      setStages(stagesArray.sort((a: ProjectWorkflowStage, b: ProjectWorkflowStage) => a.order - b.order))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch workflow stages')
      console.error('Error fetching workflow stages:', err)
    } finally {
      setLoading(false)
    }
  }, [projectPublicId])

  const refreshStages = useCallback(() => {
    fetchStages()
  }, [fetchStages])

  // Initial fetch
  useEffect(() => {
    if (projectPublicId) {
      fetchStages()
    }
  }, [projectPublicId, fetchStages])

  return {
    stages,
    loading,
    error,
    fetchStages,
    refreshStages,
  }
} 