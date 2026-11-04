import type { ComponentType } from 'react'
import {
  AmericanExpressFlatRoundedIcon,
  DinersClubFlatRoundedIcon,
  EloFlatRoundedIcon,
  GenericFlatRoundedIcon,
  HipercardFlatRoundedIcon,
  MastercardFlatRoundedIcon,
  VisaFlatRoundedIcon,
} from 'react-svg-credit-card-payment-icons'
import type { SVGComponentProps } from 'react-svg-credit-card-payment-icons'
import { cardBrandLabels, formatDay } from '#/lib/creditCard'
import type { CardBrand, CreditCard } from '#/lib/creditCard'
import { formatCurrency } from '#/lib/format'
import { cn } from '#/lib/utils'

// import por ícone: só as bandeiras usadas entram no bundle
const brandIcons: Record<CardBrand, ComponentType<SVGComponentProps>> = {
  VISA: VisaFlatRoundedIcon,
  MASTERCARD: MastercardFlatRoundedIcon,
  ELO: EloFlatRoundedIcon,
  AMEX: AmericanExpressFlatRoundedIcon,
  HIPERCARD: HipercardFlatRoundedIcon,
  DINERS: DinersClubFlatRoundedIcon,
  OTHER: GenericFlatRoundedIcon,
}

// UTC: a data vem salva à meia-noite UTC e mudaria de dia no fuso local

type CreditCardVisualProps = {
  card: Pick<
    CreditCard,
    'name' | 'brand' | 'lastFourDigits' | 'creditLimit' | 'dueDay'
  >
  selected?: boolean
  className?: string
}

export const CreditCardVisual = ({
  card,
  selected = false,
  className,
}: CreditCardVisualProps) => {
  const BrandIcon = brandIcons[card.brand]

  return (
    <div
      className={cn(
        // proporção real de cartão (ISO/IEC 7810 ID-1)
        'relative flex aspect-[1.586] w-64 flex-col justify-between overflow-hidden rounded-2xl p-4 text-white select-none sm:w-72',
        // cor sólida + brilho por cima: o cartão é opaco e esconde os que ficam atrás
        'bg-linear-to-tr from-gray-900 to-nav-active to-90% shadow-md transition-shadow',
        selected && 'shadow-xl',
        className,
      )}
    >
      {/* decoração: círculos translúcidos dão profundidade */}
      <span
        aria-hidden="true"
        className="absolute -top-20 -right-20 size-52 rounded-full bg-white/10 z-10"
      />

      <div className="relative flex items-start justify-between gap-2">
        <span className="truncate text-sm font-bold">{card.name}</span>
        <span
          role="img"
          aria-label={cardBrandLabels[card.brand]}
          className="shrink-0"
        >
          <BrandIcon width={40} />
        </span>
      </div>

      <span
        className="relative font-mono text-base tracking-[0.2em]"
        aria-label={
          card.lastFourDigits
            ? `Final ${card.lastFourDigits}`
            : 'Número não informado'
        }
      >
        •••• {card.lastFourDigits ?? '----'}
      </span>

      <div className="relative flex items-end justify-between text-xs">
        <span className="flex flex-col">
          <span className="text-white/70">Limite</span>
          <span className="sensitive text-sm font-semibold">
            {formatCurrency(card.creditLimit / 100)}
          </span>
        </span>
        <span className="text-white/70">
          Vencimento dia {formatDay(card.dueDay)}
        </span>
      </div>
    </div>
  )
}
