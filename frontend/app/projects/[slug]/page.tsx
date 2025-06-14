"use client"

import type React from "react"

import { ArrowLeft, CheckCircle2, Edit, FileText, MoreHorizontal, PlayCircle, Users, XCircle, LayoutGrid } from "lucide-react"
import Link from "next/link"
import { useParams, useRouter } from "next/navigation"
import { useEffect, useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { useAuth } from "@/contexts/auth-context"
import { API_BASE_URL } from "@/lib/api"

// Status colors
const statusColors: Record<string, string> = {
  Active: "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300",
  "On Hold": "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300",
  Completed: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
}

// Metric card data
const getMetricCards = (metrics: any) => [
  {
    label: "Total Tasks",
    value: metrics.totalTasks,
    icon: FileText,
    color: "bg-blue-50 text-blue-600 dark:bg-blue-900 dark:text-blue-300",
  },
  {
    label: "Completed",
    value: metrics.completedTasks,
    icon: CheckCircle2,
    color: "bg-green-50 text-green-600 dark:bg-green-900 dark:text-green-300",
  },
  {
    label: "In Progress",
    value: metrics.inProgressTasks,
    icon: PlayCircle,
    color: "bg-violet-50 text-violet-600 dark:bg-violet-900 dark:text-violet-300",
  },
  {
    label: "Overdue",
    value: metrics.overdueTasks,
    icon: XCircle,
    color: "bg-red-50 text-red-600 dark:bg-red-900 dark:text-red-300",
  },
  {
    label: "Team Members",
    value: metrics.teamMembers,
    icon: Users,
    color: "bg-amber-50 text-amber-600 dark:bg-amber-900 dark:text-amber-300",
  },
]

export default function ProjectDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { token } = useAuth()
  const publicId = params.slug as string

  const [project, setProject] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchProject = async () => {
      if (!token) {
        setLoading(false)
        return
      }
      try {
        const res = await fetch(`${API_BASE_URL}/api/projects/public/${publicId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          // convert to shape expected by UI, add placeholder metrics
          const adapted = {
            ...data,
            status: "Active",
            lastUpdated: new Date(data.createdAt).toLocaleString(),
            owner: "Me",
            initials: data.name.slice(0, 2).toUpperCase(),
            progress: 0,
            metrics: { totalTasks: 0, completedTasks: 0, inProgressTasks: 0, overdueTasks: 0, teamMembers: 1 },
            team: [],
            recentActivity: [],
          }
          setProject(adapted)
        } else {
          setProject(null)
        }
      } catch (err) {
        console.error(err)
        setProject(null)
      } finally {
        setLoading(false)
      }
    }
    fetchProject()
  }, [token, publicId])

  if (loading) {
    return <div className="p-4">Loading...</div>
  }

  if (!project) {
    return (
      <div className="p-4 md:p-6">
        <Button variant="ghost" size="sm" asChild className="mb-4">
          <Link href="/projects">
            <ArrowLeft className="mr-2 h-4 w-4" />Back to projects
          </Link>
        </Button>
        <div className="text-center mt-10">
          <h1 className="text-2xl font-bold mb-2">Project Not Found</h1>
          <p className="text-muted-foreground mb-6">The project you're looking for doesn't exist.</p>
          <Button asChild>
            <Link href="/projects">View All Projects</Link>
          </Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4 md:p-6">
      <Button variant="ghost" size="sm" asChild className="mb-4">
        <Link href="/projects">
          <ArrowLeft className="mr-2 h-4 w-4" />Back to projects
        </Link>
      </Button>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-2xl font-bold">{project.name}</h1>
        <Button asChild>
          <Link href={`/projects/${publicId}/board`}>
            <LayoutGrid className="mr-2 h-4 w-4" />
            View Board
          </Link>
        </Button>
      </div>
      <p className="text-muted-foreground mb-6">{project.description}</p>
      <Badge className={statusColors[project.status] ?? ""}>{project.status}</Badge>
      <p className="text-sm mt-2">Created at: {new Date(project.createdAt).toLocaleString()}</p>
    </div>
  )
}
