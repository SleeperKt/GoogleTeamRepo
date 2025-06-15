"use client"

import { useState, useRef, useEffect } from "react"
import { Calendar, ChevronDown, Flag, ListFilter, Plus, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Input } from "@/components/ui/input"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"

// Sample data
const projectData = {
  name: "TestProject-Dev",
  lastUpdated: "2 hours ago",
  startDate: new Date("2023-05-01"),
  endDate: new Date("2023-08-31"),
  tasks: [
    {
      id: 1,
      title: "Research & Planning",
      assignee: { name: "Alex Kim", initials: "AK", image: "/placeholder.svg?height=32&width=32" },
      startDate: new Date("2023-05-01"),
      endDate: new Date("2023-05-15"),
      status: "completed",
      progress: 100,
      dependencies: [],
    },
    {
      id: 2,
      title: "Design System",
      assignee: { name: "Sarah Lee", initials: "SL", image: "/placeholder.svg?height=32&width=32" },
      startDate: new Date("2023-05-10"),
      endDate: new Date("2023-05-30"),
      status: "completed",
      progress: 100,
      dependencies: [1],
    },
    {
      id: 3,
      title: "Frontend Development",
      assignee: { name: "Michael Johnson", initials: "MJ", image: "/placeholder.svg?height=32&width=32" },
      startDate: new Date("2023-05-25"),
      endDate: new Date("2023-07-15"),
      status: "in-progress",
      progress: 65,
      dependencies: [2],
    },
    {
      id: 4,
      title: "Backend API Development",
      assignee: { name: "Jessica Taylor", initials: "JT", image: "/placeholder.svg?height=32&width=32" },
      startDate: new Date("2023-06-01"),
      endDate: new Date("2023-07-20"),
      status: "in-progress",
      progress: 50,
      dependencies: [1],
    },
    {
      id: 5,
      title: "Database Integration",
      assignee: { name: "David Miller", initials: "DM", image: "/placeholder.svg?height=32&width=32" },
      startDate: new Date("2023-06-15"),
      endDate: new Date("2023-07-10"),
      status: "in-progress",
      progress: 40,
      dependencies: [4],
    },
    {
      id: 6,
      title: "Testing & QA",
      assignee: { name: "Emma Wilson", initials: "EW", image: "/placeholder.svg?height=32&width=32" },
      startDate: new Date("2023-07-10"),
      endDate: new Date("2023-08-10"),
      status: "not-started",
      progress: 0,
      dependencies: [3, 4, 5],
    },
    {
      id: 7,
      title: "Deployment & Launch",
      assignee: { name: "James Brown", initials: "JB", image: "/placeholder.svg?height=32&width=32" },
      startDate: new Date("2023-08-10"),
      endDate: new Date("2023-08-31"),
      status: "not-started",
      progress: 0,
      dependencies: [6],
    },
  ],
  milestones: [
    {
      id: 1,
      title: "Project Kickoff",
      date: new Date("2023-05-01"),
      status: "completed",
      description: "Initial project planning and team onboarding",
    },
    {
      id: 2,
      title: "Design Approval",
      date: new Date("2023-05-30"),
      status: "completed",
      description: "Final design system approved by stakeholders",
    },
    {
      id: 3,
      title: "Alpha Release",
      date: new Date("2023-07-15"),
      status: "in-progress",
      description: "Internal testing version with core functionality",
    },
    {
      id: 4,
      title: "Beta Launch",
      date: new Date("2023-08-10"),
      status: "upcoming",
      description: "Limited user testing with key customers",
    },
    {
      id: 5,
      title: "Public Release",
      date: new Date("2023-08-31"),
      status: "upcoming",
      description: "Official product launch to all users",
    },
  ],
}

// Status colors
const statusColors = {
  completed: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "in-progress": "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  "not-started": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  overdue: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300",
  upcoming: "bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300",
}

// Task bar colors
const taskBarColors = {
  completed: "bg-green-500 dark:bg-green-600",
  "in-progress": "bg-blue-500 dark:bg-blue-600",
  "not-started": "bg-gray-300 dark:bg-gray-600",
  overdue: "bg-red-500 dark:bg-red-600",
}

