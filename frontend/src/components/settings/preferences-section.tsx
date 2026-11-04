import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useHideValues } from '#/components/hide-values-provider'
import { useTheme } from '#/components/theme-provider'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '#/components/ui/select'
import { Switch } from '#/components/ui/switch'
import type { SessionUser } from '#/lib/auth'
import { userQueryOptions } from '#/lib/auth/queries'
import { settings } from '#/lib/settings'
import { toaster } from '#/lib/toaster'
import { monthCycle } from '#/lib/transactions'
import { SettingsSection } from './settings-section'

const themeLabels = {
  light: 'Claro',
  dark: 'Escuro',
  system: 'Igual ao sistema',
} as const

type Theme = keyof typeof themeLabels

// até 28: todo mês tem esse dia
const dayItems = Object.fromEntries(
  Array.from({ length: 28 }, (_, index) => [
    String(index + 1),
    index === 0 ? 'Dia 1 (mês do calendário)' : `Dia ${index + 1}`,
  ]),
)

const dayMonthFormatter = new Intl.DateTimeFormat('pt-BR', {
  day: '2-digit',
  month: '2-digit',
})
const monthNameFormatter = new Intl.DateTimeFormat('pt-BR', { month: 'long' })

// "o mês de outubro vai de 05/10 a 04/11"
const cycleExample = (startDay: number) => {
  const now = new Date()
  const { from, to } = monthCycle(now.getFullYear(), now.getMonth(), startDay)
  return `Ex.: ${monthNameFormatter.format(from)} vai de ${dayMonthFormatter.format(from)} a ${dayMonthFormatter.format(to)}.`
}

// Linha de preferência com controle à direita (rótulo + explicação à esquerda)
const PreferenceRow = ({
  id,
  label,
  description,
  children,
}: {
  id: string
  label: string
  description: string
  children: React.ReactNode
}) => (
  <div className="flex flex-wrap items-center justify-between gap-3">
    <div className="flex min-w-0 flex-1 flex-col gap-0.5">
      <label htmlFor={id} className="text-sm font-medium">
        {label}
      </label>
      <small className="text-xs text-muted-foreground">{description}</small>
    </div>
    {children}
  </div>
)

export const PreferencesSection = ({ user }: { user: SessionUser }) => {
  const queryClient = useQueryClient()
  const { theme, setTheme } = useTheme()
  const { hidden, setHidden } = useHideValues()

  const startDayMutation = useMutation({
    mutationFn: (monthStartDay: number) =>
      settings.updatePreferences({ monthStartDay }),
    onSuccess: (updated) => {
      queryClient.setQueryData(userQueryOptions().queryKey, updated)
      // os períodos do dashboard mudam com o dia de início
      queryClient.invalidateQueries({ queryKey: ['dashboard'] })
      toaster.success('Início do mês atualizado!')
    },
    onError: (error) => toaster.error(error),
  })

  return (
    <SettingsSection
      id="preferences"
      title="Preferências"
      description="Aparência e como o app organiza seus períodos."
    >
      <PreferenceRow
        id="theme"
        label="Tema"
        description="Vale só para este dispositivo."
      >
        <Select
          items={themeLabels}
          value={theme}
          onValueChange={(value) => value && setTheme(value)}
        >
          <SelectTrigger id="theme" className="w-48">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(themeLabels) as Array<Theme>).map((option) => (
              <SelectItem key={option} value={option}>
                {themeLabels[option]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </PreferenceRow>

      <PreferenceRow
        id="hide-values"
        label="Ocultar valores"
        description="Borra os valores em dinheiro neste dispositivo. Também pelo ícone de olho no topo."
      >
        <Switch id="hide-values" checked={hidden} onCheckedChange={setHidden} />
      </PreferenceRow>

      <PreferenceRow
        id="month-start-day"
        label="Início do mês financeiro"
        description={`Para quem recebe fora do dia 1: os filtros de mês passam a ir de um pagamento ao outro. ${cycleExample(user.monthStartDay)}`}
      >
        <div className="w-48">
          <Select
            items={dayItems}
            value={String(user.monthStartDay)}
            disabled={startDayMutation.isPending}
            onValueChange={(value) =>
              value && startDayMutation.mutate(Number(value))
            }
          >
            <SelectTrigger id="month-start-day">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(dayItems).map(([value, label]) => (
                <SelectItem key={value} value={value}>
                  {label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </PreferenceRow>
    </SettingsSection>
  )
}
