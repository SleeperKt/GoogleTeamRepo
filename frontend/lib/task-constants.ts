export const TASK_LABELS = [
  { id: 1, name: "Frontend", color: "#93c5fd" },
  { id: 2, name: "Backend", color: "#86efac" },
  { id: 3, name: "Bug", color: "#fca5a5" },
  { id: 4, name: "Feature", color: "#c4b5fd" },
  { id: 5, name: "Documentation", color: "#fcd34d" },
] as const

export const TASK_PRIORITIES = [
  { value: "high", label: "High", color: "text-red-500" },
  { value: "medium", label: "Medium", color: "text-yellow-500" },
  { value: "low", label: "Low", color: "text-blue-500" },
] as const

export const TASK_STAGES = [
  { id: 1, name: "To Do" },
  { id: 2, name: "In Progress" },
  { id: 3, name: "Review" },
  { id: 4, name: "Done" },
] as const

export const TASK_TYPES = [
  { value: "feature", label: "Feature" },
  { value: "bug", label: "Bug" },
  { value: "task", label: "Task" },
  { value: "story", label: "Story" },
  { value: "epic", label: "Epic" },
] as const

export const PRIORITY_MAP: Record<string | number, number> = {
  low: 1,
  medium: 2,
  high: 3,
  critical: 4,
  1: 1,
  2: 2,
  3: 3,
  4: 4,
} as const

export const PROJECT_PRIORITIES = [
  { value: 1, label: "Low", color: "text-blue-500" },
  { value: 2, label: "Medium", color: "text-yellow-500" },
  { value: 3, label: "High", color: "text-orange-500" },
  { value: 4, label: "Critical", color: "text-red-500" },
] as const

export const PROJECT_STATUSES = [
  { value: 1, label: "Active", color: "text-green-500" },
  { value: 2, label: "On Hold", color: "text-gray-500" },
  { value: 3, label: "Completed", color: "text-blue-500" },
] as const 