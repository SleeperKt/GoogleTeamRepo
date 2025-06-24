"use client"

import { useState, useEffect, useCallback } from "react"
import { API_BASE_URL } from "@/lib/api"

export interface ProjectLabel {
  id: number
  name: string
  color: string
  order: number
  createdAt: string
}

interface UseProjectLabelsReturn {
  labels: ProjectLabel[]
  loading: boolean
  error: string | null
  fetchLabels: () => Promise<void>
  createLabel: (name: string, color: string) => Promise<ProjectLabel | null>
  updateLabel: (labelId: number, name: string, color: string) => Promise<ProjectLabel | null>
  deleteLabel: (labelId: number) => Promise<boolean>
  refreshLabels: () => void
}

export function useProjectLabels(projectPublicId?: string): UseProjectLabelsReturn {
  const [labels, setLabels] = useState<ProjectLabel[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchLabels = useCallback(async () => {
    if (!projectPublicId) return

    try {
      setLoading(true)
      setError(null)
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/settings/labels`, {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error('Failed to fetch labels')
      }

      const data = await response.json()
      // Handle .NET serialization format
      let labelsArray = []
      if (Array.isArray(data)) {
        labelsArray = data
      } else if (data && data.$values && Array.isArray(data.$values)) {
        labelsArray = data.$values
      }
      
      setLabels(labelsArray.sort((a: ProjectLabel, b: ProjectLabel) => a.order - b.order))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch labels')
      console.error('Error fetching labels:', err)
    } finally {
      setLoading(false)
    }
  }, [projectPublicId])

  const createLabel = async (name: string, color: string): Promise<ProjectLabel | null> => {
    if (!projectPublicId) return null

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/settings/labels`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          color
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Create label API error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to create label: ${response.status} ${response.statusText}`)
      }

      const newLabel = await response.json()
      setLabels(prev => [...prev, newLabel].sort((a, b) => a.order - b.order))
      
      // Trigger storage event to notify other components
      window.localStorage.setItem('labelsChanged', Date.now().toString())
      window.dispatchEvent(new CustomEvent('labelsUpdated', { 
        detail: { projectPublicId, action: 'create', label: newLabel }
      }))
      
      return newLabel
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create label')
      console.error('Error creating label:', err)
      return null
    }
  }

  const updateLabel = async (labelId: number, name: string, color: string): Promise<ProjectLabel | null> => {
    if (!projectPublicId) return null

    try {
      const token = localStorage.getItem('token')
      const existingLabel = labels.find(l => l.id === labelId)
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/settings/labels/${labelId}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          color,
          order: existingLabel?.order || 0
        }),
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Update label API error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to update label: ${response.status} ${response.statusText}`)
      }

      const updatedLabel = await response.json()
      setLabels(prev => prev.map(l => l.id === labelId ? updatedLabel : l))
      
      // Trigger storage event to notify other components
      window.localStorage.setItem('labelsChanged', Date.now().toString())
      window.dispatchEvent(new CustomEvent('labelsUpdated', { 
        detail: { projectPublicId, action: 'update', label: updatedLabel }
      }))
      
      return updatedLabel
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update label')
      console.error('Error updating label:', err)
      return null
    }
  }

  const deleteLabel = async (labelId: number): Promise<boolean> => {
    if (!projectPublicId) return false

    try {
      const token = localStorage.getItem('token')
      
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${projectPublicId}/settings/labels/${labelId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error('Delete label API error:', response.status, response.statusText, errorText)
        throw new Error(`Failed to delete label: ${response.status} ${response.statusText}`)
      }

      setLabels(prev => prev.filter(l => l.id !== labelId))
      
      // Trigger storage event to notify other components
      window.localStorage.setItem('labelsChanged', Date.now().toString())
      window.dispatchEvent(new CustomEvent('labelsUpdated', { 
        detail: { projectPublicId, action: 'delete', labelId }
      }))
      
      return true
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete label')
      console.error('Error deleting label:', err)
      return false
    }
  }

  const refreshLabels = useCallback(() => {
    fetchLabels()
  }, [fetchLabels])

  // Initial fetch
  useEffect(() => {
    if (projectPublicId) {
      fetchLabels()
    }
  }, [projectPublicId, fetchLabels])

  // Listen for storage events from other tabs/components
  useEffect(() => {
    const handleStorageChange = (event: StorageEvent) => {
      if (event.key === 'labelsChanged' && projectPublicId) {
        fetchLabels()
      }
    }

    const handleLabelsUpdated = (event: CustomEvent) => {
      if (event.detail?.projectPublicId === projectPublicId) {
        // Labels were updated in the same tab, data is already fresh
        console.log('Labels updated:', event.detail)
      }
    }

    window.addEventListener('storage', handleStorageChange)
    window.addEventListener('labelsUpdated', handleLabelsUpdated as EventListener)

    return () => {
      window.removeEventListener('storage', handleStorageChange)
      window.removeEventListener('labelsUpdated', handleLabelsUpdated as EventListener)
    }
  }, [projectPublicId, fetchLabels])

  return {
    labels,
    loading,
    error,
    fetchLabels,
    createLabel,
    updateLabel,
    deleteLabel,
    refreshLabels,
  }
} 