"use client"

import type React from "react"

import { useState, useEffect, useRef } from "react"
import { ArrowLeft, CalendarIcon, Check, ChevronsUpDown, Clock, Loader2, Sparkles, Tag, X } from "lucide-react"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { apiRequest } from "@/lib/api"

// Dynamic team-member type.
interface TeamMember {
  id: string
  name: string
  email?: string
  avatar?: string
  initials: string
}

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

interface CreateTaskSidebarProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  initialStage?: string
  onTaskCreated?: (task: any) => void
  /** Public GUID of the project (route slug). When provided, participants will be fetched from the backend. */
  projectPublicId?: string
}

export function CreateTaskSidebar({
  open,
  onOpenChange,
  initialStage = "To Do",
  onTaskCreated,
  projectPublicId,
}: CreateTaskSidebarProps) {
  // Form state
  const [title, setTitle] = useState("")
  const [description, setDescription] = useState("")
  const [assignee, setAssignee] = useState<string | null>(null)
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [selectedLabels, setSelectedLabels] = useState<number[]>([])
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined)
  const [priority, setPriority] = useState<string | undefined>("high")
  const [stage, setStage] = useState(initialStage)
  const [estimate, setEstimate] = useState<string>("")

  // UI state
  const [assigneeOpen, setAssigneeOpen] = useState(false)
  const [labelsOpen, setLabelsOpen] = useState(false)
  const [dateOpen, setDateOpen] = useState(false)
  const [errors, setErrors] = useState<{ [key: string]: string }>({})
  const [isSubmitting, setIsSubmitting] = useState(false)

  // AI Assistant state
  const [isGeneratingAI, setIsGeneratingAI] = useState(false)
  const [aiSuggestion, setAiSuggestion] = useState<string | null>(null)

  // Refs
  const titleInputRef = useRef<HTMLInputElement>(null)

  // Load project participants
  useEffect(() => {
    const loadParticipants = async () => {
      if (!open || !projectPublicId) return

      try {
        // First get internal project id
        const project: { id: number } = await apiRequest(`/api/projects/public/${projectPublicId}`)
        if (!project?.id) return

        // Fetch participants
        const raw = await apiRequest(`/api/projects/${project.id}/participants`)

        // Backend (ASP.NET) may wrap collections in {$values:[...]}. Normalize here.
        const participantArray: Array<any> = Array.isArray(raw)
          ? raw
          : Array.isArray(raw?.$values)
            ? raw.$values
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
        setTeamMembers([])
      }
    }

    loadParticipants()
  }, [open, projectPublicId])

  // Reset form when sidebar opens/closes
  useEffect(() => {
    if (open) {
      setTitle("")
      setDescription("")
      setAssignee(null)
      setSelectedLabels([])
      setDueDate(undefined)
      setPriority("high")
      setStage(initialStage)
      setEstimate("")
      setErrors({})
      setAiSuggestion(null)

      // Focus on title input when sidebar opens
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

    // Create task object in a shape expected by the parent handler / backend
    const priorityMap: Record<string | number, number> = {
      low: 1,
      medium: 2,
      high: 3,
      critical: 4,
      1: 1,
      2: 2,
      3: 3,
      4: 4,
    }

    const newTask = {
      title,
      description,
      assigneeId: assignee ? assignee : undefined, // GUI will supply real GUID later
      labels: selectedLabels.map((id) => labels.find((label) => label.id === id)),
      dueDate,
      priority: priorityMap[priority ?? 1],
      estimate: estimate ? Number.parseFloat(estimate) : undefined,
    }

    // Simulate API call
    setTimeout(() => {
      // Call onTaskCreated callback with new task
      if (onTaskCreated) {
        onTaskCreated(newTask)
      }

      // Close sidebar
      onOpenChange(false)
      setIsSubmitting(false)
    }, 500)
  }

  // Handle key press
  const handleKeyDown = (e: React.KeyboardEvent) => {
    // Submit form when Ctrl+Enter is pressed
    if (e.key === "Enter" && e.ctrlKey) {
      e.preventDefault()
      handleSubmit()
    }
  }

  // Get assignee name
  const getAssigneeName = () => {
    if (!assignee) return "Unassigned"
    const member = teamMembers.find((member: TeamMember) => member.id === assignee)
    return member ? member.name : "Unassigned"
  }

  // Toggle label selection
  const toggleLabel = (id: number) => {
    setSelectedLabels((prev) => (prev.includes(id) ? prev.filter((labelId) => labelId !== id) : [...prev, id]))
  }

  // Generate AI description
  const generateAIDescription = () => {
    setIsGeneratingAI(true)

    // Simulate AI generation
    setTimeout(() => {
      // Generate description based on title and stage
      let aiDesc = ""

      if (title.toLowerCase().includes("authentication")) {
        aiDesc = `Implement a secure user authentication flow that includes:

1. Login form with email/username and password fields
2. Registration process with email verification
3. Password reset functionality
4. OAuth integration with Google and GitHub
5. Session management with JWT tokens
6. Rate limiting to prevent brute force attacks

This task is critical for system security and should follow OWASP security best practices.`
      } else if (title.toLowerCase().includes("navigation")) {
        aiDesc = `Fix the responsive navigation menu on mobile devices by addressing the following issues:

1. Menu doesn't close properly after selection on small screens
2. Dropdown submenus are cut off on certain device widths
3. Hamburger icon animation is inconsistent
4. Touch targets are too small on mobile devices

Test on iOS and Android devices with various screen sizes to ensure consistent behavior.`
      } else if (stage === "In Progress") {
        aiDesc = `This task is currently in development. Key implementation details:

1. Follow the design specifications in the attached mockups
2. Ensure responsive behavior across all device sizes
3. Implement proper error handling and loading states
4. Write unit tests for all new functionality
5. Document any API changes or new components
6. Consider accessibility requirements throughout implementation`
      } else {
        aiDesc = `This task involves ${title.toLowerCase()}. Based on the current stage (${stage}), the following should be considered:

1. Define clear acceptance criteria and expected outcomes
2. Identify dependencies on other tasks or systems
3. Document any technical requirements or constraints
4. Consider potential edge cases and error scenarios
5. Estimate effort required for implementation
6. Plan for testing and validation steps`
      }

      setAiSuggestion(aiDesc)
      setIsGeneratingAI(false)
    }, 1500)
  }

  // Apply AI suggestion
  const applyAISuggestion = () => {
    if (aiSuggestion) {
      setDescription(aiSuggestion)
      setAiSuggestion(null)
    }
  }

  // Regenerate AI suggestion
  const regenerateAISuggestion = () => {
    setAiSuggestion(null)
    generateAIDescription()
  }

  // Dismiss AI suggestion
  const dismissAISuggestion = () => {
    setAiSuggestion(null)
  }

  // Shorten description with AI
  const shortenDescription = () => {
    if (!description) return

    setIsGeneratingAI(true)

    // Simulate AI shortening
    setTimeout(() => {
      const shortened =
        description.split("\n\n")[0] +
        "\n\nKey points:\n" +
        description
          .split("\n")
          .filter((line) => line.trim().length > 0 && !line.startsWith("Key points:"))
          .slice(1, 4)
          .map((line) => (line.length > 40 ? line.substring(0, 40) + "..." : line))
          .join("\n")

      setAiSuggestion(shortened)
      setIsGeneratingAI(false)
    }, 1000)
  }

  // Expand description with AI
  const expandDescription = () => {
    if (!description) return

    setIsGeneratingAI(true)

    // Simulate AI expansion
    setTimeout(() => {
      const expanded =
        description +
        "\n\nAdditional considerations:\n" +
        "1. Ensure cross-browser compatibility\n" +
        "2. Consider performance implications\n" +
        "3. Document any API changes\n" +
        "4. Add appropriate error handling\n" +
        "5. Include accessibility features"

      setAiSuggestion(expanded)
      setIsGeneratingAI(false)
    }, 1000)
  }

  // If not open, don't render anything
  if (!open) return null

  return (
    <>
      {/* Sidebar Layout */}
      <div
        className={cn(
          "fixed top-0 right-0 h-full w-[350px] bg-white dark:bg-gray-800 border-l shadow-lg z-50 flex flex-col transition-transform duration-300 ease-in-out",
          open ? "translate-x-0" : "translate-x-full",
          "md:w-[350px] sm:w-[320px]",
        )}
        onKeyDown={handleKeyDown}
      >
        {/* Header with back button and title */}
        <div className="p-2 border-b flex items-center gap-2">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onOpenChange(false)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <h2 className="text-base font-medium">Create Task</h2>
        </div>

        {/* Main content area - scrollable form */}
        <div className="flex-1 overflow-auto">
          <div className="p-4 space-y-4">
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

              {/* AI Assistant */}
              <div className="border rounded-md p-1.5 bg-violet-50 dark:bg-violet-950/20 mt-1">
                <div className="flex items-center justify-between mb-1">
                  <div className="flex items-center gap-1">
                    <Sparkles className="h-3 w-3 text-violet-500" />
                    <h4 className="font-medium text-xs">AI Description Assistant</h4>
                  </div>
                  <div className="flex items-center gap-1">
                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={shortenDescription}
                            disabled={isGeneratingAI || !description}
                            className="h-5 text-xs px-1.5 py-0"
                          >
                            Shorten
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">Create a shorter version</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>

                    <TooltipProvider>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={expandDescription}
                            disabled={isGeneratingAI || !description}
                            className="h-5 text-xs px-1.5 py-0"
                          >
                            Expand
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom">
                          <p className="text-xs">Add more details</p>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  </div>
                </div>

                {isGeneratingAI ? (
                  <div className="flex items-center justify-center py-2">
                    <div className="flex flex-col items-center gap-1">
                      <Loader2 className="h-4 w-4 animate-spin text-violet-500" />
                      <p className="text-xs text-muted-foreground">Generating...</p>
                    </div>
                  </div>
                ) : aiSuggestion ? (
                  <div className="space-y-1">
                    <div className="bg-white dark:bg-gray-800 border rounded-md p-1.5 text-xs whitespace-pre-wrap">
                      {aiSuggestion}
                    </div>
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={dismissAISuggestion}
                        className="h-5 text-xs px-1.5 py-0"
                      >
                        Dismiss
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={regenerateAISuggestion}
                        className="h-5 text-xs px-1.5 py-0"
                      >
                        Regenerate
                      </Button>
                      <Button
                        size="sm"
                        className="bg-violet-600 hover:bg-violet-700 text-white h-5 text-xs px-1.5 py-0"
                        onClick={applyAISuggestion}
                      >
                        Apply
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Button
                      className="w-full bg-violet-600 hover:bg-violet-700 text-white h-6 text-xs"
                      onClick={generateAIDescription}
                    >
                      <Sparkles className="mr-1 h-3 w-3" />
                      Generate with AI
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Type */}
              <div className="space-y-2">
                <Label htmlFor="type">Type</Label>
                <Select defaultValue="feature">
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="feature">Feature</SelectItem>
                    <SelectItem value="bug">Bug</SelectItem>
                    <SelectItem value="task">Task</SelectItem>
                    <SelectItem value="story">Story</SelectItem>
                    <SelectItem value="epic">Epic</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Status */}
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <Select value={stage} onValueChange={setStage}>
                  <SelectTrigger id="status">
                    <SelectValue placeholder="Select status" />
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

            <div className="grid grid-cols-2 gap-4">
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
                                src={teamMembers.find((member: TeamMember) => member.id === assignee)?.avatar}
                                alt={getAssigneeName()}
                              />
                              <AvatarFallback>
                                {teamMembers.find((member: TeamMember) => member.id === assignee)?.initials}
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
                          {teamMembers.map((member: TeamMember) => (
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
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={labelsOpen}
                      className="w-full justify-between"
                    >
                      <div className="flex items-center gap-2 truncate">
                        {selectedLabels.length > 0 ? (
                          <div className="flex flex-wrap gap-1 max-w-[300px] overflow-hidden">
                            {selectedLabels.map((id) => {
                              const label = labels.find((l) => l.id === id)
                              return label ? (
                                <Badge key={label.id} variant="outline" className="px-1 py-0 h-5">
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
            </div>

            <div className="grid grid-cols-2 gap-4">
              {/* Due Date */}
              <div className="space-y-2">
                <Label htmlFor="due-date">Due Date</Label>
                <Popover open={dateOpen} onOpenChange={setDateOpen}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" className="w-full justify-start text-left font-normal" id="due-date">
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dueDate ? format(dueDate, "PPP") : <span className="text-muted-foreground">Set due date</span>}
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

            {/* Estimate */}
            <div className="space-y-2">
              <Label htmlFor="estimate">Estimate (hours)</Label>
              <Input
                id="estimate"
                type="number"
                min="0"
                step="0.5"
                value={estimate}
                onChange={(e) => setEstimate(e.target.value)}
                placeholder="Enter estimate"
              />
            </div>
          </div>
        </div>

        {/* Footer with actions */}
        <div className="p-4 border-t mt-auto">
          <div className="flex items-center justify-end gap-2">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              className="bg-violet-600 hover:bg-violet-700 text-white"
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create Task"
              )}
            </Button>
          </div>
        </div>
      </div>

      {/* Backdrop for mobile */}
      <div
        className={cn(
          "fixed inset-0 bg-black/20 z-40 md:hidden",
          open ? "opacity-100" : "opacity-0 pointer-events-none",
        )}
        onClick={() => onOpenChange(false)}
      />
    </>
  )
}
