import { AuthLayout } from "./auth-layout"
import { TabsContent, TabsTrigger, Tabs, TabsList } from '../ui/tabs'
import { Login } from "./login"
import { Register } from "./register"
import { cn } from "cn"
import { useState } from "react"

export const Auth = () => {
  const [tabSelected, setTabSelected] = useState("Entrar")
  const isLogin = tabSelected === "Entrar"
  const title = isLogin ? "Bem-vindo" : "Crie sua conta"
  const description = isLogin
    ? "Entre para ver suas finanças."
    : "Leva menos de um minuto. Sem cartão de crédito."

  return (
    <AuthLayout title={title} description={description}>
      <Tabs value={tabSelected} onValueChange={(value) => setTabSelected(String(value))} className={'w-full flex flex-col'}>
        <TabsList className="w-full p-1 bg-background mb-3 rounded-xl" >
          <TabsTrigger
            className={cn(
              "dark:data-active:bg-nav-active dark:data-active:text-white dark:border-0 dark:font-bold",
              "data-active:bg-nav-active-foreground data-active:text-nav-active border-0 font-bold",
              "p-2 h-10 rounded-xl"
            )}
            value="Entrar"
          >
            Entrar
          </TabsTrigger>
          <TabsTrigger
            className={cn(
              "dark:data-active:bg-nav-active dark:data-active:text-white dark:border-0 dark:font-bold",
              "data-active:bg-nav-active-foreground data-active:text-nav-active border-0 font-bold",
              "p-2 h-10 rounded-xl"
            )}
            value="Registrar"
          >
            Registrar
          </TabsTrigger>
        </TabsList>
        <TabsContent value="Entrar">
          <Login setTabSelected={setTabSelected} />
        </TabsContent>
        <TabsContent value="Registrar">
          <Register setTabSelected={setTabSelected} />
        </TabsContent>
      </Tabs>
    </AuthLayout>
  )
}