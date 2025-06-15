"use client"

import { useState, useEffect } from "react"
import {
  LayoutGrid,
  Calendar,
  CheckCircle2,
  Clock,
  PlayCircle,
  RefreshCw,
  Users,
  ArrowRight,
  Filter,
  Search,
  FolderOpen,
  Plus,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { useAuth } from "@/contexts/auth-context"
import { API_BASE_URL } from "@/lib/api"
import Link from "next/link"

interface Project {
  id: number
  name: string
  description: string
  createdAt: string
  publicId: string
}

interface BoardColumn {
  id: string
  title: string
  status: string
  tasks: Task[]
}

interface Task {
  id: number
  title: string
  description: string
  status: number
  priority: number
  assigneeId?: string
  assigneeName?: string
  createdAt: string
  updatedAt: string
  dueDate?: string
}

interface ProjectBoard {
  projectId: string
  projectName: string
  publicId: string
  columns: BoardColumn[]
  taskCounts: {
    todo: number
    inProgress: number
    inReview: number
    done: number
    total: number
  }
}

interface AggregatedStats {
  totalProjects: number
  totalTasks: number
  totalTodo: number
  totalInProgress: number
  totalInReview: number
  totalCompleted: number
  activeProjects: number
}

export default function AllProjectsBoardsPage() {
  const { token } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectBoards, setProjectBoards] = useState<ProjectBoard[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [sortBy, setSortBy] = useState("name")

  const fetchData = async () => {
    if (!token) {
      console.log('No token available for API call')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      console.log('Making API call to fetch projects for boards...')
      
      const projectsRes = await fetch(`${API_BASE_URL}/api/projects`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })
      
      console.log('Projects API response status:', projectsRes.status, projectsRes.statusText)
      
      if (!projectsRes.ok) {
        const errorText = await projectsRes.text()
        console.error('Projects API error:', projectsRes.status, projectsRes.statusText, errorText)
        alert(`API Error: ${projectsRes.status} ${projectsRes.statusText}\nDetails: ${errorText}`)
        setLoading(false)
        return
      }

      const projectsData = await projectsRes.json()
      console.log('Raw Projects API response:', projectsData)
      console.log('Response type:', typeof projectsData)
      console.log('Is array?', Array.isArray(projectsData))
      
      let projectsArray: Project[] = []
      if (Array.isArray(projectsData)) {
        projectsArray = projectsData
        console.log('Using direct array response')
      } else if (projectsData && Array.isArray(projectsData.data)) {
        projectsArray = projectsData.data
        console.log('Using wrapped array response (.data)')
      } else if (projectsData && Array.isArray(projectsData.$values)) {
        projectsArray = projectsData.$values
        console.log('Using wrapped array response (.$values)')
      } else {
        console.warn('Unexpected projects data type:', typeof projectsData, projectsData)
        projectsArray = []
      }
      
      console.log('Final projects array:', projectsArray)
      console.log('Number of projects:', projectsArray.length)
      
      // Show alert for debugging if no projects
      if (projectsArray.length === 0) {
        alert('No projects found! This could mean:\n1. You have no projects\n2. API returned empty data\n3. Authentication issue')
      }
      
      setProjects(projectsArray)

      // Fetch board data for each project
      if (projectsArray.length > 0) {
        console.log('Fetching board data for', projectsArray.length, 'projects')
        
        const boardPromises = projectsArray.map(async (project: Project) => {
          try {
            console.log(`Fetching board data for project ${project.id} (${project.name})`)
            const boardRes = await fetch(`${API_BASE_URL}/api/projects/public/${project.publicId}/board`, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            })
            
            if (boardRes.ok) {
              const boardData = await boardRes.json()
              console.log(`Board data for ${project.name}:`, boardData)
              
              // Calculate task counts from board data
              let taskCounts = {
                todo: 0,
                inProgress: 0,
                inReview: 0,
                done: 0,
                total: 0
              }

              if (boardData && Array.isArray(boardData.columns)) {
                boardData.columns.forEach((column: BoardColumn) => {
                  const taskCount = column.tasks ? column.tasks.length : 0
                  switch (column.id.toLowerCase()) {
                    case 'todo':
                      taskCounts.todo = taskCount
                      break
                    case 'inprogress':
                      taskCounts.inProgress = taskCount
                      break
                    case 'inreview':
                      taskCounts.inReview = taskCount
                      break
                    case 'done':
                      taskCounts.done = taskCount
                      break
                  }
                })
                taskCounts.total = taskCounts.todo + taskCounts.inProgress + taskCounts.inReview + taskCounts.done
              }

              return {
                projectId: project.id.toString(),
                projectName: project.name,
                publicId: project.publicId,
                columns: boardData.columns || [],
                taskCounts
              }
            } else {
              console.warn(`Failed to fetch board data for project ${project.name}:`, boardRes.status)
            }
            return null
          } catch (error) {
            console.error(`Error fetching board data for project ${project.name}:`, error)
            return null
          }
        })

        const allBoards = await Promise.all(boardPromises)
        const validBoards = allBoards.filter(board => board !== null) as ProjectBoard[]
        console.log('Valid board data:', validBoards)
        setProjectBoards(validBoards)
      } else {
        setProjectBoards([])
      }

    } catch (error) {
      console.error('Error fetching boards data:', error)
      alert(`Network Error: ${error}`)
      setProjects([])
      setProjectBoards([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [token])

  // Calculate aggregated statistics
  const getAggregatedStats = (): AggregatedStats => {
    const totalProjects = projects.length
    const activeProjects = projectBoards.filter(board => board.taskCounts.total > 0).length
    const totalTasks = projectBoards.reduce((sum, board) => sum + board.taskCounts.total, 0)
    const totalTodo = projectBoards.reduce((sum, board) => sum + board.taskCounts.todo, 0)
    const totalInProgress = projectBoards.reduce((sum, board) => sum + board.taskCounts.inProgress, 0)
    const totalInReview = projectBoards.reduce((sum, board) => sum + board.taskCounts.inReview, 0)
    const totalCompleted = projectBoards.reduce((sum, board) => sum + board.taskCounts.done, 0)

    return {
      totalProjects,
      totalTasks,
      totalTodo,
      totalInProgress,
      totalInReview,
      totalCompleted,
      activeProjects
    }
  }

  const aggregatedStats = getAggregatedStats()

  // Get overview cards data
  const getOverviewCards = () => [
    {
      label: "Active Projects",
      value: aggregatedStats.activeProjects,
      icon: FolderOpen,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
    },
    {
      label: "Total Tasks",
      value: aggregatedStats.totalTasks,
      icon: LayoutGrid,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
    },
    {
      label: "In Progress",
      value: aggregatedStats.totalInProgress,
      icon: PlayCircle,
      color: "bg-orange-50 text-orange-600 dark:bg-orange-900 dark:text-orange-300",
    },
    {
      label: "Completed",
      value: aggregatedStats.totalCompleted,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300",
    },
  ]

  // Filter and sort project boards
  const getFilteredAndSortedBoards = () => {
    let filtered = projectBoards

    // Apply search filter
    if (searchQuery) {
      filtered = filtered.filter(board => 
        board.projectName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    }

    // Apply sorting
    filtered.sort((a, b) => {
      switch (sortBy) {
        case 'name':
          return a.projectName.localeCompare(b.projectName)
        case 'tasks':
          return b.taskCounts.total - a.taskCounts.total
        case 'activity':
          return b.taskCounts.inProgress - a.taskCounts.inProgress
        default:
          return 0
      }
    })

    return filtered
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="bg-white p-4 rounded-lg border shadow-sm">
                <div className="h-4 bg-gray-200 rounded w-3/4 mb-2"></div>
                <div className="h-8 bg-gray-200 rounded w-1/2"></div>
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  const overviewCards = getOverviewCards()
  const filteredBoards = getFilteredAndSortedBoards()
  const showEmptyState = projects.length === 0

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">All Project Boards</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Overview of all your project boards
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9" onClick={() => { setLoading(true); fetchData(); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
          </div>
        </div>
      </div>

      {/* Empty State */}
      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <LayoutGrid className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No project boards found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Start by creating your first project to see boards and manage tasks.
          </p>
          <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white">
            <Link href="/projects">
              <Plus className="mr-2 h-4 w-4" /> Create Project
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Overview Cards */}
          <div className="mb-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {overviewCards.map((card, index) => (
                <Card key={index} className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                  <CardContent className="p-4 flex flex-col items-center text-center">
                    <div className={`rounded-full p-2 mb-2 ${card.color}`}>
                      <card.icon className="h-5 w-5" />
                    </div>
                    <div className="text-2xl font-bold">{card.value}</div>
                    <div className="text-sm text-muted-foreground">{card.label}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Search and Sort Controls */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Search projects..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="name">Project Name</SelectItem>
                  <SelectItem value="tasks">Total Tasks</SelectItem>
                  <SelectItem value="activity">Activity Level</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Project Boards Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {filteredBoards.map((board, index) => (
              <Card key={index} className="bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold text-lg mb-1">{board.projectName}</h3>
                      <div className="text-sm text-muted-foreground">
                        {board.taskCounts.total} tasks total
                      </div>
                    </div>
                    <Button variant="ghost" size="sm" asChild>
                      <Link href={`/projects/${board.publicId}/board`}>
                        <ArrowRight className="h-4 w-4" />
                      </Link>
                    </Button>
                  </div>

                  {/* Task Distribution */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-gray-400"></div>
                        <span className="text-sm">To Do</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {board.taskCounts.todo}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                        <span className="text-sm">In Progress</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {board.taskCounts.inProgress}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                        <span className="text-sm">In Review</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {board.taskCounts.inReview}
                      </Badge>
                    </div>

                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="w-3 h-3 rounded-full bg-green-500"></div>
                        <span className="text-sm">Done</span>
                      </div>
                      <Badge variant="secondary" className="text-xs">
                        {board.taskCounts.done}
                      </Badge>
                    </div>
                  </div>

                  {/* Progress Bar */}
                  {board.taskCounts.total > 0 && (
                    <div className="mt-4">
                      <div className="flex justify-between text-xs text-muted-foreground mb-1">
                        <span>Progress</span>
                        <span>{Math.round((board.taskCounts.done / board.taskCounts.total) * 100)}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className="bg-green-500 h-2 rounded-full transition-all duration-300"
                          style={{ 
                            width: `${(board.taskCounts.done / board.taskCounts.total) * 100}%` 
                          }}
                        ></div>
                      </div>
                    </div>
                  )}

                  {/* Quick Actions */}
                  <div className="mt-4 pt-4 border-t flex gap-2">
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/projects/${board.publicId}/board`}>
                        <LayoutGrid className="mr-2 h-4 w-4" />
                        View Board
                      </Link>
                    </Button>
                    <Button variant="outline" size="sm" className="flex-1" asChild>
                      <Link href={`/projects/${board.publicId}/reports`}>
                        Reports
                      </Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* No Results State */}
          {filteredBoards.length === 0 && !showEmptyState && (
            <div className="text-center py-12">
              <div className="text-muted-foreground mb-2">No boards match your search criteria</div>
              <Button variant="outline" onClick={() => setSearchQuery("")}>
                Clear Search
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  )
} 