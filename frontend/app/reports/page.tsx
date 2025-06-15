"use client"

import { useState, useEffect } from "react"
import {
  BarChart3,
  Calendar,
  CheckCircle2,
  Download,
  Filter,
  FolderOpen,
  PlayCircle,
  RefreshCw,
  Users,
  X,
  TrendingUp,
  Clock,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Progress } from "@/components/ui/progress"
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

interface ProjectStatistics {
  projectId: number
  projectName: string
  publicId: string
  taskCounts: {
    todo: number
    inProgress: number
    inReview: number
    done: number
    cancelled: number
    total: number
  }
}

interface AggregatedStats {
  totalProjects: number
  totalTasks: number
  totalCompleted: number
  totalInProgress: number
  totalInReview: number
  completionRate: number
}

export default function AllProjectsReportsPage() {
  const { token } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [projectStatistics, setProjectStatistics] = useState<ProjectStatistics[]>([])
  const [loading, setLoading] = useState(true)
  const [reportType, setReportType] = useState("overview")
  const [dateRange, setDateRange] = useState("last30days")

  const fetchData = async () => {
    if (!token) {
      console.log('No token available for API call')
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      console.log('Making API call to fetch projects...')
      
      // Fetch all user's projects
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
        
        // Show alert for debugging
        alert(`API Error: ${projectsRes.status} ${projectsRes.statusText}\nDetails: ${errorText}`)
        
        setLoading(false)
        return
      }

      const projectsData = await projectsRes.json()
      console.log('Raw Projects API response:', projectsData)
      console.log('Response type:', typeof projectsData)
      console.log('Is array?', Array.isArray(projectsData))
      
      // Handle different response structures
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
      } else if (projectsData && typeof projectsData === 'object') {
        // If it's an object but not an array, it might be a single project or empty response
        console.warn('Expected array but got object:', projectsData)
        projectsArray = []
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

      // Fetch statistics for each project
      if (projectsArray.length > 0) {
        console.log('Fetching statistics for', projectsArray.length, 'projects')
        
        const statsPromises = projectsArray.map(async (project: Project) => {
          try {
            console.log(`Fetching stats for project ${project.id} (${project.name})`)
            const statsRes = await fetch(`${API_BASE_URL}/api/tasks/statistics/${project.id}`, {
              headers: { 
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
            })
            
            if (statsRes.ok) {
              const statsData = await statsRes.json()
              console.log(`Stats for ${project.name}:`, statsData)
              return {
                projectId: project.id,
                projectName: project.name,
                publicId: project.publicId,
                taskCounts: statsData.taskCounts
              }
            } else {
              console.warn(`Failed to fetch stats for project ${project.name}:`, statsRes.status)
            }
            return null
          } catch (error) {
            console.error(`Error fetching stats for project ${project.name}:`, error)
            return null
          }
        })

        const allStats = await Promise.all(statsPromises)
        const validStats = allStats.filter(stat => stat !== null) as ProjectStatistics[]
        console.log('Valid statistics:', validStats)
        setProjectStatistics(validStats)
      } else {
        setProjectStatistics([])
      }

    } catch (error) {
      console.error('Error fetching reports data:', error)
      alert(`Network Error: ${error}`)
      // Set empty arrays on error to prevent crashes
      setProjects([])
      setProjectStatistics([])
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
    const totalTasks = projectStatistics.reduce((sum, stat) => sum + stat.taskCounts.total, 0)
    const totalCompleted = projectStatistics.reduce((sum, stat) => sum + stat.taskCounts.done, 0)
    const totalInProgress = projectStatistics.reduce((sum, stat) => sum + stat.taskCounts.inProgress, 0)
    const totalInReview = projectStatistics.reduce((sum, stat) => sum + stat.taskCounts.inReview, 0)
    const completionRate = totalTasks > 0 ? Math.round((totalCompleted / totalTasks) * 100) : 0

    return {
      totalProjects,
      totalTasks,
      totalCompleted,
      totalInProgress,
      totalInReview,
      completionRate
    }
  }

  const aggregatedStats = getAggregatedStats()

  // Get overview cards data
  const getOverviewCards = () => [
    {
      label: "Total Projects",
      value: aggregatedStats.totalProjects,
      icon: FolderOpen,
      color: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
    },
    {
      label: "Total Tasks",
      value: aggregatedStats.totalTasks,
      icon: BarChart3,
      color: "bg-purple-50 text-purple-600 dark:bg-purple-900 dark:text-purple-300",
    },
    {
      label: "Completed Tasks",
      value: aggregatedStats.totalCompleted,
      icon: CheckCircle2,
      color: "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300",
    },
    {
      label: "Completion Rate",
      value: `${aggregatedStats.completionRate}%`,
      icon: TrendingUp,
      color: "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
    },
  ]

  // Get top performing projects
  const getTopProjects = () => {
    return projectStatistics
      .map(stat => ({
        ...stat,
        completionRate: stat.taskCounts.total > 0 
          ? Math.round((stat.taskCounts.done / stat.taskCounts.total) * 100) 
          : 0
      }))
      .sort((a, b) => b.completionRate - a.completionRate)
      .slice(0, 5)
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
  const topProjects = getTopProjects()
  const showEmptyState = projects.length === 0

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">All Projects Reports</h1>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">
              Overview of all your projects
            </span>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" className="h-9" onClick={() => { setLoading(true); fetchData(); }}>
              <RefreshCw className="mr-2 h-4 w-4" />
              Refresh
            </Button>
            <Button variant="outline" size="sm" className="h-9">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      {/* Report Type Tabs */}
      <div className="mb-6">
        <Tabs defaultValue="overview" value={reportType} onValueChange={setReportType}>
          <TabsList className="grid w-full grid-cols-3 md:w-auto">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="projects">Projects</TabsTrigger>
            <TabsTrigger value="performance">Performance</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Empty State */}
      {showEmptyState ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <FolderOpen className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No projects found</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Start by creating your first project to see reports and analytics.
          </p>
          <Button asChild className="bg-violet-600 hover:bg-violet-700 text-white">
            <Link href="/projects">
              <FolderOpen className="mr-2 h-4 w-4" /> Create Project
            </Link>
          </Button>
        </div>
      ) : (
        <>
          {/* Filters and Controls */}
          <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4">
            <div className="flex flex-wrap gap-3">
              <Select value={dateRange} onValueChange={setDateRange}>
                <SelectTrigger className="w-[180px] h-9">
                  <Calendar className="mr-2 h-4 w-4" />
                  <SelectValue placeholder="Date Range" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="last7days">Last 7 Days</SelectItem>
                  <SelectItem value="last30days">Last 30 Days</SelectItem>
                  <SelectItem value="last90days">Last 90 Days</SelectItem>
                  <SelectItem value="thisMonth">This Month</SelectItem>
                  <SelectItem value="lastMonth">Last Month</SelectItem>
                </SelectContent>
              </Select>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm" className="h-9">
                    <Filter className="mr-2 h-4 w-4" />
                    Filters
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-[200px]">
                  <DropdownMenuItem>All Projects</DropdownMenuItem>
                  <DropdownMenuItem>Active Projects</DropdownMenuItem>
                  <DropdownMenuItem>Completed Projects</DropdownMenuItem>
                  <DropdownMenuItem>By Performance</DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1">
                <X className="h-3.5 w-3.5" />
                <span>Clear Filters</span>
              </Button>
            </div>
          </div>

          {/* Overview Cards */}
          <div className="mb-8">
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

          {/* Projects Overview */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            {/* Top Performing Projects */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Top Performing Projects</h3>
                  <TrendingUp className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="space-y-3">
                  {topProjects.length > 0 ? (
                    topProjects.map((project, index) => (
                      <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {project.projectName.slice(0, 2).toUpperCase()}
                            </AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium text-sm">{project.projectName}</div>
                            <div className="text-xs text-muted-foreground">
                              {project.taskCounts.total} tasks
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <div className="text-sm font-medium">{project.completionRate}%</div>
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/projects/${project.publicId}/reports`}>View</Link>
                          </Button>
                        </div>
                      </div>
                    ))
                  ) : (
                    <div className="text-sm text-muted-foreground text-center py-4">
                      No project data available
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Task Status Summary */}
            <Card className="bg-white dark:bg-gray-800">
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-lg font-medium">Task Status Summary</h3>
                  <BarChart3 className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-green-500"></div>
                      <span className="text-sm">Completed</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{aggregatedStats.totalCompleted}</span>
                      <div className="w-20">
                        <Progress 
                          value={aggregatedStats.totalTasks > 0 ? (aggregatedStats.totalCompleted / aggregatedStats.totalTasks) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-blue-500"></div>
                      <span className="text-sm">In Progress</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{aggregatedStats.totalInProgress}</span>
                      <div className="w-20">
                        <Progress 
                          value={aggregatedStats.totalTasks > 0 ? (aggregatedStats.totalInProgress / aggregatedStats.totalTasks) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full bg-purple-500"></div>
                      <span className="text-sm">In Review</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{aggregatedStats.totalInReview}</span>
                      <div className="w-20">
                        <Progress 
                          value={aggregatedStats.totalTasks > 0 ? (aggregatedStats.totalInReview / aggregatedStats.totalTasks) * 100 : 0} 
                          className="h-2"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* All Projects List */}
          <Card className="bg-white dark:bg-gray-800">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-medium">All Projects</h3>
                <Button variant="ghost" size="sm" asChild>
                  <Link href="/projects">View All</Link>
                </Button>
              </div>

              <div className="space-y-3">
                {projectStatistics.map((project, index) => (
                  <div key={index} className="flex items-center justify-between p-3 rounded-lg border">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10">
                        <AvatarFallback>
                          {project.projectName.slice(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="font-medium text-sm">{project.projectName}</div>
                        <div className="text-xs text-muted-foreground">
                          {project.taskCounts.total} tasks • {project.taskCounts.done} completed
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                        {project.taskCounts.total > 0 
                          ? Math.round((project.taskCounts.done / project.taskCounts.total) * 100)
                          : 0}% done
                      </div>
                      <Button variant="ghost" size="sm" asChild>
                        <Link href={`/projects/${project.publicId}/reports`}>
                          <BarChart3 className="h-4 w-4" />
                        </Link>
                      </Button>
                    </div>
                  </div>
                ))}
                
                {projectStatistics.length === 0 && (
                  <div className="text-sm text-muted-foreground text-center py-4">
                    No project statistics available
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
} 