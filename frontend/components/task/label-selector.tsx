"use client"

import { useState } from "react"
import { Check, Tag } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "@/components/ui/command"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import { TASK_LABELS } from "@/lib/task-constants"

interface LabelSelectorProps {
  value: string[]
  onChange: (value: string[]) => void
  label?: string
}

export function LabelSelector({ value, onChange, label = "Labels" }: LabelSelectorProps) {
  const [open, setOpen] = useState(false)

  const toggleLabel = (labelName: string) => {
    const newValue = value.includes(labelName)
      ? value.filter((l) => l !== labelName)
      : [...value, labelName]
    onChange(newValue)
  }

  return (
    <div className="space-y-2">
      <Label htmlFor="labels">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            role="combobox"
            aria-expanded={open}
            className="w-full justify-between"
          >
            <div className="flex items-center gap-2 truncate">
              {value.length > 0 ? (
                <div className="flex flex-wrap gap-1 max-w-[300px] overflow-hidden">
                  {value.map((labelName) => {
                    const labelData = TASK_LABELS.find((l) => l.name === labelName)
                    return labelData ? (
                      <Badge key={labelData.id} variant="outline" className="px-1 py-0 h-5">
                        {labelData.name}
                      </Badge>
                    ) : null
                  })}
                </div>
              ) : (
                <span className="text-muted-foreground">Select labels</span>
              )}
            </div>
            <Tag className="ml-2 h-4 w-4 shrink-0 opacity-50" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
          <Command>
            <CommandInput placeholder="Search labels..." />
            <CommandList>
              <CommandEmpty>No label found.</CommandEmpty>
              <CommandGroup>
                {TASK_LABELS.map((labelData) => (
                  <CommandItem
                    key={labelData.id}
                    onSelect={() => toggleLabel(labelData.name)}
                    className="flex items-center gap-2"
                  >
                    <div className="h-4 w-4 rounded-full" style={{ backgroundColor: labelData.color }} />
                    <span>{labelData.name}</span>
                    {value.includes(labelData.name) && <Check className="ml-auto h-4 w-4" />}
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