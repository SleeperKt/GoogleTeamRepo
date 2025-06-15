"use client"

import { useState } from "react"
import { Check, ChevronsUpDown, X } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Label } from "@/components/ui/label"
import { TeamMember } from "@/lib/types"

interface AssigneeSelectorProps {
  teamMembers: TeamMember[]
  value: string | null
  onChange: (value: string | null) => void
  label?: string
}

export function AssigneeSelector({ teamMembers, value, onChange, label = "Assignee" }: AssigneeSelectorProps) {
  const [open, setOpen] = useState(false)

  const selectedMember = teamMembers.find((member) => member.id === value)

  return (
    <div className="space-y-2">
      <Label htmlFor="assignee">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              {selectedMember ? (
                <>
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={selectedMember.avatar} alt={selectedMember.name} />
                    <AvatarFallback>{selectedMember.initials}</AvatarFallback>
                  </Avatar>
                  <span>{selectedMember.name}</span>
                </>
              ) : (
                <span className="text-muted-foreground">Unassigned</span>
              )}
            </div>
            <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search team member..." />
            <CommandList>
              <CommandEmpty>No team member found.</CommandEmpty>
              <CommandGroup>
                <CommandItem
                  onSelect={() => {
                    onChange(null)
                    setOpen(false)
                  }}
                  className="flex items-center gap-2"
                >
                  <div className="h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                    <X className="h-3 w-3" />
                  </div>
                  <span>Unassigned</span>
                  {value === null && <Check className="ml-auto h-4 w-4" />}
                </CommandItem>
                {teamMembers.map((member) => (
                  <CommandItem
                    key={member.id}
                    onSelect={() => {
                      onChange(member.id)
                      setOpen(false)
                    }}
                    className="flex items-center gap-2"
                  >
                    <Avatar className="h-6 w-6">
                      <AvatarImage src={member.avatar} alt={member.name} />
                      <AvatarFallback>{member.initials}</AvatarFallback>
                    </Avatar>
                    <span>{member.name}</span>
                    {value === member.id && <Check className="ml-auto h-4 w-4" />}
                  </CommandItem>
                ))}
              </CommandGroup>
            </CommandList>
          </Command>
        </PopoverContent>
      </Popover>
    </div>
  )
} 