// View options
type ViewMode = "day" | "week" | "month"
type ViewType = "gantt" | "milestones" | "calendar"

export default function TimelinePage() {
  const [viewType, setViewType] = useState<ViewType>("milestones")
  const [viewMode, setViewMode] = useState<ViewMode>("week")
  const [zoomLevel, setZoomLevel] = useState(1)
  const [showEmptyState, setShowEmptyState] = useState(false)
  const [expandedMilestone, setExpandedMilestone] = useState<number | null>(null)
  const ganttContainerRef = useRef<HTMLDivElement>(null)

  // Calculate date range for the timeline
  const today = new Date()
  const startDate = new Date(projectData.startDate)
  const endDate = new Date(projectData.endDate)

  // Calculate total days in the project
  const totalDays = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

  // Generate dates for the timeline based on view mode
  const generateTimelineDates = () => {
    const dates = []
    const currentDate = new Date(startDate)

    while (currentDate <= endDate) {
      dates.push(new Date(currentDate))

      if (viewMode === "day") {
        currentDate.setDate(currentDate.getDate() + 1)
      } else if (viewMode === "week") {
        // If we're showing weeks, jump to the next Monday
        const daysToAdd = viewMode === "week" ? 7 : 1
        currentDate.setDate(currentDate.getDate() + daysToAdd)
      } else if (viewMode === "month") {
        currentDate.setMonth(currentDate.getMonth() + 1)
      }
    }

    return dates
  }

  const timelineDates = generateTimelineDates()

  // Calculate position and width for task bars
  const getTaskBarStyle = (task: (typeof projectData.tasks)[0]) => {
    const taskStart = new Date(task.startDate)
    const taskEnd = new Date(task.endDate)

    // Calculate days from project start to task start
    const daysFromStart = Math.ceil((taskStart.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate task duration in days
    const taskDuration = Math.ceil((taskEnd.getTime() - taskStart.getTime()) / (1000 * 60 * 60 * 24))

    // Calculate position and width as percentages
    const leftPosition = (daysFromStart / totalDays) * 100
    const widthPercentage = (taskDuration / totalDays) * 100

    return {
      left: `${leftPosition}%`,
      width: `${widthPercentage}%`,
    }
  }

  // Calculate position for milestones
  const getMilestonePosition = (milestone: (typeof projectData.milestones)[0]) => {
    const milestoneDate = new Date(milestone.date)
    const daysFromStart = Math.ceil((milestoneDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    return (daysFromStart / totalDays) * 100
  }

  // Handle zoom in/out
  const handleZoomIn = () => {
    if (zoomLevel < 2) setZoomLevel(zoomLevel + 0.25)
  }

  const handleZoomOut = () => {
    if (zoomLevel > 0.5) setZoomLevel(zoomLevel - 0.25)
  }

  // Format date based on view mode
  const formatDate = (date: Date) => {
    if (viewMode === "day") {
      return date.toLocaleDateString("en-US", { month: "short", day: "numeric" })
    } else if (viewMode === "week") {
      return `${date.toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
    } else {
      return date.toLocaleDateString("en-US", { month: "short", year: "numeric" })
    }
  }

  // Format date for milestone display
  const formatMilestoneDate = (date: Date) => {
    return date.toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "numeric" })
  }

  // Check if a date is today
  const isToday = (date: Date) => {
    const today = new Date()
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    )
  }

  // Toggle for demo purposes
  const toggleEmptyState = () => {
    setShowEmptyState(!showEmptyState)
  }

  // Toggle milestone expansion
  const toggleMilestone = (id: number) => {
    if (expandedMilestone === id) {
      setExpandedMilestone(null)
    } else {
      setExpandedMilestone(id)
    }
  }

  // Scroll to today in the timeline
  useEffect(() => {
    if (ganttContainerRef.current && !showEmptyState) {
      const container = ganttContainerRef.current
      const todayPosition =
        ((new Date().getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) *
        container.scrollWidth

      // Scroll to position today in the middle
      container.scrollLeft = todayPosition - container.clientWidth / 2
    }
  }, [showEmptyState, viewType, viewMode])

  // Add this CSS to the global.css file to hide scrollbars
  useEffect(() => {
    const style = document.createElement("style")
    style.textContent = `
      .hide-scrollbar::-webkit-scrollbar {
        display: none;
      }
      .hide-scrollbar {
        -ms-overflow-style: none;
        scrollbar-width: none;
      }
    `
    document.head.appendChild(style)

    return () => {
      document.head.removeChild(style)
    }
  }, [])

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Timeline</h1>
        <div className="flex items-center gap-2">
          <span className="font-medium">{projectData.name}</span>
          <span className="text-sm text-muted-foreground">Last updated {projectData.lastUpdated}</span>
        </div>
      </div>

      {/* Empty State */}
      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <Calendar className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No timeline data found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Start by adding tasks or setting milestones to visualize your project flow.
          </p>
          <Button className="bg-violet-600 hover:bg-violet-700 text-white">
            <Plus className="mr-2 h-4 w-4" /> Add Task
          </Button>
        </div>
      ) : (
        <>
          {/* View Mode Toggle */}
          <div className="mb-6">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-4">
              <Tabs
                defaultValue="gantt"
                value={viewType}
                onValueChange={(value) => setViewType(value as ViewType)}
                className="w-full sm:w-auto"
              >
                <TabsList className="grid w-full grid-cols-3">
                  <TabsTrigger value="gantt">Gantt View</TabsTrigger>
                  <TabsTrigger value="milestones">Milestones View</TabsTrigger>
                  <TabsTrigger value="calendar">Calendar View</TabsTrigger>
                </TabsList>
              </Tabs>

              <div className="flex items-center gap-2">
                <div className="flex items-center border rounded-md">
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("rounded-none border-r h-9 px-3", viewMode === "day" && "bg-muted")}
                    onClick={() => setViewMode("day")}
                  >
                    Day
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("rounded-none border-r h-9 px-3", viewMode === "week" && "bg-muted")}
                    onClick={() => setViewMode("week")}
                  >
                    Week
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className={cn("rounded-none h-9 px-3", viewMode === "month" && "bg-muted")}
                    onClick={() => setViewMode("month")}
                  >
                    Month
                  </Button>
                </div>

                <div className="flex items-center border rounded-md">
                  <Button variant="ghost" size="sm" className="rounded-none border-r h-9 px-2" onClick={handleZoomOut}>
                    <ZoomOut className="h-4 w-4" />
                  </Button>
                  <Button variant="ghost" size="sm" className="rounded-none h-9 px-2" onClick={handleZoomIn}>
                    <ZoomIn className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>

            {viewType === "gantt" && (
              <Card>
                <CardContent className="p-0">
                  <div className="flex border-b">
                    {/* Task list header */}
                    <div className="w-64 md:w-80 flex-shrink-0 p-4 border-r bg-muted/30">
                      <div className="flex items-center gap-2">
                        <Input placeholder="Search tasks..." className="h-8" />
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <ListFilter className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    {/* Timeline header */}
                    <div
                      className="flex-1 overflow-x-auto"
                      style={{
                        overflowY: "hidden",
                      }}
                    >
                      <div
                        className="flex min-w-full"
                        style={{
                          transform: `scaleX(${zoomLevel})`,
                          transformOrigin: "left",
                          height: "48px",
                        }}
                      >
                        {timelineDates.map((date, index) => (
                          <div
                            key={index}
                            className={cn(
                              "flex-1 p-4 text-center text-sm border-r",
                              isToday(date) && "bg-blue-50 dark:bg-blue-900/20 font-medium",
                            )}
                          >
                            {formatDate(date)}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Gantt chart body */}
                  <div className="flex">
                    {/* Task list */}
                    <div className="w-64 md:w-80 flex-shrink-0 border-r">
                      {projectData.tasks.map((task) => (
                        <div key={task.id} className="p-4 border-b hover:bg-muted/20">
                          <div className="flex items-center justify-between mb-1">
                            <div className="font-medium truncate max-w-[180px]">{task.title}</div>
                            <Badge className={`${statusColors[task.status]} whitespace-nowrap text-xs font-normal`}>
                              {task.status.replace("-", " ")}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <Avatar className="h-6 w-6 flex-shrink-0">
                              <AvatarImage src={task.assignee.image} alt={task.assignee.name} />
                              <AvatarFallback>{task.assignee.initials}</AvatarFallback>
                            </Avatar>
                            <span className="truncate">{task.assignee.name}</span>
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Gantt chart */}
                    <div
                      ref={ganttContainerRef}
                      className="flex-1 overflow-x-auto relative"
                      style={{ overflowY: "hidden" }}
                    >
                      <div
                        className="relative"
                        style={{
                          height: `${projectData.tasks.length * 65}px`,
                          transform: `scaleX(${zoomLevel})`,
                          transformOrigin: "left",
                          width: "100%",
                          minWidth: "800px",
                        }}
                      >
                        {/* Today marker */}
                        {(() => {
                          const todayPosition =
                            ((today.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100
                          return (
                            <div
                              className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
                              style={{ left: `${todayPosition}%` }}
                            >
                              <div className="absolute top-0 -translate-x-1/2 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                                Today
                              </div>
                            </div>
                          )
                        })()}

                        {/* Task bars */}
                        {projectData.tasks.map((task, index) => (
                          <div
                            key={task.id}
                            className="absolute h-10 rounded-md cursor-pointer"
                            style={{
                              ...getTaskBarStyle(task),
                              top: `${index * 65 + 16}px`,
                              backgroundColor: taskBarColors[task.status],
                            }}
                          >
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div className="h-full w-full px-2 flex items-center text-white">
                                    <span className="truncate text-sm">{task.title}</span>
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <div className="space-y-1">
                                    <p className="font-medium">{task.title}</p>
                                    <p className="text-xs">
                                      {task.startDate.toLocaleDateString()} - {task.endDate.toLocaleDateString()}
                                    </p>
                                    <p className="text-xs">Status: {task.status.replace("-", " ")}</p>
                                    <p className="text-xs">Progress: {task.progress}%</p>
                                  </div>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </div>
                        ))}

                        {/* Milestone markers */}
                        {projectData.milestones.map((milestone) => {
                          const position = getMilestonePosition(milestone)
                          return (
                            <div
                              key={milestone.id}
                              className="absolute top-0 bottom-0 w-px bg-violet-500 z-10"
                              style={{ left: `${position}%` }}
                            >
                              <TooltipProvider>
                                <Tooltip>
                                  <TooltipTrigger asChild>
                                    <div className="absolute top-0 -translate-x-1/2 bg-violet-500 text-white p-1 rounded-full">
                                      <Flag className="h-4 w-4" />
                                    </div>
                                  </TooltipTrigger>
                                  <TooltipContent>
                                    <div className="space-y-1">
                                      <p className="font-medium">{milestone.title}</p>
                                      <p className="text-xs">{milestone.date.toLocaleDateString()}</p>
                                      <p className="text-xs">Status: {milestone.status}</p>
                                    </div>
                                  </TooltipContent>
                                </Tooltip>
                              </TooltipProvider>
                            </div>
                          )
                        })}

                        {/* Grid lines */}
                        {timelineDates.map((date, index) => (
                          <div
                            key={index}
                            className={cn(
                              "absolute top-0 bottom-0 border-r border-gray-200 dark:border-gray-700",
                              isToday(date) && "border-blue-200 dark:border-blue-800",
                            )}
                            style={{
                              left: `${(index / timelineDates.length) * 100}%`,
                              width: `${100 / timelineDates.length}%`,
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {viewType === "milestones" && (
              <Card className="overflow-hidden">
                <CardContent className="p-6">
                  {/* Timeline bar with scroll controls */}
                  <div className="relative mb-16">
                    {/* Scroll controls */}
                    <div className="flex justify-between mb-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          const container = document.getElementById("timeline-scroll-container")
                          if (container) {
                            container.scrollBy({ left: -200, behavior: "smooth" })
                          }
                        }}
                      >
                        <ChevronLeft className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8 rounded-full"
                        onClick={() => {
                          const container = document.getElementById("timeline-scroll-container")
                          if (container) {
                            container.scrollBy({ left: 200, behavior: "smooth" })
                          }
                        }}
                      >
                        <ChevronRight className="h-4 w-4" />
                      </Button>
                    </div>

                    {/* Scrollable timeline container */}
                    <div
                      id="timeline-scroll-container"
                      className="relative h-24 overflow-x-auto pb-4 hide-scrollbar"
                      style={{ scrollbarWidth: "none", msOverflowStyle: "none" }}
                    >
                      <div className="absolute left-0 right-0 top-8 h-0.5 bg-gray-200 dark:bg-gray-700 min-w-[800px]"></div>

                      <div className="relative min-w-[800px]" style={{ width: "100%" }}>
                        {/* Today marker */}
                        {(() => {
                          const todayPosition =
                            ((today.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100
                          return (
                            <div
                              className="absolute top-0 bottom-0 w-px bg-blue-500 z-10"
                              style={{ left: `${todayPosition}%`, height: "16px", top: "8px" }}
                            >
                              <div className="absolute top-full mt-1 -translate-x-1/2 bg-blue-500 text-white text-xs px-1 py-0.5 rounded">
                                Today
                              </div>
                            </div>
                          )
                        })()}

                        {/* Milestone markers */}
                        {projectData.milestones.map((milestone) => {
                          const position = getMilestonePosition(milestone)

                          // Define colors based on status
                          const getStatusColor = (status: string) => {
                            switch (status) {
                              case "completed":
                                return "bg-green-500"
                              case "in-progress":
                                return "bg-blue-500"
                              case "upcoming":
                                return "bg-violet-500"
                              default:
                                return "bg-gray-500"
                            }
                          }

                          return (
                            <div
                              key={milestone.id}
                              className="absolute cursor-pointer"
                              style={{ left: `${position}%`, top: "0" }}
                              onClick={() => toggleMilestone(milestone.id)}
                            >
                              <div className="h-16 flex flex-col items-center">
                                <div
                                  className={`h-8 w-8 rounded-full ${getStatusColor(milestone.status)} flex items-center justify-center text-white shadow-sm`}
                                >
                                  <Flag className="h-4 w-4" />
                                </div>
                                <div className="mt-4 text-center w-24">
                                  <div className="text-sm font-medium truncate">{milestone.title}</div>
                                  <div className="text-xs text-muted-foreground">
                                    {formatMilestoneDate(milestone.date)}
                                  </div>
                                </div>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  </div>

                  {/* Milestone details */}
                  <div className="mt-16 space-y-4">
                    {projectData.milestones.map((milestone) => (
                      <Card
                        key={milestone.id}
                        className={cn(
                          "overflow-hidden transition-all",
                          expandedMilestone === milestone.id ? "shadow-md" : "",
                        )}
                      >
                        <div
                          className="p-4 flex items-center justify-between cursor-pointer hover:bg-muted/20"
                          onClick={() => toggleMilestone(milestone.id)}
                        >
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-8 w-8 rounded-full ${
                                milestone.status === "completed"
                                  ? "bg-green-500"
                                  : milestone.status === "in-progress"
                                    ? "bg-blue-500"
                                    : milestone.status === "upcoming"
                                      ? "bg-violet-500"
                                      : "bg-gray-500"
                              } flex items-center justify-center text-white`}
                            >
                              <Flag className="h-4 w-4" />
                            </div>
                            <div>
                              <div className="font-medium">{milestone.title}</div>
                              <div className="text-sm text-muted-foreground">{formatMilestoneDate(milestone.date)}</div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge
                              className={`${statusColors[milestone.status]} whitespace-nowrap text-xs font-normal px-2 py-1`}
                            >
                              {milestone.status}
                            </Badge>
                            <ChevronDown
                              className={cn(
                                "h-5 w-5 text-muted-foreground transition-transform",
                                expandedMilestone === milestone.id ? "transform rotate-180" : "",
                              )}
                            />
                          </div>
                        </div>

                        {expandedMilestone === milestone.id && (
                          <div className="p-4 pt-0 border-t mt-4">
                            <p className="text-sm mb-4">{milestone.description}</p>

                            <h4 className="text-sm font-medium mb-2">Related Tasks</h4>
                            <div className="space-y-2">
                              {projectData.tasks
                                .filter((task) => {
                                  const taskStart = new Date(task.startDate)
                                  const taskEnd = new Date(task.endDate)
                                  const milestoneDate = new Date(milestone.date)
                                  return taskStart <= milestoneDate && taskEnd >= milestoneDate
                                })
                                .map((task) => (
                                  <div
                                    key={task.id}
                                    className="flex items-center justify-between p-2 bg-muted/20 rounded-md"
                                  >
                                    <div className="flex items-center gap-2 flex-1 min-w-0">
                                      <Avatar className="h-6 w-6 flex-shrink-0">
                                        <AvatarImage src={task.assignee.image} alt={task.assignee.name} />
                                        <AvatarFallback>{task.assignee.initials}</AvatarFallback>
                                      </Avatar>
                                      <span className="text-sm truncate">{task.title}</span>
                                    </div>
                                    <Badge
                                      className={`${statusColors[task.status]} whitespace-nowrap text-xs font-normal ml-2`}
                                    >
                                      {task.status.replace("-", " ")}
                                    </Badge>
                                  </div>
                                ))}

                              {projectData.tasks.filter((task) => {
                                const taskStart = new Date(task.startDate)
                                const taskEnd = new Date(task.endDate)
                                const milestoneDate = new Date(milestone.date)
                                return (
                                  !(taskStart <= milestoneDate && taskEnd >= milestoneDate) &&
                                  Math.abs(taskStart.getTime() - milestoneDate.getTime()) < 7 * 24 * 60 * 60 &&
                                  Math.abs(taskStart.getTime() - milestoneDate.getTime()) < 7 * 24 * 60 * 60 * 1000
                                )
                              }).length > 0 && (
                                <div className="mt-2">
                                  <h4 className="text-sm font-medium mb-2">Nearby Tasks</h4>
                                  {projectData.tasks
                                    .filter((task) => {
                                      const taskStart = new Date(task.startDate)
                                      const taskEnd = new Date(task.endDate)
                                      const milestoneDate = new Date(milestone.date)
                                      return (
                                        !(taskStart <= milestoneDate && taskEnd >= milestoneDate) &&
                                        Math.abs(taskStart.getTime() - milestoneDate.getTime()) <
                                          7 * 24 * 60 * 60 * 1000
                                      )
                                    })
                                    .map((task) => (
                                      <div
                                        key={task.id}
                                        className="flex items-center justify-between p-2 bg-muted/10 rounded-md mb-1"
                                      >
                                        <div className="flex items-center gap-2 flex-1 min-w-0">
                                          <Avatar className="h-6 w-6 flex-shrink-0">
                                            <AvatarImage src={task.assignee.image} alt={task.assignee.name} />
                                            <AvatarFallback>{task.assignee.initials}</AvatarFallback>
                                          </Avatar>
                                          <span className="text-sm truncate">{task.title}</span>
                                        </div>
                                        <Badge
                                          className={`${statusColors[task.status]} whitespace-nowrap text-xs font-normal ml-2`}
                                        >
                                          {task.status.replace("-", " ")}
                                        </Badge>
                                      </div>
                                    ))}
                                </div>
                              )}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}

            {viewType === "calendar" && (
              <Card>
                <CardContent className="p-6">
                  <div className="text-center p-12">
                    <h3 className="text-lg font-medium mb-2">Calendar View</h3>
                    <p className="text-muted-foreground">
                      Calendar view is coming soon. This will provide a month-by-month view of your project timeline.
                    </p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </>
      )}

      {/* Demo Controls - Remove in production */}
      <div className="mt-8 pt-4 border-t">
        <Button variant="outline" onClick={toggleEmptyState} className="text-xs">
          Toggle Empty State (Demo)
        </Button>
      </div>
    </div>
  )
}
