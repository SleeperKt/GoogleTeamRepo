"use client"

import { Clock } from "lucide-react"
import { cn } from "@/lib/utils"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Label } from "@/components/ui/label"
import { TASK_PRIORITIES } from "@/lib/task-constants"

interface PrioritySelectorProps {
  value: string
  onChange: (value: string) => void
  label?: string
}

export function PrioritySelector({ value, onChange, label = "Priority" }: PrioritySelectorProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor="priority">{label}</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="priority">
          <SelectValue placeholder="Select priority" />
        </SelectTrigger>
        <SelectContent>
          {TASK_PRIORITIES.map((priority) => (
            <SelectItem key={priority.value} value={priority.value}>
              <div className="flex items-center gap-2">
                <Clock className={cn("h-4 w-4", priority.color)} />
                <span>{priority.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
} 