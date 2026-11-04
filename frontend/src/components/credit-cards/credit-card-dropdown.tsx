import { useState } from 'react'
import { CreditCardIcon } from 'lucide-react'
import { EntityDropdown } from '#/components/shared/entity-dropdown'
import type {
  EntityDropdownLabels,
  EntityOption,
} from '#/components/shared/entity-dropdown'
// import { cardBrandLabels, maskCardNumber } from '#/lib/creditCard'
import type { CreditCard } from '#/lib/creditCard'
import { CreditCardFormDialog } from './credit-card-form-dialog'
import { useAccountCreditCards } from './use-account-credit-cards'
import { formatCurrency } from '#/lib/format'
import { FaCheckCircle } from 'react-icons/fa'
import { useNavigate } from '@tanstack/react-router'

const labels: EntityDropdownLabels = {
  caption: 'Cartão',
  placeholder: 'Selecione um cartão',
  list: 'Cartões da conta',
  amount: 'Limite',
  empty: 'Nenhum cartão encontrado',
  create: 'Criar cartão',
  manage: 'Gerenciar cartões',
}

// ex.: "Mastercard •••• 1234"
const toOption = (card: CreditCard): EntityOption => ({
  id: card.id,
  label: card.name,
  description: card.description,
  amountInCents: card.availableCredit,
  brand: card.brand,
  lastFourDigits: card.lastFourDigits,
})

// UTC: a data vem salva à meia-noite UTC e mudaria de dia no fuso local

const CreditCardItem = ({
  option,
  selected,
}: {
  option: EntityOption
  selected: boolean
}) => (
  <span className="flex w-full min-w-0 gap-2">
    <span className="flex min-w-0 flex-1 flex-col gap-1">
      <span className="flex justify-between gap-2 h-16">
        <div className="flex flex-col h-full justify-between">
          <span className="flex gap-2 truncate text-sm font-bold leading-none">
            {option.label}
            {selected && (
              <FaCheckCircle
                aria-label="Selecionado"
                className="size-3.5 shrink-0"
              />
            )}
          </span>
          <span className="flex justify-between font-bold gap-2">
            •••• {option.lastFourDigits}
          </span>
        </div>
        <div className="flex flex-col  h-full justify-between text-end">
          <span className="shrink-0 font-bold leading-none">
            {option.brand}
          </span>
          <div className="flex flex-col gap-1 text-end  text-xs">
            <span className="shrink-0 text-muted-foreground">Disponível:</span>
            <span className="sensitive shrink-0 font-bold">
              {formatCurrency(option.amountInCents / 100)}
            </span>
          </div>
        </div>
      </span>
    </span>
  </span>
)

type CreditCardDropdownProps = {
  value: CreditCard | null
  onChange: (card: CreditCard) => void
  className?: string
}

export const CreditCardDropdown = ({
  value,
  onChange,
  className,
}: CreditCardDropdownProps) => {
  const { data: items = [] } = useAccountCreditCards()
  labels.amount = `${items.length} cartão${items.length === 1 ? '' : 's'}`
  const navigate = useNavigate()

  const [createOpen, setCreateOpen] = useState(false)

  return (
    <>
      <EntityDropdown
        items={items}
        value={value}
        onChange={onChange}
        toOption={toOption}
        icon={CreditCardIcon}
        labels={labels}
        renderItem={(_card, option, selected) => (
          <CreditCardItem option={option} selected={selected} />
        )}
        className={className}
        fnCreate={() => setCreateOpen(true)}
        fnManage={() => navigate({ to: '/credit-card' })}
      />

      {/* fora do dropdown: o menu é desmontado ao clicar num item */}
      <CreditCardFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setCreateOpen(false)}
      />
    </>
  )
}
