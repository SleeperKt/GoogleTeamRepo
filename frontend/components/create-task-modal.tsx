"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { CalendarIcon, Check, ChevronsUpDown, Clock, Tag, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

// Sample data for the form
const teamMembers = [
  {
    id: 1,
    name: "Alex Kim",
    email: "alex@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "AK",
  },
  {
    id: 2,
    name: "Sarah Lee",
    email: "sarah@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "SL",
  },
  {
    id: 3,
    name: "Michael Johnson",
    email: "michael@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "MJ",
  },
  {
    id: 4,
    name: "Jessica Taylor",
    email: "jessica@example.com",
    avatar: "/placeholder.svg?height=32&width=32",
    initials: "JT",
  },
]

const labels = [
  { id: 1, name: "Frontend", color: "#93c5fd" },
  { id: 2, name: "Backend", color: "#86efac" },
  { id: 3, name: "Bug", color: "#fca5a5" },
  { id: 4, name: "Feature", color: "#c4b5fd" },
  { id: 5, name: "Documentation", color: "#fcd34d" },
]

const priorities = [
  { value: "high", label: "High", color: "text-red-500" },
  { value: "medium", label: "Medium", color: "text-yellow-500" },
  { value: "low", label: "Low", color: "text-blue-500" },
]

const stages = [
  { id: 1, name: "To Do" },
  { id: 2, name: "In Progress" },
  { id: 3, name: "Review" },
  { id: 4, name: "Done" },
]

interface CreateTaskModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStage?: string
  onTaskCreated?: (task: any) => void
}

