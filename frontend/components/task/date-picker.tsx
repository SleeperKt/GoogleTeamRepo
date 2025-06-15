"use client"

import { useState } from "react"
import { format } from "date-fns"
import { CalendarIcon } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover"
import { Label } from "@/components/ui/label"

interface DatePickerProps {
  value?: Date
  onChange: (date: Date | undefined) => void
  label?: string
  placeholder?: string
}

export function DatePicker({ value, onChange, label = "Date", placeholder = "Pick a date" }: DatePickerProps) {
  const [open, setOpen] = useState(false)

  return (
    <div className="space-y-2">
      <Label htmlFor="date">{label}</Label>
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button variant="outline" className="w-full justify-start text-left font-normal" id="date">
            <CalendarIcon className="mr-2 h-4 w-4" />
            {value ? format(value, "PPP") : <span className="text-muted-foreground">{placeholder}</span>}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0" align="start">
          <Calendar
            mode="single"
            selected={value}
            onSelect={(date) => {
              onChange(date)
              setOpen(false)
            }}
            initialFocus
          />
        </PopoverContent>
      </Popover>
    </div>
  )
} 