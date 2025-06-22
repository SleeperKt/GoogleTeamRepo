"use client"

import type React from "react"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { AppLayout } from "./app-layout"
import { ProjectProvider } from "@/contexts/project-context"
import { useAuth } from "@/contexts/auth-context"

const publicRoutes = ["/", "/login", "/register", "/terms", "/privacy"]

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const router = useRouter()
  const { token, user, isLoading, isHydrated } = useAuth()
  const isPublicRoute = publicRoutes.includes(pathname)
  const [loadingTimeout, setLoadingTimeout] = useState(false)

  // Add a timeout to prevent infinite loading
  useEffect(() => {
    if (isLoading && isHydrated) {
      const timer = setTimeout(() => {
        console.warn("Loading timeout reached, proceeding anyway")
        setLoadingTimeout(true)
      }, 10000) // 10 second timeout

      return () => clearTimeout(timer)
    } else {
      setLoadingTimeout(false)
    }
  }, [isLoading, isHydrated])

  // Handle authentication-based redirects
  useEffect(() => {
    // Only handle redirects after hydration is complete
    if (!isHydrated) return
    
    // Don't redirect while still loading (unless timeout reached)
    if (isLoading && !loadingTimeout) return

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
  }, [isHydrated, isLoading, loadingTimeout, isPublicRoute, token, pathname, router])

  // Show nothing during hydration to prevent hydration mismatch
  if (!isHydrated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Starting up...</p>
        </div>
      </div>
    )
  }

  // Show loading state while checking authentication (with timeout override)
  if (isLoading && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    )
  }

  // Show loading state for protected routes without token (before redirect)
  if (!isPublicRoute && !token && !loadingTimeout) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin h-8 w-8 border-2 border-violet-500 border-t-transparent rounded-full mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting to login...</p>
        </div>
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
