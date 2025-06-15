"use client"

import type React from "react"

import { useState, useEffect } from "react"
import {
  BarChart3,
  Bell,
  ChevronDown,
  ChevronRight,
  Cog,
  FolderKanban,
  ListTodo,
  PanelLeft,
  Plus,
  Activity,
  Calendar,
  Folder,
} from "lucide-react"
import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import {
  Sidebar,
  SidebarContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { ProjectSelector } from "@/components/project-selector"
import { useAuth } from "@/contexts/auth-context"
import { useProject } from "@/contexts/project-context"
import { API_BASE_URL } from "@/lib/api"

interface Project {
  id: number
  name: string
  description: string
  publicId: string
}

interface NavItem {
  name: string
  href: string
  icon: React.ElementType
  expanded?: boolean
  children?: {
    name: string
    href: string
    icon?: React.ElementType
    starred?: boolean
  }[]
}

const baseNavItems: Omit<NavItem, "children">[] = [
  {
    name: "Backlog",
    href: "/backlog",
    icon: ListTodo,
  },
  {
    name: "Reports",
    href: "/reports",
    icon: BarChart3,
  },
  {
    name: "Settings",
    href: "/settings",
    icon: Cog,
  },
]

// Helper component to show the toggle button only when the sidebar is collapsed
function SidebarConditionalTrigger() {
  const { state } = useSidebar()
  return state === "collapsed" ? (
    <SidebarTrigger variant="ghost" size="icon" className="mr-2" />
  ) : null
}

export function AppLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const [expandedItems, setExpandedItems] = useState<Record<string, boolean>>({})
  const [createProjectOpen, setCreateProjectOpen] = useState(false)
  const [notificationsOpen, setNotificationsOpen] = useState(false)
  const [notifications, setNotifications] = useState<Array<{
    id: number
    title: string
    message: string
    time: string
    read: boolean
  }>>([])
  const { user, logout, token } = useAuth()
  const { currentProject, projects, refreshProjects } = useProject()

  // Generate navigation items based on current project
  const navItems: NavItem[] = currentProject ? [
    // Current Project Section
    {
      name: currentProject.name,
      href: `/projects/${currentProject.publicId}`,
      icon: FolderKanban,
      expanded: true,
      children: [
        {
          name: "Board",
          href: `/projects/${currentProject.publicId}/board`,
          icon: PanelLeft,
        },
        {
          name: "Backlog",
          href: `/projects/${currentProject.publicId}/backlog`,
          icon: ListTodo,
        },
        {
          name: "Reports",
          href: `/projects/${currentProject.publicId}/reports`,
          icon: BarChart3,
        },
        {
          name: "Activities",
          href: `/projects/${currentProject.publicId}/activities`,
          icon: Activity,
        },
      ],
    },
    // Global Navigation
    {
      name: "All Projects",
      href: "/projects",
      icon: Folder,
    },
    {
      name: "Timeline",
      href: "/timeline",
      icon: Calendar,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Cog,
    },
  ] : [
    // Fallback when no project is selected
    {
      name: "All Projects",
      href: "/projects",
      icon: Folder,
    },
    {
      name: "Settings",
      href: "/settings",
      icon: Cog,
    },
  ]

  const toggleExpanded = (name: string) => {
    setExpandedItems((prev) => ({
      ...prev,
      [name]: !prev[name],
    }))
  }

  const handleCreateProject = (e: React.FormEvent) => {
    e.preventDefault()
    // In a real app, you would save the project data
    setCreateProjectOpen(false)
    // Navigate to the projects page
    router.push("/projects")
  }

  const markAsRead = (id: number) => {
    setNotifications(
      notifications.map((notification) => (notification.id === id ? { ...notification, read: true } : notification)),
    )
  }

  const markAllAsRead = () => {
    setNotifications(notifications.map((notification) => ({ ...notification, read: true })))
  }

  const clearAllNotifications = () => {
    setNotifications([])
  }

  return (
    <SidebarProvider>
      <div className="flex h-screen w-screen overflow-hidden">
        <Sidebar className="border-r">
          <SidebarHeader className="border-b p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-md bg-violet-600 text-white">
                  <FolderKanban className="h-4 w-4" />
                </div>
                <span className="text-lg font-semibold">ProjectHub</span>
              </div>
              <SidebarTrigger />
            </div>
          </SidebarHeader>
          <SidebarContent>
            {/* Project Selector */}
            <div className="border-b pb-2 mb-2">
              <ProjectSelector />
            </div>

            <SidebarMenu>
              {navItems.map((item) => (
                <SidebarMenuItem key={item.name}>
                  {item.children ? (
                    <div>
                      <div className="flex items-center">
                        <Link
                          href={item.href}
                          className={cn(
                            "flex flex-1 items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                            pathname.startsWith(item.href)
                              ? "bg-muted text-foreground"
                              : "text-muted-foreground hover:bg-muted hover:text-foreground",
                          )}
                        >
                          <item.icon className="h-4 w-4" />
                          <span>{item.name}</span>
                        </Link>

                        {/* Simple dropdown button */}
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-8 w-8 p-0 hover:bg-muted"
                          onClick={() => toggleExpanded(item.name)}
                        >
                          {expandedItems[item.name] !== false ? (
                            <ChevronDown className="h-4 w-4" />
                          ) : (
                            <ChevronRight className="h-4 w-4" />
                          )}
                          <span className="sr-only">Toggle {item.name}</span>
                        </Button>
                      </div>

                      {/* Expanded content */}
                      {expandedItems[item.name] !== false && (
                        <div className="pl-4 mt-1">
                          {item.children.map((child) => (
                            <Link
                              key={child.name}
                              href={child.href}
                              className={cn(
                                "flex items-center gap-2 px-2 py-1 text-sm rounded-md hover:bg-muted",
                                pathname === child.href || pathname.startsWith(child.href)
                                  ? "bg-muted text-foreground font-medium"
                                  : "text-muted-foreground"
                              )}
                            >
                              {child.icon && <child.icon className="h-4 w-4" />}
                              <span>{child.name}</span>
                            </Link>
                          ))}
                        </div>
                      )}
                    </div>
                  ) : (
                    <Link
                      href={item.href}
                      className={cn(
                        "flex items-center gap-2 rounded-md px-3 py-2 text-sm font-medium",
                        pathname === item.href || pathname.startsWith(item.href)
                          ? "bg-muted text-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground",
                      )}
                    >
                      <item.icon className="h-4 w-4" />
                      <span>{item.name}</span>
                    </Link>
                  )}
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarContent>
        </Sidebar>
        <div className="flex flex-col flex-1 overflow-hidden">
          <header className="flex h-14 items-center justify-between border-b bg-background px-4 lg:px-6">
            {/* Sidebar toggle button appears only when sidebar is collapsed */}
            <SidebarConditionalTrigger />

            {/* Left side of header - empty now that search is removed */}
            <div></div>

            {/* Profile and notifications */}
            <div className="flex items-center gap-3">
              <DropdownMenu open={notificationsOpen} onOpenChange={setNotificationsOpen}>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="relative">
                    <Bell className="h-5 w-5" />
                    {notifications.some((notification) => !notification.read) && (
                      <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-red-500"></span>
                    )}
                    <span className="sr-only">Notifications</span>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-80">
                  <div className="flex items-center justify-between p-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={markAllAsRead}
                      disabled={!notifications.some((notification) => !notification.read)}
                    >
                      Mark all as read
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-2 text-xs"
                      onClick={clearAllNotifications}
                      disabled={notifications.length === 0}
                    >
                      Clear all
                    </Button>
                  </div>
                  <DropdownMenuSeparator />
                  {notifications.length === 0 ? (
                    <div className="p-4 text-center text-sm text-muted-foreground">No notifications</div>
                  ) : (
                    <div className="max-h-[300px] overflow-auto">
                      {notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className={cn("p-3 cursor-pointer hover:bg-muted", !notification.read && "bg-muted/50")}
                          onClick={() => markAsRead(notification.id)}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={cn(
                                "mt-1 h-2 w-2 flex-shrink-0 rounded-full",
                                notification.read ? "bg-transparent" : "bg-red-500",
                              )}
                            />
                            <div>
                              <p className="text-sm font-medium">{notification.title}</p>
                              <p className="text-xs text-muted-foreground">{notification.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  <DropdownMenuSeparator />
                </DropdownMenuContent>
              </DropdownMenu>

              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="h-8 gap-2 pl-1">
                    <Avatar className="h-7 w-7">
                      <AvatarFallback className="bg-violet-100 text-violet-600 font-semibold">
                        {user?.username ? user.username[0].toUpperCase() : "U"}
                      </AvatarFallback>
                    </Avatar>
                    <span className="font-medium text-sm">{user ? user.username : "Guest"}</span>
                    <ChevronDown className="h-4 w-4 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>My Account</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => router.push("/profile")}>Profile</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>Settings</DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/billing")}>Billing</DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    onClick={() => {
                      logout()
                      router.push("/login")
                    }}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </header>
          <main className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900">{children}</main>
        </div>
      </div>
    </SidebarProvider>
  )
}