export function CreateTaskModal({ open, onOpenChange, initialStage = "To Do", onTaskCreated }: CreateTaskModalProps) {
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignee, setAssignee] = useState<number | null>(null)
  const [selectedLabels, setSelectedLabels] = useState<number[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<string | undefined>(undefined)
  const [stage, setStage] = useState(initialStage)

  // UI state
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Reset form when modal opens/closes
  useEffect(() => {
    if (open) {
      setTitle("")
      setDescription("")
      setAssignee(null)
      setSelectedLabels([])
      setDueDate(undefined)
      setPriority(undefined)
      setStage(initialStage)
      setErrors({})

      // Focus on title input when modal opens
      setTimeout(() => {
        titleInputRef.current?.focus()
      }, 100)
    }
  }, [open, initialStage])

  // Handle form submission
  const handleSubmit = () => {
    // Validate form
    const newErrors: { [key: string]: string } = {}

    if (!title.trim()) {
      newErrors.title = "Title is required"
    }

    setErrors(newErrors)

    // If there are errors, don't submit
    if (Object.keys(newErrors).length > 0) {
      return
    }

    // Show loading state
    setIsSubmitting(true)

    // Create new task object
    const newTask = {
      id: Math.floor(Math.random() * 10000), // Generate random ID for demo
      title,
      description,
      assignee: assignee ? teamMembers.find((member) => member.id === assignee) : null,
      labels: selectedLabels.map((id) => labels.find((label) => label.id === id)),
      dueDate,
      priority,
      status: stage,
      createdAt: new Date(),
    }

    // Simulate API call
    setTimeout(() => {
      // Call onTaskCreated callback with new task
      if (onTaskCreated) {
        onTaskCreated(newTask)
      }

      // Close modal
      onOpenChange(false)
      setIsSubmitting(false)
    }, 500)
  }

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit form when Enter is pressed (unless in textarea)
    if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Get assignee name
  const getAssigneeName = () => {
    if (!assignee) return "Unassigned"
    const member = teamMembers.find((member) => member.id === assignee)
    return member ? member.name : "Unassigned"
  }

  // Toggle label selection
  const toggleLabel = (id: number) => {
    setSelectedLabels((prev) => (prev.includes(id) ? prev.filter((labelId) => labelId !== id) : [...prev, id]))
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]" onKeyDown={handleKeyDown}>
        <DialogHeader>
          <DialogTitle>Create Task</DialogTitle>
          <DialogDescription>Add a new task to your project. Press Enter to submit.</DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          {/* Task Title */}
          <div className="space-y-2">
            <Label htmlFor="title" className="flex items-center">
              Task Title <span className="text-red-500 ml-1">*</span>
            </Label>
            <Input
              id="title"
              ref={titleInputRef}
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
              className={cn(errors.title && "border-red-500")}
            />
            {errors.title && <p className="text-sm text-red-500">{errors.title}</p>}
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          {/* Assignee */}
          <div className="space-y-2">
            <Label htmlFor="assignee">Assignee</Label>
            <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={assigneeOpen}
                  className="w-full justify-between"
                >
                  <div className="flex items-center gap-2 truncate">
                    {assignee ? (
                      <>
                        <Avatar className="h-6 w-6">
                          <AvatarImage
                            src={teamMembers.find((member) => member.id === assignee)?.avatar}
                            alt={getAssigneeName()}
                          />
                          <AvatarFallback>
                            {teamMembers.find((member) => member.id === assignee)?.initials}
                          </AvatarFallback>
                        </Avatar>
                        <span>{getAssigneeName()}</span>
                      </>
                    ) : (
                      <span className="text-muted-foreground">Unassigned</span>
                    )}
                  </div>
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search team member..." />
                  <CommandList>
                    <CommandEmpty>No team member found.</CommandEmpty>
                    <CommandGroup>
                      <CommandItem
                        onSelect={() => {
                          setAssignee(null)
                          setAssigneeOpen(false)
                        }}
                        className="flex items-center gap-2"
                      >
                        <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                          <X className="h-3 w-3" />
                        </div>
                        <span>Unassigned</span>
                        {assignee === null && <Check className="ml-auto h-4 w-4" />}
                      </CommandItem>
                      {teamMembers.map((member) => (
                        <CommandItem
                          key={member.id}
                          onSelect={() => {
                            setAssignee(member.id)
                            setAssigneeOpen(false)
                          }}
                          className="flex items-center gap-2"
                        >
                          <Avatar className="h-6 w-6">
                            <AvatarImage src={member.avatar} alt={member.name} />
                            <AvatarFallback>{member.initials}</AvatarFallback>
                          </Avatar>
                          <span>{member.name}</span>
                          {assignee === member.id && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {/* Labels */}
          <div className="space-y-2">
            <Label htmlFor="labels">Labels</Label>
            <Popover open={labelsOpen} onOpenChange={setLabelsOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" role="combobox" aria-expanded={labelsOpen} className="w-full justify-between">
                  <div className="flex items-center gap-2 truncate">
                    {selectedLabels.length > 0 ? (
                      <div className="flex flex-wrap gap-1 max-w-[300px] overflow-hidden">
                        {selectedLabels.map((id) => {
                          const label = labels.find((l) => l.id === id)
                          return label ? (
                            <Badge
                              key={label.id}
                              className="px-1 py-0 h-5"
                              style={{ backgroundColor: label.color, color: "#000" }}
                            >
                              {label.name}
                            </Badge>
                          ) : null
                        })}
                      </div>
                    ) : (
                      <span className="text-muted-foreground">Select labels</span>
                    )}
                  </div>
                  <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
                <Command>
                  <CommandInput placeholder="Search labels..." />
                  <CommandList>
                    <CommandEmpty>No label found.</CommandEmpty>
                    <CommandGroup>
                      {labels.map((label) => (
                        <CommandItem
                          key={label.id}
                          onSelect={() => toggleLabel(label.id)}
                          className="flex items-center gap-2"
                        >
                          <div className="h-4 w-4 rounded-full" style={{ backgroundColor: label.color }} />
                          <span>{label.name}</span>
                          {selectedLabels.includes(label.id) && <Check className="ml-auto h-4 w-4" />}
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Due Date */}
            <div className="space-y-2">
              <Label htmlFor="due-date">Due Date</Label>
              <Popover open={dateOpen} onOpenChange={setDateOpen}>
                <PopoverTrigger asChild>
                  <Button variant="outline" className="w-full justify-start text-left font-normal" id="due-date">
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : <span className="text-muted-foreground">Pick a date</span>}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={(date) => {
                      setDueDate(date)
                      setDateOpen(false)
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            {/* Priority */}
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={setPriority}>
                <SelectTrigger id="priority">
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  {priorities.map((p) => (
                    <SelectItem key={p.value} value={p.value}>
                      <div className="flex items-center gap-2">
                        <Clock className={cn("h-4 w-4", p.color)} />
                        <span>{p.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Stage/Status */}
          <div className="space-y-2">
            <Label htmlFor="stage">Stage</Label>
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger id="stage">
                <SelectValue placeholder="Select stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s.id} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-violet-600 hover:bg-violet-700 text-white"
            disabled={isSubmitting}
          >
            {isSubmitting ? "Creating..." : "Create Task"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
