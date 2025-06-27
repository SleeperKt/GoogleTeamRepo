"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/contexts/auth-context"
import { useProject } from "@/contexts/project-context"
import { invitationApi } from "@/lib/api"
import { ProjectInvitation, InvitationStatus, ParticipantRole } from "@/lib/types"
import { 
  Mail, 
  Clock, 
  CheckCircle, 
  XCircle, 
  Send, 
  Users, 
  Calendar,
  AlertCircle,
  Loader2,
  ArrowLeft,
  MoreHorizontal
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { Separator } from "@/components/ui/separator"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { toast } from "@/hooks/use-toast"
import Link from "next/link"

// Helper functions
const getStatusBadge = (status: InvitationStatus) => {
  switch (status) {
    case InvitationStatus.Pending:
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case InvitationStatus.Accepted:
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle className="w-3 h-3 mr-1" />Accepted</Badge>
    case InvitationStatus.Declined:
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle className="w-3 h-3 mr-1" />Declined</Badge>
    case InvitationStatus.Cancelled:
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200"><XCircle className="w-3 h-3 mr-1" />Cancelled</Badge>
  }
}

const getRoleBadge = (role: ParticipantRole) => {
  switch (role) {
    case ParticipantRole.Owner:
      return <Badge variant="default" className="bg-violet-100 text-violet-800">Owner</Badge>
    case ParticipantRole.Admin:
      return <Badge variant="secondary">Admin</Badge>
    case ParticipantRole.Viewer:
      return <Badge variant="outline" className="bg-gray-50">Viewer</Badge>
  }
}

interface InvitationCardProps {
  invitation: ProjectInvitation
  type: "received" | "sent"
  onAction: (id: number, action: "accept" | "decline" | "cancel") => void
  isLoading: boolean
}

function InvitationCard({ invitation, type, onAction, isLoading }: InvitationCardProps) {
  const isReceived = type === "received"
  const isPending = invitation.status === InvitationStatus.Pending
  
  return (
    <Card className="hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-lg">{invitation.projectName}</CardTitle>
            <CardDescription className="mt-1">
              {invitation.projectDescription || "No description provided"}
            </CardDescription>
          </div>
          <div className="flex items-center gap-2 ml-4">
            {getStatusBadge(invitation.status)}
            {getRoleBadge(invitation.role)}
          </div>
        </div>
      </CardHeader>
      
      <CardContent className="pt-0">
        <div className="space-y-3">
          {/* Invitation details */}
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <Avatar className="h-6 w-6">
                <AvatarFallback className="text-xs">
                  {isReceived ? invitation.inviterName[0]?.toUpperCase() : invitation.inviteeName[0]?.toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <span>
                {isReceived 
                  ? `Invited by ${invitation.inviterName}` 
                  : `Invited ${invitation.inviteeName}`
                }
              </span>
            </div>
            <div className="flex items-center gap-1">
              <Calendar className="w-4 h-4" />
              <span>{new Date(invitation.createdAt).toLocaleDateString()}</span>
            </div>
          </div>

          {/* Message */}
          {invitation.message && (
            <div className="p-3 bg-gray-50 rounded-md">
              <p className="text-sm">{invitation.message}</p>
            </div>
          )}

          {/* Response date */}
          {invitation.respondedAt && (
            <div className="text-xs text-muted-foreground">
              Responded on {new Date(invitation.respondedAt).toLocaleDateString()}
            </div>
          )}

          {/* Actions */}
          <div className="flex items-center justify-between pt-2">
            <Link href={`/projects/${invitation.projectPublicId}`}>
              <Button variant="outline" size="sm">
                View Project
              </Button>
            </Link>
            
            {isPending && (
              <div className="flex items-center gap-2">
                {isReceived ? (
                  <>
                    <Button 
                      size="sm" 
                      variant="outline"
                      onClick={() => onAction(invitation.id, "decline")}
                      disabled={isLoading}
                    >
                      Decline
                    </Button>
                    <Button 
                      size="sm"
                      onClick={() => onAction(invitation.id, "accept")}
                      disabled={isLoading}
                      className="bg-green-600 hover:bg-green-700"
                    >
                      {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Accept"}
                    </Button>
                  </>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" size="sm" disabled={isLoading}>
                        <MoreHorizontal className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem 
                        onClick={() => onAction(invitation.id, "cancel")}
                        className="text-red-600"
                      >
                        Cancel Invitation
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export default function InvitationsPage() {
  const { token } = useAuth()
  const { refreshProjects } = useProject()
  const [receivedInvitations, setReceivedInvitations] = useState<ProjectInvitation[]>([])
  const [sentInvitations, setSentInvitations] = useState<ProjectInvitation[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("received")

  // Fetch invitations
  const fetchInvitations = async () => {
    if (!token) return

    try {
      setLoading(true)
      const [received, sent] = await Promise.all([
        invitationApi.getReceivedInvitations(),
        invitationApi.getSentInvitations()
      ])
      
      setReceivedInvitations(received || [])
      setSentInvitations(sent || [])
    } catch (error) {
      console.error("Error fetching invitations:", error)
      toast({
        title: "Error",
        description: "Failed to load invitations. Please try again.",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [token])

  // Handle invitation actions
  const handleInvitationAction = async (id: number, action: "accept" | "decline" | "cancel") => {
    try {
      setActionLoading(true)
      
      if (action === "cancel") {
        await invitationApi.cancelInvitation(id)
        toast({
          title: "Success",
          description: "Invitation cancelled successfully"
        })
      } else {
        const status = action === "accept" ? InvitationStatus.Accepted : InvitationStatus.Declined
        await invitationApi.respondToInvitation(id, status)
        toast({
          title: "Success", 
          description: `Invitation ${action}ed successfully`
        })
        
        // If invitation was accepted, refresh projects to show the new project
        if (action === "accept") {
          // Small delay to ensure backend has processed the invitation
          setTimeout(() => {
            refreshProjects()
          }, 500)
        }
      }
      
      // Refresh invitations
      await fetchInvitations()
    } catch (error) {
      console.error(`Error ${action}ing invitation:`, error)
      toast({
        title: "Error",
        description: `Failed to ${action} invitation. Please try again.`,
        variant: "destructive"
      })
    } finally {
      setActionLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      </div>
    )
  }

  const pendingReceived = receivedInvitations.filter(inv => inv.status === InvitationStatus.Pending)
  const pendingSent = sentInvitations.filter(inv => inv.status === InvitationStatus.Pending)

  return (
    <div className="p-6 max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-6">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Invitations</h1>
          <p className="text-muted-foreground">Manage your project invitations</p>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-full">
                  <Mail className="h-4 w-4 text-blue-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Received</p>
                  <p className="text-xl font-semibold">{receivedInvitations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-green-100 rounded-full">
                  <Send className="h-4 w-4 text-green-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Sent</p>
                  <p className="text-xl font-semibold">{sentInvitations.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-yellow-100 rounded-full">
                  <Clock className="h-4 w-4 text-yellow-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Received</p>
                  <p className="text-xl font-semibold">{pendingReceived.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-violet-100 rounded-full">
                  <Users className="h-4 w-4 text-violet-600" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Pending Sent</p>
                  <p className="text-xl font-semibold">{pendingSent.length}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received" className="flex items-center gap-2">
            <Mail className="w-4 h-4" />
            Received ({receivedInvitations.length})
          </TabsTrigger>
          <TabsTrigger value="sent" className="flex items-center gap-2">
            <Send className="w-4 h-4" />
            Sent ({sentInvitations.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          {receivedInvitations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Mail className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No invitations received</h3>
                <p className="text-muted-foreground">You don't have any project invitations yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {receivedInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  type="received"
                  onAction={handleInvitationAction}
                  isLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          {sentInvitations.length === 0 ? (
            <Card>
              <CardContent className="p-8 text-center">
                <Send className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium mb-2">No invitations sent</h3>
                <p className="text-muted-foreground">You haven't sent any project invitations yet.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-4">
              {sentInvitations.map((invitation) => (
                <InvitationCard
                  key={invitation.id}
                  invitation={invitation}
                  type="sent"
                  onAction={handleInvitationAction}
                  isLoading={actionLoading}
                />
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
    </div>
  )
} 