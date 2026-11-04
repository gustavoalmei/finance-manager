import { AccountSelectors } from '#/components/accounts/account-selectors'
import { HideValuesToggle } from '#/components/hide-values-toggle'
import { LogoBar } from './logo-bar'
import { MobileMenu } from './mobile-menu'

export const MobileTopBar = () => (
  <div className="flex flex-col gap-3 md:hidden">
    <LogoBar start={<MobileMenu />} end={<HideValuesToggle />} />
    <AccountSelectors />
  </div>
)
