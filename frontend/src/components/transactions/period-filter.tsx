import { useState } from 'react'
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react'
import { Button } from '#/components/ui/button'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { cycleContaining, monthCycle } from '#/lib/transactions'
import type { Period } from '#/lib/transactions'
import { cn } from '#/lib/utils'

// "out", "nov"... na ordem dos meses
const monthNames = Array.from({ length: 12 }, (_, month) =>
  new Date(2000, month, 1)
    .toLocaleString('pt-BR', { month: 'short' })
    .replace('.', ''),
)

// "outubro de 2026"
const triggerFormatter = new Intl.DateTimeFormat('pt-BR', {
  month: 'long',
  year: 'numeric',
})

// "05/10 – 04/11": só aparece quando o mês financeiro não começa no dia 1
const rangeFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
})

type PeriodFilterProps = {
  value: Period
  onChange: (value: Period) => void
  // dia de início do mês financeiro: "outubro" vai do dia X até a véspera em novembro
  monthStartDay: number
}

export const PeriodFilter = ({
  value,
  onChange,
  monthStartDay,
}: PeriodFilterProps) => {
  const [open, setOpen] = useState(false)
  // ano exibido no popover: navegar não muda o filtro até escolher um mês
  const [year, setYear] = useState(value.from.getFullYear())
  // ciclo de hoje: com início no dia 5, o dia 3 ainda pertence ao mês anterior
  const now = cycleContaining(new Date(), monthStartDay).from

  const handleOpenChange = (next: boolean) => {
    if (next) setYear(value.from.getFullYear())
    setOpen(next)
  }

  const selectMonth = (month: number) => {
    onChange(monthCycle(year, month, monthStartDay))
    setOpen(false)
  }

  return (
    <Popover open={open} onOpenChange={handleOpenChange}>
      <PopoverTrigger
        render={
          <Button
            variant="outline"
            aria-label={`Período: ${triggerFormatter.format(value.from)}`}
            // mesmo visual dos selects ao lado
            className="justify-start rounded-2xl border-input bg-item px-3 font-normal"
          />
        }
      >
        <CalendarIcon className="text-muted-foreground" />
        <span className="first-letter:uppercase">
          {triggerFormatter.format(value.from)}
        </span>
        {monthStartDay !== 1 && (
          <span className="text-xs text-muted-foreground">
            {rangeFormatter.format(value.from)} –{' '}
            {rangeFormatter.format(value.to)}
          </span>
        )}
      </PopoverTrigger>

      <PopoverContent className="flex w-64 flex-col gap-3 p-3">
        <div className="flex items-center justify-between">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Ano anterior"
            onClick={() => setYear((current) => current - 1)}
          >
            <ChevronLeft />
          </Button>
          <span
            className="text-sm font-semibold tabular-nums"
            aria-live="polite"
          >
            {year}
          </span>
          <Button
            variant="ghost"
            size="icon"
            aria-label="Próximo ano"
            onClick={() => setYear((current) => current + 1)}
          >
            <ChevronRight />
          </Button>
        </div>

        <div className="grid grid-cols-3 gap-1">
          {monthNames.map((name, month) => {
            const isSelected =
              value.from.getFullYear() === year &&
              value.from.getMonth() === month
            const isCurrent =
              now.getFullYear() === year && now.getMonth() === month

            return (
              <Button
                key={name}
                variant="ghost"
                aria-pressed={isSelected}
                aria-label={triggerFormatter.format(new Date(year, month, 1))}
                onClick={() => selectMonth(month)}
                className={cn(
                  'h-9 font-normal capitalize',
                  isCurrent && !isSelected && 'bg-muted',
                  isSelected &&
                    'bg-nav-active text-nav-active-foreground hover:bg-nav-active',
                )}
              >
                {name}
              </Button>
            )
          })}
        </div>
      </PopoverContent>
    </Popover>
  )
}
