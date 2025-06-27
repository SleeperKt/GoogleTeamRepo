export interface TeamMember {
  id: string
  name: string
  email?: string
  avatar?: string
  initials: string
}

export interface TaskFormData {
  title: string
  description: string
  assigneeId?: string
  labels: string[]
  dueDate?: Date
  priority: number
  estimate?: number
  type: string
  stage: string
}

export interface TaskFormErrors {
  [key: string]: string
}

export interface CreateTaskSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStage?: string
  onTaskCreated?: (task: any) => void
  projectPublicId?: string
  selectedColumnId?: string
}

export enum InvitationStatus {
  Pending = 0,
  Accepted = 1,
  Declined = 2,
  Cancelled = 3
}

export enum ParticipantRole {
  Owner = 1,
  Admin = 2,
  Viewer = 3
}

export interface ProjectInvitation {
  id: number
  projectId: number
  projectName: string
  projectDescription: string
  inviterId: string
  inviterName: string
  inviterEmail: string
  inviteeId: string
  inviteeName: string
  inviteeEmail: string
  role: ParticipantRole
  status: InvitationStatus
  createdAt: string
  respondedAt?: string
  message?: string
}

export interface CreateInvitationRequest {
  inviteeEmail: string
  role: ParticipantRole
  message?: string
}

export interface RespondToInvitationRequest {
  status: InvitationStatus
} 