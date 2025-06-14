"use client"

import type React from "react"

import { usePathname } from "next/navigation"
import { AppLayout } from "./app-layout"
import { ProjectProvider } from "@/contexts/project-context"

const publicRoutes = ["/", "/login", "/register", "/terms", "/privacy"]

export function ConditionalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const isPublicRoute = publicRoutes.includes(pathname)

  if (isPublicRoute) {
    return <>{children}</>
  }

  return (
    <ProjectProvider>
      <AppLayout>{children}</AppLayout>
    </ProjectProvider>
  )
}
