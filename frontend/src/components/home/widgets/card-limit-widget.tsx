import { useState } from 'react'
import { Link } from '@tanstack/react-router'
import { CreditCardVisual } from '#/components/credit-cards/credit-card-visual'
import { Carousel } from '#/components/ui/carousel'
import { Progress } from '#/components/ui/progress'
import type { DashboardSummary, ScopeKind } from '#/lib/dashboard'
import { formatCents, formatDateUTC } from '#/lib/format'
import { WidgetEmpty } from './widget-empty'

type CardSummary = DashboardSummary['invoices'][number]

const percentFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'percent',
  maximumFractionDigits: 0,
})

// Números do cartão escolhido no carrossel (uma linha por cartão, sem somar limites)
const LimitDetails = ({ card }: { card: CardSummary }) => {
  const available = Math.max(card.creditLimit - card.usedCredit, 0)
  const usage =
    card.creditLimit > 0 ? Math.min(card.usedCredit / card.creditLimit, 1) : 0

  return (
    <div className="flex flex-col gap-3" aria-live="polite">
      <div className="flex items-end justify-between gap-2">
        <div>
          <p className="text-xs text-muted-foreground">Disponível</p>
          <p className="sensitive text-2xl font-bold tabular-nums">
            {formatCents(available)}
          </p>
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground">Fatura atual</p>
          <p className="sensitive text-sm font-semibold tabular-nums">
            {formatCents(card.current.amount)}
          </p>
          <p className="text-[11px] text-muted-foreground">
            vence {formatDateUTC(card.current.dueDate).slice(0, 5)}
          </p>
        </div>
      </div>
      <Progress
        value={usage * 100}
        aria-label={`Limite usado do cartão ${card.name}`}
        trackClassName="h-2"
      />
      <p className="flex justify-between text-xs text-muted-foreground">
        <span className="sensitive">
          Usado {formatCents(card.usedCredit)} de{' '}
          {formatCents(card.creditLimit)}
        </span>
        <span className="font-semibold tabular-nums">
          {percentFormatter.format(usage)}
        </span>
      </p>
    </div>
  )
}

export const CardLimitWidget = ({
  summary,
  scope,
}: {
  summary: DashboardSummary
  scope: ScopeKind
}) => {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const cards = summary.invoices
  // trocar o escopo pode reduzir a lista: volta para o primeiro
  const selected = cards.at(selectedIndex) ?? cards.at(0)

  if (!selected) {
    return (
      <WidgetEmpty>
        <span>
          {scope === 'account'
            ? 'Nenhum cartão nesta conta.'
            : 'Nenhum cartão cadastrado.'}{' '}
          <Link to="/credit-card" className="text-foreground underline">
            Cadastrar cartão
          </Link>
        </span>
      </WidgetEmpty>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      {cards.length === 1 ? (
        <CreditCardVisual card={selected} selected className="mx-auto" />
      ) : (
        <Carousel
          label="Cartões de crédito"
          items={cards}
          getKey={(card) => card.cardId}
          slideClassName="basis-auto"
          onSelectedChange={setSelectedIndex}
          renderItem={(card, isSelected) => (
            <CreditCardVisual card={card} selected={isSelected} />
          )}
        />
      )}
      <LimitDetails card={selected} />
    </div>
  )
}
