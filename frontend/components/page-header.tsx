"use client"

import type React from "react"

import { Badge } from "@/components/ui/badge"
import { useProject } from "@/contexts/project-context"

interface PageHeaderProps {
  title: string
  children?: React.ReactNode
}

export function PageHeader({ title, children }: PageHeaderProps) {
  const { currentProject } = useProject()

  if (!currentProject) {
    return (
      <div className="mb-6">
        <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-48 mb-1"></div>
          <div className="h-3 bg-gray-200 rounded w-32"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="mb-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-2">{title}</h1>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4">
        <span className="font-medium">{currentProject.name}</span>
        <span className="text-sm text-muted-foreground">Updated {currentProject.lastUpdated}</span>
        {currentProject.currentSprint && (
          <Badge variant="outline" className="bg-violet-100 text-violet-800 dark:bg-violet-900 dark:text-violet-300">
            {currentProject.currentSprint}
          </Badge>
        )}
      </div>
      {children}
    </div>
  )
}
