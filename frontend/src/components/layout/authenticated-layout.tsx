import { Outlet } from '@tanstack/react-router'
import { AccountSelectionProvider } from '#/components/accounts/account-selection-context'
import { AppHeader } from './app-header'
import { MobileTopBar } from './mobile-top-bar'
import { Sidebar } from './sidebar'

// min-h-0: permite que o <main> role dentro dos containers flex
export const AuthenticatedLayout = () => (
  <AccountSelectionProvider>
    <div className="flex h-full w-full flex-col gap-3 bg-background p-3 text-foreground md:flex-row md:gap-5.25 md:p-5.25">
      <Sidebar />
      <MobileTopBar />

      <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 rounded-panel bg-card">
        <AppHeader />

        <main className="min-h-0 flex-1 overflow-y-auto p-4 md:px-6 md:py-0">
          <Outlet />
        </main>
      </div>
    </div>
  </AccountSelectionProvider>
)
