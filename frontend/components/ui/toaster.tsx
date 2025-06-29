"use client"

import { useToast } from "@/hooks/use-toast"
import {
  Toast,
  ToastClose,
  ToastDescription,
  ToastProvider,
  ToastTitle,
  ToastViewport,
} from "@/components/ui/toast"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { cn } from "@/lib/utils"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, ...props }) {
        // Determine icon based on toast variant (default = success, destructive = error/warning)
        const variant = (props as any).variant
        const Icon = variant === "destructive" ? AlertTriangle : CheckCircle

        return (
          <Toast key={id} {...props}>
            <div className="flex items-start gap-3">
              {/* Status icon */}
              <Icon
                className={cn(
                  "h-5 w-5 shrink-0",
                  variant === "destructive" ? "text-red-500" : "text-green-500"
                )}
              />

              <div className="grid gap-1">
                {title && <ToastTitle>{title}</ToastTitle>}
                {description && (
                  <ToastDescription>{description}</ToastDescription>
                )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
