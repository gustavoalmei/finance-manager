import { IoIosArrowForward } from 'react-icons/io'
import { CreditCardDropdown } from '#/components/credit-cards/credit-card-dropdown'
import { cn } from '#/lib/utils'
import { AccountDropdown } from './account-dropdown'
import { useAccountSelection } from './account-selection-context'

type AccountSelectorsProps = {
  className?: string
}

// mobile: dividem a largura · desktop: largura do conteúdo
const dropdownClasses = 'min-w-0 flex-1 md:flex-none'

export const AccountSelectors = ({ className }: AccountSelectorsProps) => {
  const { selectedAccount, setSelectedAccount, selectedCard, setSelectedCard } =
    useAccountSelection()

  return (
    <div className={cn('flex min-w-0 items-center gap-2 md:gap-3', className)}>
      <AccountDropdown
        value={selectedAccount}
        onChange={setSelectedAccount}
        className={dropdownClasses}
      />
      <IoIosArrowForward aria-hidden="true" className="shrink-0" />
      <CreditCardDropdown
        value={selectedCard}
        onChange={setSelectedCard}
        className={dropdownClasses}
      />
    </div>
  )
}
