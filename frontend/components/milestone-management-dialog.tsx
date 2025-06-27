"use client"

import { useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

interface Milestone {
  id: number | string
  title: string
  date: string
  status: string
  description?: string
  linkedTasks?: number[]
}

interface MilestoneManagementDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  milestone?: Milestone | null
  onSave: (milestone: Omit<Milestone, 'id'>) => void
}

export function MilestoneManagementDialog({ 
  open, 
  onOpenChange, 
  milestone, 
  onSave 
}: MilestoneManagementDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setIsSubmitting(true)
    
    const formData = new FormData(e.currentTarget)
    const milestoneData = {
      title: formData.get('title') as string,
      date: formData.get('date') as string,
      description: formData.get('description') as string,
      status: formData.get('status') as string,
      linkedTasks: milestone?.linkedTasks || []
    }
    
    try {
      await onSave(milestoneData)
      onOpenChange(false)
    } catch (error) {
      console.error('Error saving milestone:', error)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            {milestone ? 'Edit Milestone' : 'Create New Milestone'}
          </DialogTitle>
          <DialogDescription>
            {milestone ? 'Update milestone details below.' : 'Add a new milestone to track important project markers.'}
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="title" className="text-right">
                Title
              </Label>
              <Input
                id="title"
                name="title"
                defaultValue={milestone?.title || ''}
                placeholder="Milestone title"
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="date" className="text-right">
                Date
              </Label>
              <Input
                id="date"
                name="date"
                type="date"
                defaultValue={milestone?.date ? new Date(milestone.date).toISOString().split('T')[0] : ''}
                className="col-span-3"
                required
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="status" className="text-right">
                Status
              </Label>
              <Select name="status" defaultValue={milestone?.status || 'upcoming'}>
                <SelectTrigger className="col-span-3">
                  <SelectValue placeholder="Select status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="upcoming">Upcoming</SelectItem>
                  <SelectItem value="in-progress">In Progress</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="description" className="text-right">
                Description
              </Label>
              <Textarea
                id="description"
                name="description"
                defaultValue={milestone?.description || ''}
                placeholder="Optional description"
                className="col-span-3"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Saving...' : milestone ? 'Update' : 'Create'} Milestone
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 