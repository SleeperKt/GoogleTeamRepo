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