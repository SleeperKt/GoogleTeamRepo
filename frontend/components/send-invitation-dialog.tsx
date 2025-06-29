"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { UserPlus } from "lucide-react"
import { invitationApi } from "@/lib/api"
import { ParticipantRole, CreateInvitationRequest } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

interface SendInvitationDialogProps {
  projectId: number
  trigger?: React.ReactNode
  onInvitationSent?: () => void
}

const getRoleLabel = (role: ParticipantRole): string => {
  switch (role) {
    case ParticipantRole.Owner:
      return "Owner"
    case ParticipantRole.Admin:
      return "Admin"
    case ParticipantRole.Editor:
      return "Editor"
    case ParticipantRole.Viewer:
      return "Viewer"
    default:
      return "Unknown"
  }
}

export function SendInvitationDialog({ 
  projectId, 
  trigger, 
  onInvitationSent 
}: SendInvitationDialogProps) {
  const [open, setOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [formData, setFormData] = useState<CreateInvitationRequest>({
    inviteeEmail: "",
    role: ParticipantRole.Viewer,
    message: ""
  })

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!formData.inviteeEmail.trim()) {
      toast({
        title: "Error",
        description: "Please enter an email address",
        variant: "destructive",
      })
      return
    }

    // Basic email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(formData.inviteeEmail)) {
      toast({
        title: "Error",
        description: "Please enter a valid email address",
        variant: "destructive",
      })
      return
    }

    try {
      setIsLoading(true)
      await invitationApi.createProjectInvitation(projectId, formData)
      
      toast({
        title: "Success",
        description: "Invitation sent successfully",
      })
      
      // Reset form
      setFormData({
        inviteeEmail: "",
        role: ParticipantRole.Viewer,
        message: ""
      })
      
      setOpen(false)
      onInvitationSent?.()
    } catch (error) {
      console.error("Failed to send invitation:", error)
      
      let errorMessage = "Failed to send invitation"
      if (error instanceof Error) {
        if (error.message.includes("User with email") && error.message.includes("not found")) {
          errorMessage = "User with this email address is not registered in the system. Please ask them to create an account first."
        } else if (error.message.includes("Only project owners and admins")) {
          errorMessage = "You don't have permission to send invitations. Only project owners and admins can invite new members."
        } else if (error.message.includes("already a participant")) {
          errorMessage = "This user is already a member of the project."
        } else if (error.message.includes("already has a pending invitation")) {
          errorMessage = "This user already has a pending invitation for this project."
        } else {
          errorMessage = error.message
        }
      }
      
      toast({
        title: "Error",
        description: errorMessage,
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({ ...prev, inviteeEmail: e.target.value }))
  }

  const handleRoleChange = (value: string) => {
    setFormData(prev => ({ ...prev, role: parseInt(value) as ParticipantRole }))
  }

  const handleMessageChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setFormData(prev => ({ ...prev, message: e.target.value }))
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button size="sm">
            <UserPlus className="h-4 w-4 mr-2" />
            Invite Member
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Invite Team Member</DialogTitle>
          <DialogDescription>
            Send an invitation to add a new member to this project.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email">Email Address</Label>
            <Input
              id="email"
              type="email"
              placeholder="colleague@example.com"
              value={formData.inviteeEmail}
              onChange={handleEmailChange}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="role">Role</Label>
            <Select value={formData.role.toString()} onValueChange={handleRoleChange}>
              <SelectTrigger>
                <SelectValue placeholder="Select a role" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ParticipantRole.Editor.toString()}>
                  {getRoleLabel(ParticipantRole.Editor)} - Can manage tasks
                </SelectItem>
                <SelectItem value={ParticipantRole.Viewer.toString()}>
                  {getRoleLabel(ParticipantRole.Viewer)} - Can view project
                </SelectItem>
                <SelectItem value={ParticipantRole.Admin.toString()}>
                  {getRoleLabel(ParticipantRole.Admin)} - Can manage project and members
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="message">Message (Optional)</Label>
            <Textarea
              id="message"
              placeholder="Add a personal message to the invitation..."
              value={formData.message}
              onChange={handleMessageChange}
              className="min-h-[80px]"
            />
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Sending..." : "Send Invitation"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 