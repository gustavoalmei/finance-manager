import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { getRouteApi } from '@tanstack/react-router'
import { Check, Plus, RotateCcw, Settings2 } from 'lucide-react'
import { useAccountSelection } from '#/components/accounts/account-selection-context'
import { Button } from '#/components/ui/button'
import { useMonthStartDay } from '#/hooks/use-month-start-day'
import { Skeleton } from '#/components/ui/skeleton'
import { resolvePeriod, scopeKindOf } from '#/lib/dashboard'
import type { Widget } from '#/lib/dashboard'
import { dashboardSummaryQueryOptions } from '#/lib/dashboard/queries'
import { getErrorMessage } from '#/lib/errors'
import { AddWidgetDialog } from './add-widget-dialog'
import { DashboardPeriodFilter } from './dashboard-period-filter'
import { OnboardingChecklist } from './onboarding-checklist'
import { useDashboardLayout } from './use-dashboard-layout'
import { WidgetGrid, gridClass } from './widget-grid'
import { isWidgetAvailable, scopeNames } from './widgets/catalog'

const routeApi = getRouteApi('/_authenticated/')

export const Home = () => {
  const search = routeApi.useSearch()
  const navigate = routeApi.useNavigate()
  const monthStartDay = useMonthStartDay()
  const period = resolvePeriod(search, monthStartDay)
  const { selectedAccount, selectedCard, isSelectionReady } =
    useAccountSelection()

  // mesmo escopo da tela de transações: cartão do header tem prioridade
  const scope = selectedCard
    ? { cardId: selectedCard.id }
    : selectedAccount
      ? { accountId: selectedAccount.id }
      : {}
  const scopeLabel = selectedCard
    ? `Cartão ${selectedCard.name}`
    : (selectedAccount?.name ?? 'Todas as contas')

  const {
    data: summary,
    isPlaceholderData,
    isError,
    error,
    refetch,
  } = useQuery({
    ...dashboardSummaryQueryOptions(period, scope),
    // espera a seleção do header: buscar antes traria dados de todas as contas
    enabled: isSelectionReady,
  })
  const layout = useDashboardLayout()
  const scopeKind = scopeKindOf(scope)
  const hiddenCount = layout.widgets.filter(
    (widget) => !isWidgetAvailable(widget, scopeKind),
  ).length
  const [editing, setEditing] = useState(false)
  const [addOpen, setAddOpen] = useState(false)

  const addWidget = (widget: Widget) => {
    layout.update([...layout.widgets, widget])
    setAddOpen(false)
  }

  return (
    <div className="flex flex-col gap-6 pb-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex flex-col gap-3">
          <div>
            <h1 className="text-2xl font-semibold">Início</h1>
            <small className="text-muted-foreground">{scopeLabel}</small>
          </div>
          <DashboardPeriodFilter
            search={search}
            period={period}
            onChange={(next) => navigate({ search: next })}
          />
        </div>

        <div className="flex flex-wrap gap-2">
          {editing && (
            <>
              <Button variant="outline" onClick={layout.reset}>
                <RotateCcw /> Restaurar padrão
              </Button>
              <Button variant="outline" onClick={() => setAddOpen(true)}>
                <Plus /> Adicionar card
              </Button>
            </>
          )}
          <Button
            variant={editing ? 'default' : 'outline'}
            disabled={layout.isPending}
            onClick={() => setEditing((current) => !current)}
          >
            {editing ? <Check /> : <Settings2 />}
            {editing ? 'Concluir' : 'Personalizar'}
          </Button>
        </div>
      </div>

      {isError && (
        <div
          role="alert"
          className="flex flex-wrap items-center justify-between gap-2 rounded-xl border border-destructive bg-destructive-soft p-4 text-sm text-destructive-text"
        >
          {getErrorMessage(error)}
          <Button variant="outline" size="sm" onClick={() => refetch()}>
            Tentar novamente
          </Button>
        </div>
      )}

      {summary && !summary.onboarding.hasTransaction && (
        <OnboardingChecklist onboarding={summary.onboarding} />
      )}

      {/* layout ainda não chegou: evita mostrar o padrão e trocar pelo salvo */}
      {layout.isPending ? (
        <div className={gridClass}>
          {Array.from({ length: 4 }, (_, index) => (
            <Skeleton key={index} className="h-32 rounded-xl" />
          ))}
        </div>
      ) : layout.widgets.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-border-strong p-10 text-center">
          <p className="text-sm text-muted-foreground">Nenhum card na tela.</p>
          <Button
            variant="outline"
            onClick={() => {
              setEditing(true)
              setAddOpen(true)
            }}
          >
            <Plus /> Adicionar card
          </Button>
        </div>
      ) : (
        <>
          {/* o layout continua o mesmo: avisa para não parecer que cards sumiram */}
          {!editing && hiddenCount > 0 && (
            <p className="-mb-2 text-xs text-muted-foreground">
              {hiddenCount === 1
                ? '1 card oculto'
                : `${hiddenCount} cards ocultos`}{' '}
              por não se aplicar a {scopeNames[scopeKind]}.
            </p>
          )}
          <WidgetGrid
            widgets={layout.widgets}
            summary={summary}
            isRefreshing={isPlaceholderData}
            editing={editing}
            scope={scopeKind}
            onChange={layout.update}
          />
        </>
      )}

      <AddWidgetDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        widgets={layout.widgets}
        onAdd={addWidget}
      />
    </div>
  )
}
