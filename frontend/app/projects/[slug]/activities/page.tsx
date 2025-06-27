"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { useAuth } from "@/contexts/auth-context"
import { API_BASE_URL } from "@/lib/api"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import {
  Activity,
  Clock,
  User,
  MessageSquare,
  CheckCircle,
  Plus,
  Edit,
  Trash,
  Flag,
  Calendar,
  FileText,
  ArrowRight,
  RefreshCw,
  UserPlus,
  GitBranch,
  Target,
} from "lucide-react"

// Backend API Response Types
interface ProjectActivityResponse {
  id: number
  taskId: number
  taskTitle: string
  userId: string
  userName: string
  activityType: string
  description?: string
  oldValue?: string
  newValue?: string
  createdAt: string
}

interface ActivityApiResponse {
  activities: ProjectActivityResponse[]
  totalCount: number
  page: number
  pageSize: number
  totalPages: number
}

interface ProjectData {
  id: number
  name: string
  description: string
  publicId: string
}

interface GroupedActivities {
  [date: string]: ProjectActivityResponse[]
}

export default function ProjectActivitiesPage() {
  const params = useParams()
  const publicId = params.slug as string
  const { token } = useAuth()
  
  const [project, setProject] = useState<ProjectData | null>(null)
  const [activities, setActivities] = useState<ProjectActivityResponse[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)

  // Fetch project data and initial activities
  useEffect(() => {
    const fetchData = async () => {
      if (!token || !publicId) return

      try {
        setLoading(true)

        // Fetch project data
        const projectRes = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}`, {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
        })

        if (projectRes.ok) {
          const projectData = await projectRes.json()
          setProject(projectData)
        }

        // Fetch activities
        await fetchActivities(1)

      } catch (error) {
        console.error('Error fetching activities data:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token, publicId])

  const fetchActivities = async (pageNum: number = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}/activities?page=${pageNum}&pageSize=20`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })

      if (response.ok) {
        const data: ActivityApiResponse = await response.json()
        const newActivities = data.activities || []
        
        if (pageNum === 1) {
          setActivities(newActivities)
        } else {
          setActivities(prev => [...prev, ...newActivities])
        }
        
        setTotalCount(data.totalCount || 0)
        setHasMore(pageNum < (data.totalPages || 1))
        setPage(pageNum)
      } else {
        console.error('Failed to fetch activities:', response.status)
        if (pageNum === 1) {
          setActivities([])
          setTotalCount(0)
          setHasMore(false)
        }
      }
    } catch (error) {
      console.error('Error fetching activities:', error)
      if (pageNum === 1) {
        setActivities([])
        setTotalCount(0)
        setHasMore(false)
      }
    }
  }

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      setLoadingMore(true)
      fetchActivities(page + 1).finally(() => setLoadingMore(false))
    }
  }

  const refreshActivities = () => {
    setPage(1)
    setHasMore(true)
    fetchActivities(1)
  }

  // Group activities by day
  const groupedActivities: GroupedActivities = activities.reduce((groups, activity) => {
    const date = new Date(activity.createdAt)
    const dateString = date.toDateString()
    
    if (!groups[dateString]) {
      groups[dateString] = []
    }
    groups[dateString].push(activity)
    return groups
  }, {} as GroupedActivities)

  // Helper functions
  const formatTimeAgo = (timestamp: string) => {
    const activityTime = new Date(timestamp)
    const now = new Date()
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    return activityTime.toLocaleDateString()
  }

  const getActivityIcon = (activity: ProjectActivityResponse) => {
    switch (activity.activityType.toLowerCase()) {
      case 'created':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'updated':
      case 'status_change':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'comment':
        return <MessageSquare className="h-4 w-4 text-purple-600" />
      case 'assigned':
      case 'assignee_change':
        return <UserPlus className="h-4 w-4 text-orange-600" />
      case 'priority_change':
        return <Flag className="h-4 w-4 text-red-600" />
      case 'stage_change':
        return <GitBranch className="h-4 w-4 text-indigo-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getActivityDescription = (activity: ProjectActivityResponse) => {
    const { activityType, description, oldValue, newValue, taskTitle } = activity
    
    if (description) {
      return description
    }

    // Generate descriptions based on activity type
    switch (activityType.toLowerCase()) {
      case 'created':
        return `created task "${taskTitle}"`
      case 'updated':
        return `updated task "${taskTitle}"`
      case 'status_change':
        if (oldValue && newValue) {
          return `changed status of "${taskTitle}" from ${oldValue} to ${newValue}`
        }
        return `updated status of "${taskTitle}"`
      case 'assignee_change':
        if (newValue) {
          return `assigned "${taskTitle}" to ${newValue}`
        }
        return `updated assignee for "${taskTitle}"`
      case 'priority_change':
        if (oldValue && newValue) {
          return `changed priority of "${taskTitle}" from ${oldValue} to ${newValue}`
        }
        return `updated priority of "${taskTitle}"`
      case 'comment':
        return `added a comment to "${taskTitle}"`
      case 'completed':
        return `completed task "${taskTitle}"`
      default:
        return `performed ${activityType} on "${taskTitle}"`
    }
  }

  const formatDateHeader = (dateString: string) => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    
    if (date.toDateString() === today.toDateString()) {
      return 'Today'
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday'
    } else {
      return date.toLocaleDateString('en-US', { 
        weekday: 'long', 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  }

  const getUserInitials = (userName: string) => {
    return userName
      .split(' ')
      .map(name => name.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-6"></div>
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="p-4 md:p-6">
        <div className="text-center mt-10">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground">The project you're looking for doesn't exist.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold mb-2">Activities</h1>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <span>{project.name}</span>
            <span>•</span>
            <span>{totalCount} total activities</span>
          </div>
        </div>
        <Button onClick={refreshActivities} variant="outline" size="sm">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Activities Feed */}
      {activities.length === 0 ? (
        <Card className="bg-white dark:bg-gray-800">
          <CardContent className="p-6">
            <div className="text-center py-8">
              <Activity className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium mb-2">No activities yet</h3>
              <p className="text-muted-foreground">
                Project activities will appear here as team members work on tasks and make changes.
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([date, dayActivities]) => (
              <div key={date}>
                {/* Date Header */}
                <div className="flex items-center gap-4 mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    {formatDateHeader(date)}
                  </h2>
                  <Separator className="flex-1" />
                  <Badge variant="secondary" className="text-xs">
                    {dayActivities.length} activities
                  </Badge>
                </div>

                {/* Activities for this day */}
                <Card className="bg-white dark:bg-gray-800">
                  <CardContent className="p-0">
                    <div className="divide-y divide-gray-100 dark:divide-gray-700">
                      {dayActivities
                        .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
                        .map((activity) => (
                          <div key={activity.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                            <div className="flex items-start gap-3">
                              {/* Activity Icon */}
                              <div className="flex-shrink-0 mt-1">
                                {getActivityIcon(activity)}
                              </div>

                              {/* Activity Content */}
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                  {/* Actor */}
                                  <div className="flex items-center gap-2">
                                    <Avatar className="h-6 w-6">
                                      <AvatarFallback className="text-xs">
                                        {getUserInitials(activity.userName)}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                      {activity.userName}
                                    </span>
                                  </div>

                                  {/* Action Description */}
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {getActivityDescription(activity)}
                                  </span>
                                </div>

                                {/* Status Change Details */}
                                {(activity.oldValue && activity.newValue) && (
                                  <div className="flex items-center gap-2 mt-1">
                                    <Badge variant="outline" className="text-xs">
                                      {activity.oldValue}
                                    </Badge>
                                    <ArrowRight className="h-3 w-3 text-gray-400" />
                                    <Badge variant="outline" className="text-xs">
                                      {activity.newValue}
                                    </Badge>
                                  </div>
                                )}

                                {/* Task Reference */}
                                <div className="flex items-center gap-1 mt-1">
                                  <FileText className="h-3 w-3 text-gray-400" />
                                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                                    {activity.taskTitle}
                                  </span>
                                </div>

                                {/* Timestamp */}
                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTimeAgo(activity.createdAt)}</span>
                                  <span>•</span>
                                  <span>
                                    {new Date(activity.createdAt).toLocaleTimeString('en-US', { 
                                      hour: 'numeric', 
                                      minute: '2-digit',
                                      hour12: true 
                                    })}
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}

          {/* Load More Button */}
          {hasMore && (
            <div className="text-center pt-6">
              <Button 
                onClick={loadMore} 
                variant="outline"
                disabled={loadingMore}
                className="w-full sm:w-auto"
              >
                {loadingMore ? (
                  <>
                    <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                    Loading...
                  </>
                ) : (
                  'Load More Activities'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 