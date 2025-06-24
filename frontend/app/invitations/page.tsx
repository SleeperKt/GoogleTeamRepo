"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Check, X, Clock, Calendar, User, Mail } from "lucide-react"
import { invitationApi } from "@/lib/api"
import { ProjectInvitation, InvitationStatus, ParticipantRole } from "@/lib/types"
import { toast } from "@/hooks/use-toast"

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

const getStatusBadge = (status: InvitationStatus) => {
  switch (status) {
    case InvitationStatus.Pending:
      return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><Clock className="w-3 h-3 mr-1" />Pending</Badge>
    case InvitationStatus.Accepted:
      return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><Check className="w-3 h-3 mr-1" />Accepted</Badge>
    case InvitationStatus.Declined:
      return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><X className="w-3 h-3 mr-1" />Declined</Badge>
    case InvitationStatus.Cancelled:
      return <Badge variant="outline" className="bg-gray-50 text-gray-700 border-gray-200">Cancelled</Badge>
    default:
      return <Badge variant="outline">Unknown</Badge>
  }
}

export default function InvitationsPage() {
  const [receivedInvitations, setReceivedInvitations] = useState<ProjectInvitation[]>([])
  const [sentInvitations, setSentInvitations] = useState<ProjectInvitation[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [processingInvites, setProcessingInvites] = useState<Set<number>>(new Set())

  const fetchInvitations = async () => {
    try {
      setIsLoading(true)
      const [received, sent] = await Promise.all([
        invitationApi.getReceivedInvitations(),
        invitationApi.getSentInvitations()
      ])
      
      // Ensure we always have arrays
      setReceivedInvitations(Array.isArray(received) ? received : [])
      setSentInvitations(Array.isArray(sent) ? sent : [])
    } catch (error) {
      console.error("Failed to fetch invitations:", error)
      
      // Reset to empty arrays on error
      setReceivedInvitations([])
      setSentInvitations([])
      
      toast({
        title: "Error",
        description: "Failed to load invitations",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRespondToInvitation = async (invitationId: number, status: InvitationStatus) => {
    try {
      setProcessingInvites(prev => new Set(prev).add(invitationId))
      await invitationApi.respondToInvitation(invitationId, status)
      
      const statusText = status === InvitationStatus.Accepted ? "accepted" : "declined"
      toast({
        title: "Success",
        description: `Invitation ${statusText} successfully`,
      })
      
      // Refresh invitations
      await fetchInvitations()
    } catch (error) {
      console.error("Failed to respond to invitation:", error)
      toast({
        title: "Error",
        description: "Failed to respond to invitation",
        variant: "destructive",
      })
    } finally {
      setProcessingInvites(prev => {
        const next = new Set(prev)
        next.delete(invitationId)
        return next
      })
    }
  }

  const handleCancelInvitation = async (invitationId: number) => {
    try {
      setProcessingInvites(prev => new Set(prev).add(invitationId))
      await invitationApi.cancelInvitation(invitationId)
      
      toast({
        title: "Success",
        description: "Invitation cancelled successfully",
      })
      
      // Refresh invitations
      await fetchInvitations()
    } catch (error) {
      console.error("Failed to cancel invitation:", error)
      toast({
        title: "Error",
        description: "Failed to cancel invitation",
        variant: "destructive",
      })
    } finally {
      setProcessingInvites(prev => {
        const next = new Set(prev)
        next.delete(invitationId)
        return next
      })
    }
  }

  useEffect(() => {
    fetchInvitations()
  }, [])

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  if (isLoading) {
    return (
      <div className="container mx-auto py-10">
        <div className="text-center">Loading invitations...</div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-10 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Invitations</h1>
        <p className="text-muted-foreground">Manage your project invitations</p>
      </div>

      <Tabs defaultValue="received" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="received">
            Received ({Array.isArray(receivedInvitations) ? receivedInvitations.filter(inv => inv.status === InvitationStatus.Pending).length : 0})
          </TabsTrigger>
          <TabsTrigger value="sent">
            Sent ({Array.isArray(sentInvitations) ? sentInvitations.filter(inv => inv.status === InvitationStatus.Pending).length : 0})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="received" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Received Invitations</CardTitle>
              <CardDescription>
                Project invitations you've received from other users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!Array.isArray(receivedInvitations) || receivedInvitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invitations received yet
                </div>
              ) : (
                <div className="space-y-4">
                  {receivedInvitations.map((invitation) => (
                    <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{invitation.projectName}</h3>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invitation.projectDescription}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>From: {invitation.inviterName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{invitation.inviterEmail}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(invitation.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Role:</span>
                            <Badge variant="secondary">{getRoleLabel(invitation.role)}</Badge>
                          </div>
                          {invitation.message && (
                            <div className="text-sm bg-muted p-3 rounded">
                              <strong>Message:</strong> {invitation.message}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {invitation.status === InvitationStatus.Pending && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            onClick={() => handleRespondToInvitation(invitation.id, InvitationStatus.Accepted)}
                            disabled={processingInvites.has(invitation.id)}
                          >
                            <Check className="w-4 h-4 mr-1" />
                            Accept
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleRespondToInvitation(invitation.id, InvitationStatus.Declined)}
                            disabled={processingInvites.has(invitation.id)}
                          >
                            <X className="w-4 h-4 mr-1" />
                            Decline
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sent" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Sent Invitations</CardTitle>
              <CardDescription>
                Project invitations you've sent to other users
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!Array.isArray(sentInvitations) || sentInvitations.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No invitations sent yet
                </div>
              ) : (
                <div className="space-y-4">
                  {sentInvitations.map((invitation) => (
                    <div key={invitation.id} className="border rounded-lg p-4 space-y-3">
                      <div className="flex items-start justify-between">
                        <div className="space-y-2">
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold">{invitation.projectName}</h3>
                            {getStatusBadge(invitation.status)}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {invitation.projectDescription}
                          </p>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <div className="flex items-center gap-1">
                              <User className="w-4 h-4" />
                              <span>To: {invitation.inviteeName}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Mail className="w-4 h-4" />
                              <span>{invitation.inviteeEmail}</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              <span>{formatDate(invitation.createdAt)}</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">Role:</span>
                            <Badge variant="secondary">{getRoleLabel(invitation.role)}</Badge>
                          </div>
                          {invitation.message && (
                            <div className="text-sm bg-muted p-3 rounded">
                              <strong>Message:</strong> {invitation.message}
                            </div>
                          )}
                          {invitation.respondedAt && (
                            <div className="text-sm text-muted-foreground">
                              Responded: {formatDate(invitation.respondedAt)}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {invitation.status === InvitationStatus.Pending && (
                        <div className="flex gap-2">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleCancelInvitation(invitation.id)}
                            disabled={processingInvites.has(invitation.id)}
                          >
                            Cancel Invitation
                          </Button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
} 