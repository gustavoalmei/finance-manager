import { Pencil, Trash2 } from 'lucide-react'
import { Button } from '#/components/ui/button'
import { Card, CardContent, CardHeader } from '#/components/ui/card'
import { Progress } from '#/components/ui/progress'
import { cardBrandLabels, formatDay, maskCardNumber } from '#/lib/creditCard'
import type { CreditCard } from '#/lib/creditCard'
import { formatCurrency } from '#/lib/format'

type StatCardProps = {
  label: string
  value: string
  // valor em dinheiro: borra com "Ocultar valores"
  sensitive?: boolean
}

const StatCard = ({ label, value, sensitive }: StatCardProps) => (
  <Card className="h-fit w-full gap-2">
    <CardHeader>
      <span className="font-light text-muted-foreground">{label}</span>
    </CardHeader>
    <CardContent className={sensitive ? 'sensitive text-lg font-bold' : 'text-lg font-bold'}>
      {value}
    </CardContent>
  </Card>
)

type CreditCardDetailsProps = {
  card: CreditCard
  onEdit: (card: CreditCard) => void
  onDelete: (card: CreditCard) => void
}

export const CreditCardDetails = ({
  card,
  onEdit,
  onDelete,
}: CreditCardDetailsProps) => {
  // Progress espera 0–100; limite 0 evita divisão por zero
  const usedPercent =
    card.creditLimit > 0 ? (card.usedCredit / card.creditLimit) * 100 : 0

  const subtitle = [
    card.name,
    maskCardNumber(card.lastFourDigits),
    cardBrandLabels[card.brand],
  ]
    .filter(Boolean)
    .join(' · ')

  const stats = [
    {
      label: 'Limite',
      value: formatCurrency(card.creditLimit / 100),
      sensitive: true,
    },
    { label: 'Fechamento', value: `Dia ${formatDay(card.closingDay)}` },
    { label: 'Vencimento', value: `Dia ${formatDay(card.dueDay)}` },
  ]

  return (
    <>
      <CardHeader>
        <span className="text-2xl font-bold text-foreground">Principal</span>
        <span className="text-muted-foreground">{subtitle}</span>
      </CardHeader>

      <CardContent className="flex flex-col gap-3">
        <div className="font-bold text-foreground">
          <p className="text-muted-foreground">Fatura atual</p>
          <span className="sensitive">
            {formatCurrency(card.currentInvoice.amount / 100)}
          </span>
        </div>

        <div className="flex flex-col gap-2">
          <Progress
            value={usedPercent}
            aria-label="Limite utilizado"
            trackClassName="h-2.5"
          />
          <div className="flex justify-between">
            <p className="text-muted-foreground">Limite disponível</p>
            <span className="sensitive font-bold text-foreground">
              {formatCurrency(card.availableCredit / 100)}
            </span>
          </div>
        </div>

        <div className="flex gap-3 flex-col md:flex-row md:flex-wrap lg:flex-nowrap">
          {stats.map((stat) => (
            <StatCard key={stat.label} {...stat} />
          ))}
        </div>

        {/* hover escurece a própria cor: o texto mantém contraste nos dois estados */}
        <div className="flex w-full gap-2">
          <Button
            variant="brand"
            aria-label={`Editar cartão ${card.name}`}
            onClick={() => onEdit(card)}
            className="flex-1 cursor-pointer"
          >
            <Pencil />
            Editar
          </Button>
          <Button
            variant="destructive-soft"
            aria-label={`Excluir cartão ${card.name}`}
            onClick={() => onDelete(card)}
            className="flex-1 cursor-pointer"
          >
            <Trash2 />
            Excluir
          </Button>
        </div>
      </CardContent>
    </>
  )
}
