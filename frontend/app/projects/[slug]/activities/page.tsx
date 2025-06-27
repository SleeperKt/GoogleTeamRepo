"use client"

import { useState, useEffect } from "react"
import { useParams } from "next/navigation"
import { 
  Calendar, 
  Clock, 
  User, 
  FileText, 
  AlertCircle, 
  MoreHorizontal,
  ArrowUp,
  ArrowDown,
  MessageSquare,
  Trash2,
  X,
  Activity
} from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { apiRequest } from "@/lib/api"

// Activity type filters with labels - matching backend activity types exactly
const activityFilters = {
  all: { label: "All Activities", color: "" },
  created: { label: "Tasks Created", color: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300" },
  updated: { label: "Tasks Updated", color: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300" },
  status_change: { label: "Status Changes", color: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300" },
  assignee_change: { label: "Assignments", color: "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300" },
  priority_change: { label: "Priority Changes", color: "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300" },
  comment: { label: "Comments", color: "bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-300" },
  deleted: { label: "Tasks Deleted", color: "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300" },
}

interface ActivityItem {
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

interface ActivityResponse {
  activities: ActivityItem[]
  totalCount: number
}

interface Project {
  id: number
  name: string
  description: string
  publicId: string
}

export default function ProjectActivitiesPage() {
  const params = useParams()
  const publicId = params.slug as string
  
  const [project, setProject] = useState<Project | null>(null)
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [totalCount, setTotalCount] = useState(0)
  const [page, setPage] = useState(1)
  const [filter, setFilter] = useState("all")
  const pageSize = 20

  // Fetch project details
  const fetchProject = async () => {
    if (!publicId) return

    try {
      const projectData = await apiRequest<Project>(`/api/projects/public/${publicId}`)
      setProject(projectData)
    } catch (err) {
      console.error('Error fetching project:', err)
    }
  }

  // Fetch activities
  const fetchActivities = async (pageNum = 1, append = false, filterType = filter) => {
    if (!publicId) return

    try {
      if (!append) {
        setLoading(true)
      } else {
        setLoadingMore(true)
      }
      
      // Build query parameters
      const queryParams = new URLSearchParams({
        page: pageNum.toString(),
        pageSize: pageSize.toString()
      })
      
      if (filterType !== 'all') {
        queryParams.append('filter', filterType)
      }
      
      const endpoint = `/api/projects/public/${publicId}/activities?${queryParams.toString()}`
      const data = await apiRequest<ActivityResponse>(endpoint)
      
      if (append && pageNum > 1) {
        setActivities(prev => [...prev, ...data.activities])
      } else {
        setActivities(data.activities)
      }
      
      setTotalCount(data.totalCount)
      setHasMore(data.activities.length === pageSize)
      setError(null)
    } catch (err) {
      console.error('Error fetching activities:', err)
      setError(err instanceof Error ? err.message : 'Failed to fetch activities')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }

  // Initial data fetch
  useEffect(() => {
    if (publicId) {
      fetchProject()
      fetchActivities(1, false)
      setPage(1)
    }
  }, [publicId])

  // Handle filter changes
  useEffect(() => {
    if (publicId) {
      fetchActivities(1, false, filter)
      setPage(1)
    }
  }, [filter, publicId])

  // Load more activities
  const loadMore = async () => {
    if (!hasMore || loadingMore) return
    
    const nextPage = page + 1
    await fetchActivities(nextPage, true, filter)
    setPage(nextPage)
  }

  // Clear filters
  const clearFilters = () => {
    setFilter("all")
  }

  // Get user initials
  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(part => part.charAt(0))
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  // Format timestamp
  const formatTimeAgo = (timestamp: string) => {
    try {
      const date = new Date(timestamp)
      if (isNaN(date.getTime())) {
        return 'Invalid date'
      }
      
      const now = new Date()
      const diffInMs = now.getTime() - date.getTime()
      const diffInMinutes = Math.floor(diffInMs / (1000 * 60))
      const diffInHours = Math.floor(diffInMinutes / 60)
      const diffInDays = Math.floor(diffInHours / 24)
      
      if (diffInMinutes < 60) {
        return `${diffInMinutes}m ago`
      } else if (diffInHours < 24) {
        return `${diffInHours}h ago`
      } else if (diffInDays < 7) {
        return `${diffInDays}d ago`
      } else {
        return date.toLocaleDateString()
      }
    } catch (error) {
      return 'Invalid date'
    }
  }

  // Group activities by date
  const groupActivitiesByDate = (activities: ActivityItem[]) => {
    const groups: { [key: string]: ActivityItem[] } = {}
    
    activities.forEach(activity => {
      const date = new Date(activity.createdAt)
      if (isNaN(date.getTime())) return
      
      const dateKey = date.toDateString()
      if (!groups[dateKey]) {
        groups[dateKey] = []
      }
      groups[dateKey].push(activity)
    })
    
    return groups
  }

  // Get activity icon
  const getActivityIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'created':
        return <FileText className="h-4 w-4" />
      case 'updated':
        return <FileText className="h-4 w-4" />
      case 'status_change':
        return <MoreHorizontal className="h-4 w-4" />
      case 'assignee_change':
        return <User className="h-4 w-4" />
      case 'priority_change':
        return <ArrowUp className="h-4 w-4" />
      case 'comment':
        return <MessageSquare className="h-4 w-4" />
      case 'deleted':
        return <Trash2 className="h-4 w-4" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full"></div>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-4 md:p-6 w-full">
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-medium mb-2">Error loading activities</h3>
            <p className="text-gray-500 mb-4">{error}</p>
            <Button onClick={() => fetchActivities(1, false)}>Try Again</Button>
          </div>
        </div>
      </div>
    )
  }

  const groupedActivities = groupActivitiesByDate(activities)

  return (
    <div className="p-4 md:p-6 w-full">
      {/* Header Section */}
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">Activities</h1>
        {project && (
          <div className="flex items-center gap-2">
            <span className="font-medium">{project.name}</span>
            <span className="text-sm text-muted-foreground">
              {filter !== 'all' ? (
                <>
                  {totalCount} filtered {totalCount === 1 ? 'activity' : 'activities'}
                  <Badge variant="secondary" className="ml-2">
                    {activityFilters[filter as keyof typeof activityFilters]?.label}
                  </Badge>
                </>
              ) : (
                `${totalCount} total ${totalCount === 1 ? 'activity' : 'activities'}`
              )}
            </span>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg border shadow-sm p-4">
        <div className="flex flex-wrap gap-2">
          <Select value={filter} onValueChange={(value) => setFilter(value)}>
            <SelectTrigger className="w-[140px] h-9">
              <SelectValue placeholder="Activity Type" />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(activityFilters).map(([key, { label }]) => (
                <SelectItem key={key} value={key}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Button variant="outline" size="sm" className="h-9 px-3 flex items-center gap-1" onClick={clearFilters}>
            <X className="h-3.5 w-3.5" />
            <span>Clear</span>
          </Button>
        </div>
      </div>

      {/* Activities Timeline */}
      {activities.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-12 px-4 text-center bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
          <div className="bg-gray-100 dark:bg-gray-700 rounded-full p-6 mb-4">
            <Activity className="h-12 w-12 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-xl font-medium mb-2">No activities yet</h3>
          <p className="text-gray-500 dark:text-gray-400 mb-6 max-w-md">
            Activities will appear here as team members work on tasks.
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {Object.entries(groupedActivities)
            .sort(([a], [b]) => new Date(b).getTime() - new Date(a).getTime())
            .map(([dateString, dayActivities]) => (
              <div key={dateString} className="bg-white dark:bg-gray-800 rounded-lg border shadow-sm">
                <div className="p-4 border-b bg-gray-50 dark:bg-gray-700/50">
                  <h3 className="font-medium text-gray-900 dark:text-gray-100">
                    {new Date(dateString).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {dayActivities.length} {dayActivities.length === 1 ? 'activity' : 'activities'}
                  </p>
                </div>
                <div className="divide-y divide-gray-200 dark:divide-gray-700">
                  {dayActivities.map((activity, index) => (
                    <div 
                      key={`${activity.id}-${index}`}
                      className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <Avatar className="h-8 w-8 flex-shrink-0">
                          <AvatarFallback className="text-xs">
                            {getUserInitials(activity.userName)}
                          </AvatarFallback>
                        </Avatar>
                        
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {activity.userName}
                            </span>
                            <div className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                              {getActivityIcon(activity.activityType)}
                            </div>
                            <span className="text-sm text-gray-500 dark:text-gray-400">
                              {formatTimeAgo(activity.createdAt)}
                            </span>
                          </div>
                          
                          <p className="text-sm text-gray-700 dark:text-gray-300 mb-2">
                            {activity.description}
                          </p>
                          
                          <div className="flex items-center gap-2">
                            <Badge variant="outline" className="text-xs">
                              {activity.taskTitle}
                            </Badge>
                            {activityFilters[activity.activityType as keyof typeof activityFilters]?.color && (
                              <Badge 
                                variant="outline" 
                                className={`text-xs ${activityFilters[activity.activityType as keyof typeof activityFilters]?.color}`}
                              >
                                {activityFilters[activity.activityType as keyof typeof activityFilters]?.label}
                              </Badge>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          
          {/* Load More Button */}
          {hasMore && (
            <div className="flex justify-center pt-6">
              <Button 
                onClick={loadMore} 
                disabled={loadingMore}
                variant="outline"
                className="min-w-[120px]"
              >
                {loadingMore ? (
                  <>
                    <div className="animate-spin h-4 w-4 border-2 border-violet-500 border-t-transparent rounded-full mr-2"></div>
                    Loading...
                  </>
                ) : (
                  'Load More'
                )}
              </Button>
            </div>
          )}
        </div>
      )}
    </div>
  )
} 