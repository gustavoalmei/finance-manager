# Finance Manager

Aplicação web para gestão de finanças pessoais: contas, cartões de crédito, categorias e transações, com um dashboard personalizável e importação de lançamentos por planilha ou por IA.

## Funcionalidades

- **Autenticação**: cadastro, login e logout com sessão em cookie criptografado; troca de senha e encerramento das outras sessões ativas.
- **Contas**: cadastro de contas (corrente, poupança etc.) com saldo calculado a partir das transações.
- **Cartões de crédito**: bandeira, últimos 4 dígitos, limite, dia de fechamento e de vencimento; acompanhamento de faturas e do limite usado.
- **Categorias**: nome, descrição, cor e ícone personalizáveis.
- **Transações**:
  - Receitas, despesas e transferências entre contas próprias.
  - Status (pendente, confirmada, cancelada), parcelamento e lançamentos recorrentes.
  - Filtro por período e cards de resumo (receitas, despesas, resultado).
  - **Importação por planilha** `.xls`/`.xlsx`, com modelo para download.
  - **Extração por IA**: cola-se o texto de uma fatura ou extrato e a IA gera rascunhos de transações para revisão antes de salvar. Um passo de conciliação no código confere que cada valor retornado existe no texto original.
- **Dashboard** com widgets que podem ser adicionados, removidos e reordenados (drag and drop), com o layout salvo por usuário: saldo total, receitas, despesas, resultado, evolução, despesas por categoria, ranking de categorias, gastos por cartão, limite do cartão, faturas, saldo por conta, últimas transações, contas a pagar e receber, e carrossel.
- **Preferências**: dia de início do mês financeiro, tema claro/escuro e opção de ocultar valores na tela.
- **Responsivo**: sidebar no desktop e menu próprio no mobile.

## Stack

### Frontend (`frontend/`)

| Área            | Tecnologias                                                                                   |
| --------------- | --------------------------------------------------------------------------------------------- |
| Framework       | React 19, TanStack Start (SSR), TanStack Router                                               |
| Dados           | TanStack Query, Axios                                                                         |
| UI              | Tailwind CSS 4, shadcn/ui + Base UI, Lucide / React Icons                                     |
| Gráficos        | Recharts                                                                                      |
| Outros          | dnd-kit (drag and drop), Embla Carousel, date-fns, React Day Picker, ExcelJS, react-hot-toast |
| Build/Qualidade | Vite 8, TypeScript, ESLint, Prettier                                                          |
| Deploy          | Vercel                                                                                        |

### Backend (`backend/`)

| Área      | Tecnologias                                                                                            |
| --------- | ------------------------------------------------------------------------------------------------------ |
| Servidor  | Node.js, Fastify 5, TypeScript (executado com `tsx`)                                                   |
| Banco     | PostgreSQL 18, Prisma 7 (adapter `pg`)                                                                 |
| Validação | Zod                                                                                                    |
| Segurança | Argon2 (hash de senhas), `@fastify/secure-session`, Helmet, CORS, rate limit nas rotas de autenticação |
| IA        | OpenRouter (modelos configuráveis via `.env`)                                                          |
| Planilhas | ExcelJS                                                                                                |
| Infra     | Docker / Docker Compose                                                                                |

O backend é organizado por módulos (`src/modules/<módulo>`), cada um com `routes`, `controller`, `service`, `repository`, `schema` (Zod) e `dto`. Os módulos são `auth`, `me`, `account`, `card`, `category`, `transactions`, `dashboard` e `health`.

## Como rodar

Pré-requisitos: Node.js 24+, Docker e Docker Compose.

1. Configure os arquivos `.env`:

   **`backend/.env`**

   ```env
   POSTGRES_HOST=
   POSTGRES_USER=
   POSTGRES_PASSWORD=
   POSTGRES_DB=
   POSTGRES_PORT=
   SECRET=
   DATABASE_URL=
   OPENROUTER_API_KEY=
   OPENROUTER_DATA_COLLECTION=
   # opcional: lista de modelos separados por vírgula
   OPENROUTER_MODELS=
   ```

   **`frontend/.env`**

   ```env
   API_URL=
   ```

2. Instale as dependências e aplique as migrations:

   ```bash
   cd backend && npm install && npx prisma migrate deploy
   cd ../frontend && npm install
   ```

3. Suba o projeto:
   ```bash
   cd backend && docker compose up   # Postgres (porta 5433) + API (porta 3000)
   cd frontend && npm run dev        # app em http://localhost:3001
   ```

## Estrutura

```
finance-manager/
├── backend/
│   ├── prisma/          # schema e migrations
│   ├── src/
│   │   ├── app/         # plugins (database, auth) e registro de rotas
│   │   ├── modules/     # módulos de domínio
│   │   └── shared/      # erros, utils e cliente de IA
│   ├── Dockerfile
│   └── docker-compose.yml
├── frontend/
│   └── src/
│       ├── routes/      # rotas (file-based, TanStack Router)
│       ├── components/  # componentes por feature + ui (shadcn)
│       ├── lib/         # clientes da API e queries por domínio
│       └── hooks/
└── runDev.sh
```
