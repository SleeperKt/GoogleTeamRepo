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
} from "lucide-react"

// Activity Types
interface ActivityItem {
  id: number
  action: string
  actorName: string
  actorId?: string
  timestamp: string
  objectType: 'task' | 'milestone' | 'comment' | 'project' | 'user'
  objectName: string
  objectId?: number
  details?: string
  metadata?: {
    fromStatus?: string
    toStatus?: string
    fieldName?: string
    oldValue?: string
    newValue?: string
  }
}

interface ProjectData {
  id: number
  name: string
  description: string
  publicId: string
}

interface GroupedActivities {
  [date: string]: ActivityItem[]
}

export default function ProjectActivitiesPage() {
  const params = useParams()
  const publicId = params.slug as string
  const { token } = useAuth()
  
  const [project, setProject] = useState<ProjectData | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [page, setPage] = useState(1)
  const [hasMore, setHasMore] = useState(true)

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
        // Create mock activities for demo since backend might not have this endpoint yet
        generateMockActivities()
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [token, publicId])

  const fetchActivities = async (pageNum: number = 1) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}/activities?page=${pageNum}&limit=20`, {
        headers: { 
          Authorization: `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
      })

      if (response.ok) {
        const data = await response.json()
        const newActivities = Array.isArray(data) ? data : data.activities || data.data || []
        
        if (pageNum === 1) {
          setActivities(newActivities)
        } else {
          setActivities(prev => [...prev, ...newActivities])
        }
        
        setHasMore(newActivities.length === 20) // If we got less than 20, no more pages
        setPage(pageNum)
      } else {
        throw new Error('Activities endpoint not available')
      }
    } catch (error) {
      console.log('Activities endpoint not available, using mock data')
      if (pageNum === 1) {
        generateMockActivities()
      }
    }
  }

  const generateMockActivities = () => {
    const mockActivities: ActivityItem[] = [
      {
        id: 1,
        action: "created task",
        actorName: "John Doe",
        timestamp: new Date(Date.now() - 5 * 60 * 1000).toISOString(), // 5 minutes ago
        objectType: 'task',
        objectName: 'Implement user authentication',
        details: 'Added new task to the backlog with high priority'
      },
      {
        id: 2,
        action: "updated task status",
        actorName: "Sarah Wilson",
        timestamp: new Date(Date.now() - 15 * 60 * 1000).toISOString(), // 15 minutes ago
        objectType: 'task',
        objectName: 'Fix navigation bug',
        metadata: {
          fromStatus: 'In Progress',
          toStatus: 'Done'
        }
      },
      {
        id: 3,
        action: "added comment",
        actorName: "Mike Johnson",
        timestamp: new Date(Date.now() - 30 * 60 * 1000).toISOString(), // 30 minutes ago
        objectType: 'comment',
        objectName: 'API Integration task',
        details: 'Need to review the authentication flow before completing this'
      },
      {
        id: 4,
        action: "created milestone",
        actorName: "John Doe",
        timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(), // 2 hours ago
        objectType: 'milestone',
        objectName: 'Sprint 1 Complete',
        details: 'Added milestone for end of current sprint'
      },
      {
        id: 5,
        action: "assigned user",
        actorName: "Sarah Wilson",
        timestamp: new Date(Date.now() - 3 * 60 * 60 * 1000).toISOString(), // 3 hours ago
        objectType: 'task',
        objectName: 'Database optimization',
        details: 'Assigned to Mike Johnson'
      },
      {
        id: 6,
        action: "updated task priority",
        actorName: "Alex Chen",
        timestamp: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(), // Yesterday
        objectType: 'task',
        objectName: 'UI Design Review',
        metadata: {
          fromStatus: 'Medium',
          toStatus: 'High'
        }
      },
      {
        id: 7,
        action: "completed task",
        actorName: "Mike Johnson",
        timestamp: new Date(Date.now() - 25 * 60 * 60 * 1000).toISOString(), // Yesterday
        objectType: 'task',
        objectName: 'Setup CI/CD pipeline',
        details: 'Successfully configured automated deployment'
      },
      {
        id: 8,
        action: "created task",
        actorName: "Sarah Wilson",
        timestamp: new Date(Date.now() - 26 * 60 * 60 * 1000).toISOString(), // Yesterday
        objectType: 'task',
        objectName: 'Write API documentation',
        details: 'Documentation needed for new endpoints'
      },
      {
        id: 9,
        action: "updated project settings",
        actorName: "John Doe",
        timestamp: new Date(Date.now() - 48 * 60 * 60 * 1000).toISOString(), // 2 days ago
        objectType: 'project',
        objectName: project?.name || 'Current Project',
        details: 'Updated workflow stages and labels'
      },
      {
        id: 10,
        action: "deleted task",
        actorName: "Alex Chen",
        timestamp: new Date(Date.now() - 72 * 60 * 60 * 1000).toISOString(), // 3 days ago
        objectType: 'task',
        objectName: 'Duplicate feature request',
        details: 'Removed duplicate task from backlog'
      }
    ]
    
    setActivities(mockActivities)
    setHasMore(false) // No more mock data to load
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
    const date = new Date(activity.timestamp).toDateString()
    if (!groups[date]) {
      groups[date] = []
    }
    groups[date].push(activity)
    return groups
  }, {} as GroupedActivities)

  // Helper functions
  const formatTimeAgo = (timestamp: string) => {
    const now = new Date()
    const activityTime = new Date(timestamp)
    const diffInMinutes = Math.floor((now.getTime() - activityTime.getTime()) / (1000 * 60))
    
    if (diffInMinutes < 1) return 'Just now'
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`
    
    const diffInHours = Math.floor(diffInMinutes / 60)
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`
    
    const diffInDays = Math.floor(diffInHours / 24)
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`
    
    return activityTime.toLocaleDateString()
  }

  const getActivityIcon = (activity: ActivityItem) => {
    switch (activity.action) {
      case 'created task':
      case 'created milestone':
        return <Plus className="h-4 w-4 text-green-600" />
      case 'updated task status':
      case 'updated task priority':
      case 'updated project settings':
        return <Edit className="h-4 w-4 text-blue-600" />
      case 'completed task':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'added comment':
        return <MessageSquare className="h-4 w-4 text-purple-600" />
      case 'assigned user':
        return <User className="h-4 w-4 text-orange-600" />
      case 'deleted task':
        return <Trash className="h-4 w-4 text-red-600" />
      default:
        return <Activity className="h-4 w-4 text-gray-600" />
    }
  }

  const getObjectIcon = (objectType: string) => {
    switch (objectType) {
      case 'task':
        return <FileText className="h-3 w-3" />
      case 'milestone':
        return <Flag className="h-3 w-3" />
      case 'comment':
        return <MessageSquare className="h-3 w-3" />
      case 'project':
        return <Calendar className="h-3 w-3" />
      default:
        return <Activity className="h-3 w-3" />
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
            <span>{activities.length} activities</span>
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
                Project activities will appear here as team members work on tasks and milestones.
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
                        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
                        .map((activity, index) => (
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
                                        {activity.actorName.split(' ').map(n => n[0]).join('')}
                                      </AvatarFallback>
                                    </Avatar>
                                    <span className="font-medium text-sm text-gray-900 dark:text-gray-100">
                                      {activity.actorName}
                                    </span>
                                  </div>

                                  {/* Action */}
                                  <span className="text-sm text-gray-600 dark:text-gray-400">
                                    {activity.action}
                                  </span>

                                  {/* Object */}
                                  <div className="flex items-center gap-1">
                                    {getObjectIcon(activity.objectType)}
                                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                      {activity.objectName}
                                    </span>
                                  </div>
                                </div>

                                {/* Details & Metadata */}
                                {(activity.details || activity.metadata) && (
                                  <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                                    {activity.details && (
                                      <p>{activity.details}</p>
                                    )}
                                    {activity.metadata && (
                                      <div className="flex items-center gap-2 mt-1">
                                        {activity.metadata.fromStatus && activity.metadata.toStatus && (
                                          <div className="flex items-center gap-1">
                                            <Badge variant="outline" className="text-xs">
                                              {activity.metadata.fromStatus}
                                            </Badge>
                                            <ArrowRight className="h-3 w-3" />
                                            <Badge variant="outline" className="text-xs">
                                              {activity.metadata.toStatus}
                                            </Badge>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                )}

                                {/* Timestamp */}
                                <div className="flex items-center gap-1 mt-2 text-xs text-gray-500 dark:text-gray-400">
                                  <Clock className="h-3 w-3" />
                                  <span>{formatTimeAgo(activity.timestamp)}</span>
                                  <span>•</span>
                                  <span>{new Date(activity.timestamp).toLocaleTimeString('en-US', { 
                                    hour: 'numeric', 
                                    minute: '2-digit',
                                    hour12: true 
                                  })}</span>
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