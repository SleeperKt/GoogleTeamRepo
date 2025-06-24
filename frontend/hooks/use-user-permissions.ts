import { useState, useEffect, useCallback } from 'react'
import { apiRequest } from '@/lib/api'
import { ParticipantRole } from '@/lib/types'
import { useAuth } from '@/contexts/auth-context'

interface UserPermissions {
  canView: boolean
  canEdit: boolean
  canManageProject: boolean
  canInviteUsers: boolean
  canDeleteProject: boolean
  canTransferOwnership: boolean
  canArchiveProject: boolean
  role: ParticipantRole | null
  isLoading: boolean
}

export function useUserPermissions(projectId: string | undefined) {
  const { user } = useAuth()
  const [permissions, setPermissions] = useState<UserPermissions>({
    canView: false,
    canEdit: false,
    canManageProject: false,
    canInviteUsers: false,
    canDeleteProject: false,
    canTransferOwnership: false,
    canArchiveProject: false,
    role: null,
    isLoading: true,
  })

  const fetchUserRole = useCallback(async () => {
    if (!projectId || !user?.email) {
      setPermissions(prev => ({ ...prev, isLoading: false }))
      return
    }

    try {
      console.log('🔧 PERMISSIONS DEBUG: Fetching participants for project:', projectId, 'user email:', user.email)
      
      // Get user role from participants endpoint using public ID
      const participants = await apiRequest<Array<{
        userId: string
        role: number
        userName: string
        email: string
      }>>(`/api/projects/public/${projectId}/participants`)

      console.log('🔧 PERMISSIONS DEBUG: Participants response:', participants)

      // Get current user from auth context
      const currentParticipant = participants.find(p => p.email === user.email)
      
      console.log('🔧 PERMISSIONS DEBUG: Current participant:', currentParticipant)
      
      if (currentParticipant) {
        const role = currentParticipant.role as ParticipantRole
        
        setPermissions({
          role,
          canView: true, // All participants can view
          canEdit: role <= ParticipantRole.Editor, // Editor and above
          canManageProject: role <= ParticipantRole.Admin, // Admin and above
          canInviteUsers: role <= ParticipantRole.Admin, // Admin and above
          canDeleteProject: role === ParticipantRole.Owner, // Only owner
          canTransferOwnership: role === ParticipantRole.Owner, // Only owner
          canArchiveProject: role <= ParticipantRole.Admin, // Admin and above
          isLoading: false,
        })
      } else {
        // User is not a participant
        setPermissions({
          role: null,
          canView: false,
          canEdit: false,
          canManageProject: false,
          canInviteUsers: false,
          canDeleteProject: false,
          canTransferOwnership: false,
          canArchiveProject: false,
          isLoading: false,
        })
      }
    } catch (error) {
      console.error('Error fetching user permissions:', error)
      setPermissions(prev => ({ ...prev, isLoading: false }))
    }
  }, [projectId, user?.email])

  useEffect(() => {
    fetchUserRole()
  }, [fetchUserRole])

  const refreshPermissions = useCallback(() => {
    fetchUserRole()
  }, [fetchUserRole])

  return { ...permissions, refreshPermissions }
}

// Utility function to get role name
export function getRoleName(role: ParticipantRole): string {
  switch (role) {
    case ParticipantRole.Owner:
      return 'Owner'
    case ParticipantRole.Admin:
      return 'Admin'
    case ParticipantRole.Editor:
      return 'Editor'
    case ParticipantRole.Viewer:
      return 'Viewer'
    default:
      return 'Unknown'
  }
}

// Utility function to check if user can perform specific actions
export function hasPermission(role: ParticipantRole | null, requiredRole: ParticipantRole): boolean {
  if (!role) return false
  return role <= requiredRole
} 