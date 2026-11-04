import { useQuery } from '@tanstack/react-query'
import { Skeleton } from '#/components/ui/skeleton'
import { userQueryOptions } from '#/lib/auth/queries'
import { PreferencesSection } from './preferences-section'
import { ProfileSection } from './profile-section'
import { SecuritySection } from './security-section'

export const Settings = () => {
  // já vem em cache: o layout autenticado carrega o usuário antes da rota
  const { data: user } = useQuery(userQueryOptions())

  return (
    <div className="flex max-w-3xl flex-col gap-6 pb-6">
      <div>
        <h1 className="text-2xl font-semibold">Configurações</h1>
        <small className="text-muted-foreground">
          Perfil, segurança e preferências da sua conta.
        </small>
      </div>

      {user ? (
        <>
          {/* key: depois de salvar, o formulário recomeça com os dados novos */}
          <ProfileSection key={`${user.name}-${user.email}`} user={user} />
          <SecuritySection />
          <PreferencesSection user={user} />
        </>
      ) : (
        Array.from({ length: 3 }, (_, index) => (
          <Skeleton key={index} className="h-48 rounded-xl" />
        ))
      )}
    </div>
  )
}
