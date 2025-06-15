"use client"

import type React from "react"
import { useEffect } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppLayout } from "./app-layout"
import { ProjectProvider } from "@/contexts/project-context"
import { useAuth } from "@/contexts/auth-context"

const publicRoutes = ["/", "/login", "/register", "/terms", "/privacy"]

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { token, user, isLoading } = useAuth()
  const isPublicRoute = publicRoutes.includes(pathname)

  // Handle authentication-based redirects
  useEffect(() => {
    // Don't redirect while still loading
    if (isLoading) return

    if (!isPublicRoute && !token) {
      // Redirect to login if accessing protected route without authentication
      if (typeof window !== "undefined") {
        localStorage.setItem("redirectAfterLogin", pathname)
      }
      router.push("/login")
    } else if (token && (pathname === "/login" || pathname === "/register")) {
      // Redirect authenticated users away from login/register pages
      router.push("/projects")
    }
  }, [isLoading, isPublicRoute, token, pathname, router])

  // Show loading state while checking authentication
  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  // Show loading state for protected routes without token (before redirect)
  if (!isPublicRoute && !token) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full"></div>
      </div>
    )
  }

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <ProjectProvider>
      <AppLayout>{children}</AppLayout>
    </ProjectProvider>
  )
}
