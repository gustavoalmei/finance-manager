import { useState } from 'react'
import type { DateRange } from 'react-day-picker'
import { ptBR } from 'react-day-picker/locale'
import { CalendarIcon } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Calendar } from '#/components/ui/calendar'
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '#/components/ui/popover'
import { formatDay, periodPresetLabels } from '#/lib/dashboard'
import type { DashboardSearch, PeriodPreset } from '#/lib/dashboard'
import type { Period } from '#/lib/transactions'
import { cn } from '#/lib/utils'

const dateFormatter = new Intl.DateTimeFormat('pt-BR')

const presets = (Object.keys(periodPresetLabels) as Array<PeriodPreset>).filter(
  (preset) => preset !== 'custom',
)

const chipClass = (selected: boolean) =>
  cn(
    'h-8 rounded-full px-3 font-normal',
    selected &&
      'bg-nav-active text-nav-active-foreground hover:bg-nav-active hover:text-nav-active-foreground',
  )

type DashboardPeriodFilterProps = {
  search: DashboardSearch
  // período já resolvido (datas do preset ou do personalizado)
  period: Period
  onChange: (search: DashboardSearch) => void
}

export const DashboardPeriodFilter = ({
  search,
  period,
  onChange,
}: DashboardPeriodFilterProps) => {
  const active = search.period ?? 'month'
  const [open, setOpen] = useState(false)
  // seleção em andamento no calendário: só vira filtro ao aplicar
  const [range, setRange] = useState<DateRange | undefined>()

  const handleOpenChange = (next: boolean) => {
    if (next) setRange({ from: period.from, to: period.to })
    setOpen(next)
  }

  const applyRange = () => {
    if (!range?.from || !range.to) return
    onChange({
      period: 'custom',
      from: formatDay(range.from),
      to: formatDay(range.to),
    })
    setOpen(false)
  }

  return (
    <div className="flex flex-col gap-2">
      <div
        role="group"
        aria-label="Período"
        // celular: chips rolam na horizontal em vez de quebrar a linha
        className="-mx-1 flex gap-2 overflow-x-auto px-1 pb-1 flex-wrap"
      >
        {presets.map((preset) => (
          <Button
            key={preset}
            variant="outline"
            aria-pressed={active === preset}
            onClick={() =>
              onChange(preset === 'month' ? {} : { period: preset })
            }
            className={chipClass(active === preset)}
          >
            {periodPresetLabels[preset]}
          </Button>
        ))}

        <Popover open={open} onOpenChange={handleOpenChange}>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                aria-pressed={active === 'custom'}
                className={chipClass(active === 'custom')}
              />
            }
          >
            <CalendarIcon />
            {periodPresetLabels.custom}
          </PopoverTrigger>
          <PopoverContent
            align="start"
            className="flex w-auto flex-col gap-3 p-3"
          >
            <Calendar
              mode="range"
              locale={ptBR}
              defaultMonth={range?.from ?? period.from}
              selected={range}
              onSelect={setRange}
            />
            <div className="flex items-center justify-between gap-2">
              <span className="text-xs text-muted-foreground">
                {range?.from && range.to
                  ? `${dateFormatter.format(range.from)} – ${dateFormatter.format(range.to)}`
                  : 'Escolha o início e o fim'}
              </span>
              <Button
                size="sm"
                disabled={!range?.from || !range.to}
                onClick={applyRange}
              >
                Aplicar
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      </div>

      <p className="text-xs text-muted-foreground">
        {dateFormatter.format(period.from)} – {dateFormatter.format(period.to)}
      </p>
    </div>
  )
}
