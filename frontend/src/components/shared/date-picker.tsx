import { useState } from 'react'
import { CalendarIcon } from 'lucide-react'
import { ptBR } from 'react-day-picker/locale'
import { Button } from '#/components/ui/button'
import { Calendar } from '#/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { cn } from '#/lib/utils'

const dateFormatter = new Intl.DateTimeFormat('pt-BR')

type DatePickerProps = {
  id?: string
  value: Date
  onChange: (value: Date) => void
  className?: string
}

// Campo com o visual dos inputs que abre o Calendar num popover
export const DatePicker = ({
  id,
  value,
  onChange,
  className,
}: DatePickerProps) => {
  const [open, setOpen] = useState(false)

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        render={
          <Button
            id={id}
            variant="outline"
            className={cn(
              'w-full justify-between border-input bg-item px-3 font-normal',
              className,
            )}
          />
        }
      >
        {dateFormatter.format(value)}
        <CalendarIcon className="text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent align="end">
        <Calendar
          mode="single"
          locale={ptBR}
          required
          defaultMonth={value}
          selected={value}
          onSelect={(day) => {
            onChange(day)
            setOpen(false)
          }}
        />
      </PopoverContent>
    </Popover>
  )
}
