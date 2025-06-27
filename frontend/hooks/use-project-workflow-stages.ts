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
  createStage: (name: string, color: string, isCompleted: boolean) => Promise<ProjectWorkflowStage | null>
  updateStage: (stageId: number, name: string, color: string, order: number, isCompleted: boolean) => Promise<ProjectWorkflowStage | null>
  deleteStage: (stageId: number) => Promise<boolean>
  reorderStages: (stageIds: number[]) => Promise<boolean>
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

  const createStage = async (name: string, color: string, isCompleted: boolean): Promise<ProjectWorkflowStage | null> => {
    if (!projectPublicId) return null

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/settings/workflow`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          color,
          isCompleted
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Create workflow stage API error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to create workflow stage: ${response.status} ${response.statusText}`)
      }

      const newStage = await response.json()
      setStages(prev => [...prev, newStage].sort((a, b) => a.order - b.order))
      
      // Trigger storage event to notify other components
      window.localStorage.setItem('workflowStagesChanged', Date.now().toString())
      window.dispatchEvent(new CustomEvent('workflowStagesUpdated', { 
        detail: { projectPublicId, action: 'create', stage: newStage }
      }))
      
      return newStage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create workflow stage')
      console.error('Error creating workflow stage:', err)
      return null
    }
  }

  const updateStage = async (stageId: number, name: string, color: string, order: number, isCompleted: boolean): Promise<ProjectWorkflowStage | null> => {
    if (!projectPublicId) return null

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/settings/workflow/${stageId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          color,
          order,
          isCompleted
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update workflow stage API error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to update workflow stage: ${response.status} ${response.statusText}`)
      }

      const updatedStage = await response.json()
      setStages(prev => prev.map(s => s.id === stageId ? updatedStage : s))
      
      // Trigger storage event to notify other components
      window.localStorage.setItem('workflowStagesChanged', Date.now().toString())
      window.dispatchEvent(new CustomEvent('workflowStagesUpdated', { 
        detail: { projectPublicId, action: 'update', stage: updatedStage }
      }))
      
      return updatedStage
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update workflow stage')
      console.error('Error updating workflow stage:', err)
      return null
    }
  }

  const deleteStage = async (stageId: number): Promise<boolean> => {
    if (!projectPublicId) return false

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/settings/workflow/${stageId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete workflow stage API error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to delete workflow stage: ${response.status} ${response.statusText}`)
      }

      setStages(prev => prev.filter(s => s.id !== stageId))
      
      // Trigger storage event to notify other components
      window.localStorage.setItem('workflowStagesChanged', Date.now().toString())
      window.dispatchEvent(new CustomEvent('workflowStagesUpdated', { 
        detail: { projectPublicId, action: 'delete', stageId }
      }))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete workflow stage')
      console.error('Error deleting workflow stage:', err)
      return false
    }
  }

  const reorderStages = async (stageIds: number[]): Promise<boolean> => {
    if (!projectPublicId) return false

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/settings/workflow/reorder`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          stageIds
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Reorder workflow stages API error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to reorder workflow stages: ${response.status} ${response.statusText}`)
      }

      // Update local state to reflect new order
      setStages(prev => {
        const stageMap = new Map(prev.map(s => [s.id, s]))
        return stageIds.map((id, index) => {
          const stage = stageMap.get(id)
          return stage ? { ...stage, order: index } : null
        }).filter(Boolean) as ProjectWorkflowStage[]
      })
      
      // Trigger storage event to notify other components
      window.localStorage.setItem('workflowStagesChanged', Date.now().toString())
      window.dispatchEvent(new CustomEvent('workflowStagesUpdated', { 
        detail: { projectPublicId, action: 'reorder', stageIds }
      }))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to reorder workflow stages')
      console.error('Error reordering workflow stages:', err)
      return false
    }
  }

  const refreshStages = useCallback(() => {
    fetchStages()
  }, [fetchStages])

  // Initial fetch
  useEffect(() => {
    if (projectPublicId) {
      fetchStages()
    }
  }, [projectPublicId, fetchStages])

  // Listen for storage events from other tabs/components
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'workflowStagesChanged' && projectPublicId) {
        fetchStages()
      }
    }

    const handleWorkflowStagesUpdated = (event: CustomEvent) => {
      if (event.detail?.projectPublicId === projectPublicId) {
        // Workflow stages were updated in the same tab, data is already fresh
        console.log('Workflow stages updated:', event.detail)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('workflowStagesUpdated', handleWorkflowStagesUpdated as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('workflowStagesUpdated', handleWorkflowStagesUpdated as EventListener)
    }
  }, [projectPublicId, fetchStages])

  return {
    stages,
    loading,
    error,
    fetchStages,
    createStage,
    updateStage,
    deleteStage,
    reorderStages,
    refreshStages,
  }
} 