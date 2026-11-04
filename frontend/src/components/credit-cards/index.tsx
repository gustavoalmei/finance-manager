import { useState } from 'react'
import type { ReactNode } from 'react'
import { Plus } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Card, CardContent } from '#/components/ui/card'
import { Carousel } from '#/components/ui/carousel'
import { Skeleton } from '#/components/ui/skeleton'
import { useAccountSelection } from '#/components/accounts/account-selection-context'
import { RowActions } from '#/components/shared/row-actions'
import type { TableColumn } from '#/components/ui/table'
import { useDialogState } from '#/hooks/use-dialog-state'
import { formatDay, maskCardNumber } from '#/lib/creditCard'
import type { CreditCard } from '#/lib/creditCard'
import { CreditCardDetails } from './credit-card-details'
import { CreditCardFormDialog } from './credit-card-form-dialog'
import { CreditCardVisual } from './credit-card-visual'
import { DeleteCreditCardDialog } from './delete-credit-card-dialog'
import { useAccountCreditCards } from './use-account-credit-cards'
import { TableCustom } from '#/components/ui/table'

type CardRow = {
  id: string
  name: string
  description: string
  lastFourDigits: string
  dueDay: string
  actions: ReactNode
}

const columns: Array<TableColumn<CardRow>> = [
  { label: 'Nome', value: 'name' },
  { label: 'Descrição', value: 'description' },
  { label: 'Final', value: 'lastFourDigits' },
  { label: 'Vencimento', value: 'dueDay' },
  { label: 'Ações', value: 'actions' },
]

const pluralize = (count: number) =>
  `${count} ${count === 1 ? 'cartão' : 'cartões'}`

export const CreditCards = () => {
  const { data: cards = [], isPending } = useAccountCreditCards()
  // a lista é filtrada pela conta do header: vazio pode ser só "nenhum nesta conta"
  const { selectedAccount } = useAccountSelection()
  const [createOpen, setCreateOpen] = useState(false)
  const editDialog = useDialogState<CreditCard>()
  const deleteDialog = useDialogState<CreditCard>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  // derivado do índice: não guarda uma cópia do cartão que possa ficar desatualizada
  const selectedCard = cards.at(selectedIndex) ?? null

  const toRow = (card: CreditCard): CardRow => ({
    id: card.id,
    name: card.name,
    description: card.description || '—',
    lastFourDigits: maskCardNumber(card.lastFourDigits) ?? '—',
    dueDay: `Dia ${formatDay(card.dueDay)}`,
    actions: (
      <RowActions
        label={`cartão ${card.name}`}
        onEdit={() => editDialog.show(card)}
        onDelete={() => deleteDialog.show(card)}
      />
    ),
  })

  const renderSlider = () => {
    // mesmo tamanho do cartão: a tela não pula quando os dados chegam
    if (isPending) {
      return (
        <Skeleton className="mx-auto aspect-[1.586] w-64 rounded-2xl sm:w-72" />
      )
    }

    if (cards.length === 0) {
      return (
        <p className="py-10 text-center text-sm text-muted-foreground">
          Nenhum cartão nesta conta
        </p>
      )
    }

    return (
      <Carousel
        label="Cartões de crédito"
        items={cards}
        getKey={(card) => card.id}
        slideClassName="basis-auto"
        onSelectedChange={setSelectedIndex}
        renderItem={(card, selected) => (
          <CreditCardVisual card={card} selected={selected} />
        )}
      />
    )
  }

  const renderDetails = () => {
    if (isPending) {
      return (
        <CardContent className="flex flex-col gap-3">
          <Skeleton className="h-8 w-1/2" />
          <Skeleton className="h-4 w-3/4" />
          <Skeleton className="h-24 w-full" />
        </CardContent>
      )
    }

    if (!selectedCard) {
      return (
        <CardContent className="py-10 text-center text-sm text-muted-foreground">
          Cadastre um cartão para ver os detalhes
        </CardContent>
      )
    }

    return (
      <CreditCardDetails
        card={selectedCard}
        onEdit={editDialog.show}
        onDelete={deleteDialog.show}
      />
    )
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex items-center justify-between gap-2">
        <div>
          <h1 className="text-2xl font-semibold">Meus cartões</h1>
          <small className="text-muted-foreground">
            {pluralize(cards.length)}
            {cards.length > 1 && ' · clique, arraste ou use ← → para trocar'}
          </small>
        </div>
        <Button onClick={() => setCreateOpen(true)}>
          <Plus /> Novo cartão
        </Button>
      </div>

      <div className="grid gap-3 md:grid-cols-[1fr_0.75fr]">
        <Card className="min-w-0 border border-border bg-background">
          <CardContent>{renderSlider()}</CardContent>
        </Card>
        <Card className="border border-border bg-background">
          {renderDetails()}
        </Card>
      </div>
      <TableCustom
        label=""
        columns={columns}
        items={cards.map(toRow)}
        isLoading={isPending}
        getRowKey={(row) => row.id}
        searchable
        searchPlaceholder="Buscar cartão..."
        emptyState={{
          title: selectedAccount
            ? 'Nenhum cartão nesta conta'
            : 'Nenhum cartão cadastrado',
          description: 'Cadastre um cartão para acompanhar limite e faturas.',
          action: (
            <Button onClick={() => setCreateOpen(true)}>
              <Plus /> Novo cartão
            </Button>
          ),
        }}
      />

      <CreditCardFormDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onSuccess={() => setCreateOpen(false)}
      />
      <CreditCardFormDialog
        {...editDialog.rootProps}
        card={editDialog.target}
        onSuccess={editDialog.close}
      />
      <DeleteCreditCardDialog
        {...deleteDialog.rootProps}
        card={deleteDialog.target}
        onSuccess={deleteDialog.close}
      />
    </div>
  )
}
