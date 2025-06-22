"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Check, ChevronDown, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useProject } from "@/contexts/project-context"
import { cn } from "@/lib/utils"

export function ProjectSelector() {
  const { currentProject, projects, setCurrentProject } = useProject()
  const [open, setOpen] = useState(false)
  const router = useRouter()

  if (!currentProject) {
    return (
      <div className="px-3 py-2">
        <div className="animate-pulse">
          <div className="h-10 bg-gray-200 rounded-md"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="px-3 py-2">
      <DropdownMenu open={open} onOpenChange={setOpen}>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="w-full justify-between h-auto p-2 hover:bg-muted/50" aria-expanded={open}>
            <div className="flex items-center gap-2 min-w-0">
              <Avatar className="h-8 w-8">
                <AvatarFallback className={cn("text-xs font-medium", currentProject.color)}>
                  {currentProject.avatar}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col items-start min-w-0">
                <span className="font-medium text-sm truncate max-w-[140px]">{currentProject.name}</span>
                <span className="text-xs text-muted-foreground truncate max-w-[140px]">
                  {currentProject.description}
                </span>
              </div>
            </div>
            <ChevronDown className="h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent className="w-[280px]" align="start" side="right">
          <DropdownMenuLabel>Switch Project</DropdownMenuLabel>
          <DropdownMenuSeparator />
          {projects.map((project) => (
            <DropdownMenuItem
              key={project.id}
              className="flex items-center gap-2 p-3 cursor-pointer"
              onClick={() => {
                setCurrentProject(project)
                setOpen(false)
              }}
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback className={cn("text-xs font-medium", project.color)}>{project.avatar}</AvatarFallback>
              </Avatar>
              <div className="flex flex-col flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="font-medium text-sm truncate">{project.name}</span>
                  {project.id === currentProject.id && <Check className="h-4 w-4 text-violet-600" />}
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground truncate">{project.description}</span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "text-xs px-1.5 py-0.5",
                      project.status === "Active" && "bg-green-50 text-green-700 border-green-200",
                      project.status === "On Hold" && "bg-gray-50 text-gray-700 border-gray-200",
                      project.status === "Planning" && "bg-blue-50 text-blue-700 border-blue-200",
                    )}
                  >
                    {project.status}
                  </Badge>
                </div>
              </div>
            </DropdownMenuItem>
          ))}
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            className="flex items-center gap-2 p-3 cursor-pointer text-violet-600"
            onClick={() => {
              setOpen(false)
              router.push("/projects?create=true")
            }}
          >
            <div className="h-8 w-8 rounded-full border-2 border-dashed border-violet-300 flex items-center justify-center">
              <Plus className="h-4 w-4" />
            </div>
            <span className="font-medium text-sm">Create New Project</span>
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
