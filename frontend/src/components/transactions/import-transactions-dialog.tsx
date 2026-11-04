import { useId, useState } from 'react'
import type { ChangeEvent, DragEvent, SubmitEvent } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { Download, FileSpreadsheet, Upload, X } from 'lucide-react'
import type { DataValidation } from 'exceljs'
import {
  AccountSelect,
  useDefaultAccountId,
} from '#/components/accounts/account-select'
import { Button } from '#/components/ui/button'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '#/components/ui/dialog'
import { FormField } from '#/components/ui/form-field'
import type { DialogRootProps } from '#/hooks/use-dialog-state'
import { categoriesQueryOptions } from '#/lib/categories/queries'
import { toaster } from '#/lib/toaster'
import { creditCardsQueryOptions } from '#/lib/creditCard/queries'
import { transactionTypeLabels, transactions } from '#/lib/transactions'
import { cn } from '#/lib/utils'

const ACCEPTED_EXTENSIONS = ['.xls', '.xlsx']
// O arquivo vai em base64 no JSON (+33%) e o Fastify recusa corpo acima de 1 MB
const MAX_FILE_BYTES = 700 * 1024

const formatSize = (bytes: number) =>
  bytes < 1024 ? `${bytes} B` : `${(bytes / 1024).toFixed(0)} KB`

// devolve a mensagem de erro, ou null se o arquivo serve
const validateFile = (file: File) => {
  const name = file.name.toLowerCase()
  if (!ACCEPTED_EXTENSIONS.some((ext) => name.endsWith(ext))) {
    return 'Selecione uma planilha .xls ou .xlsx.'
  }
  if (file.size > MAX_FILE_BYTES) {
    return `O arquivo deve ter no máximo ${formatSize(MAX_FILE_BYTES)}.`
  }
  return null
}

type ImportFormProps = {
  onSuccess: () => void
}

const TEMPLATE_FILE_NAME = 'modelo-transacoes.xlsx'
// mesmo nome do <title> em routes/__root.tsx
const PROJECT_NAME = 'Finance App'
// --nav-active e --nav-active-foreground de styles.css, em ARGB
const NAV_ACTIVE = 'FF22007C'
const NAV_ACTIVE_FOREGROUND = 'FFF4F4F9'

// layout: título (1) · cabeçalho (2) · valores (3 em diante)
const TITLE_ROW = 1
const HEADER_ROW = 2
const FIRST_DATA_ROW = 3
// linhas que recebem as listas suspensas, contando a de exemplo
const TEMPLATE_ROWS = 500
const LAST_DATA_ROW = FIRST_DATA_ROW + TEMPLATE_ROWS - 1

type TemplateColumn = {
  header: string
  key: string
  // largura em caracteres
  width: number
  numFmt?: string
  // vira lista suspensa no Excel: evita digitar um valor que o back não conhece
  options?: string[]
  // comentário no cabeçalho (aparece ao passar o mouse no Excel)
  note?: string
}

// tipos e status vêm dos mesmos labels da tela, então o modelo acompanha mudanças
const templateColumns: TemplateColumn[] = [
  { header: 'Data', key: 'date', width: 12, numFmt: 'dd/mm/yyyy' },
  { header: 'Descrição', key: 'description', width: 30 },
  { header: 'Valor', key: 'amount', width: 12, numFmt: '#,##0.00' },
  {
    header: 'Tipo',
    key: 'type',
    width: 12,
    // transferência tem fluxo próprio no back
    options: [transactionTypeLabels.INCOME, transactionTypeLabels.EXPENSE],
  },
  {
    header: 'Status',
    key: 'status',
    width: 12,
    // mesmos textos do formulário; o back confere se o status combina com o Tipo
    options: ['Pago', 'A pagar', 'Recebido', 'A receber', 'Cancelada'],
  },
  { header: 'Categoria', key: 'category', width: 18 },
  {
    header: 'Recorrente',
    key: 'isRecurring',
    width: 15,
    options: ['Sim', 'Não'],
  },
  // em branco = débito na conta; só para despesa
  { header: 'Cartão', key: 'card', width: 18 },
  // em branco = à vista; o Valor é o total da compra
  { header: 'Parcelas', key: 'installments', width: 10, numFmt: '0' },
  {
    header: 'Parcela atual',
    key: 'currentInstallment',
    width: 14,
    numFmt: '0',
    note: 'Compra que já começou (ex.: 4 de 10): informe 4. Aí o Valor é o da parcela e a Data é a da parcela atual; as anteriores não são lançadas. Em branco = 1 (compra nova).',
  },
]

// mesmo limite do formulário (MAX_INSTALLMENTS)
const MAX_INSTALLMENTS = 48

// linha de exemplo: mostra o formato esperado de cada campo
const templateExample = {
  // ExcelJS grava datas em UTC: meia-noite UTC mantém o dia certo
  date: new Date(Date.UTC(2026, 9, 15)),
  description: 'Supermercado',
  amount: 150.9,
  type: transactionTypeLabels.EXPENSE,
  status: 'Pago',
  category: 'Alimentação',
  isRecurring: 'Não',
}

// aba oculta com as listas do usuário (categorias, cartões) para as listas suspensas
const LISTS_SHEET = 'Listas'

type TemplateLists = {
  categoryNames: string[]
  cardNames: string[]
}

// Gerado no navegador: o modelo acompanha o código, sem arquivo estático para manter
const handlerDownloadTemplate = async ({
  categoryNames,
  cardNames,
}: TemplateLists) => {
  // import dinâmico: o ExcelJS é pesado e só é baixado quando alguém clica
  const { Workbook } = await import('exceljs')
  const book = new Workbook()
  const sheet = book.addWorksheet('Transações', {
    // congela título + cabeçalho ao rolar
    views: [{ state: 'frozen', ySplit: HEADER_ROW }],
  })

  // sem `header`: com ele o ExcelJS escreve os nomes na linha 1, por cima do título
  sheet.columns = templateColumns.map(({ key, width, numFmt }) => ({
    key,
    width,
    style: numFmt ? { numFmt } : {},
  }))

  // Linha 1: título mesclado sobre todas as colunas
  const lastColumn = sheet.getColumn(templateColumns.length).letter
  sheet.mergeCells(`A${TITLE_ROW}:${lastColumn}${TITLE_ROW}`)
  // numa mescla, só a 1ª célula guarda valor e estilo
  const title = sheet.getCell(`A${TITLE_ROW}`)
  title.value = PROJECT_NAME
  title.font = { bold: true, size: 14, color: { argb: NAV_ACTIVE_FOREGROUND }, family: 2, }
  title.fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: NAV_ACTIVE },
  }
  title.alignment = { horizontal: 'center', vertical: 'middle' }
  sheet.getRow(TITLE_ROW).height = 30

  // Linha 2: nomes das colunas
  const headerRow = sheet.getRow(HEADER_ROW)
  headerRow.values = templateColumns.map(({ header }) => header)
  headerRow.height = 22
  headerRow.eachCell((cell, colNumber) => {
    const note = templateColumns[colNumber - 1]?.note
    if (note) cell.note = note
    cell.font = {
      bold: true, color: { argb: 'FFFFFFFF' }, family: 2, size: 11
    }
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: NAV_ACTIVE },
    }
    cell.alignment = { vertical: 'middle' }
  })

  // Linha 3 em diante: valores (addRow usa as keys de sheet.columns)
  // o exemplo usa uma categoria real: senão a própria linha de exemplo falha na importação
  sheet.addRow({
    ...templateExample,
    category: categoryNames[0] ?? templateExample.category,
  })

  const { dataValidations } = sheet as typeof sheet & {
    dataValidations: { add: (range: string, rule: DataValidation) => void }
  }
  templateColumns.forEach(({ options }, index) => {
    if (!options) return
    const { letter } = sheet.getColumn(index + 1)
    dataValidations.add(
      `${letter}${FIRST_DATA_ROW}:${letter}${LAST_DATA_ROW}`,
      {
        type: 'list',
        allowBlank: true,
        // a lista entra entre aspas, separada por vírgula
        formulae: [`"${options.join(',')}"`],
        showErrorMessage: true,
        errorTitle: 'Valor inválido',
        error: `Escolha um destes: ${options.join(', ')}.`,
      },
    )
  })

  const columnLetter = (key: string) =>
    sheet.getColumn(templateColumns.findIndex((column) => column.key === key) + 1)
      .letter

  // Categorias e cartões vêm de uma aba oculta, não da lista entre aspas: essa tem limite
  // de 255 caracteres e quebraria com vírgula no nome. Lista vazia deixa a coluna livre.
  const listsSheet = book.addWorksheet(LISTS_SHEET, { state: 'hidden' })
  const addSheetList = (
    key: string,
    names: string[],
    listColumn: string,
    error: string,
  ) => {
    if (names.length === 0) return
    names.forEach((name, index) => {
      listsSheet.getCell(`${listColumn}${index + 1}`).value = name
    })
    const letter = columnLetter(key)
    dataValidations.add(`${letter}${FIRST_DATA_ROW}:${letter}${LAST_DATA_ROW}`, {
      type: 'list',
      allowBlank: true,
      formulae: [`'${LISTS_SHEET}'!$${listColumn}$1:$${listColumn}$${names.length}`],
      showErrorMessage: true,
      errorTitle: 'Valor inválido',
      error,
    })
  }
  addSheetList(
    'category',
    categoryNames,
    'A',
    'Escolha uma categoria da lista. Para usar outra, cadastre-a antes em Categorias.',
  )
  addSheetList(
    'card',
    cardNames,
    'B',
    'Escolha um cartão da lista, ou deixe em branco para débito na conta.',
  )

  const installmentsLetter = columnLetter('installments')
  dataValidations.add(
    `${installmentsLetter}${FIRST_DATA_ROW}:${installmentsLetter}${LAST_DATA_ROW}`,
    {
      type: 'whole',
      operator: 'between',
      allowBlank: true,
      formulae: [1, MAX_INSTALLMENTS],
      showErrorMessage: true,
      errorTitle: 'Valor inválido',
      error: `Informe um número inteiro de 1 a ${MAX_INSTALLMENTS}, ou deixe em branco para à vista.`,
    },
  )

  const currentInstallmentLetter = columnLetter('currentInstallment')
  dataValidations.add(
    `${currentInstallmentLetter}${FIRST_DATA_ROW}:${currentInstallmentLetter}${LAST_DATA_ROW}`,
    {
      type: 'whole',
      operator: 'between',
      allowBlank: true,
      formulae: [1, MAX_INSTALLMENTS],
      showErrorMessage: true,
      errorTitle: 'Valor inválido',
      error: `Informe em qual parcela a compra está (1 a ${MAX_INSTALLMENTS}), ou deixe em branco para compra nova.`,
    },
  )

  const buffer = await book.xlsx.writeBuffer()
  const url = URL.createObjectURL(
    new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    }),
  )
  const link = document.createElement('a')
  link.href = url
  link.download = TEMPLATE_FILE_NAME
  link.click()
  URL.revokeObjectURL(url)
}

// Fica dentro do Popup: o Base UI desmonta ao fechar, então o arquivo escolhido some junto
const ImportForm = ({ onSuccess }: ImportFormProps) => {
  const inputId = useId()
  const [file, setFile] = useState<File | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const queryClient = useQueryClient()
  // linhas sem cartão vão para esta conta; com cartão, para a conta do cartão
  const defaultAccountId = useDefaultAccountId()
  const [accountId, setAccountId] = useState(defaultAccountId)

  const importMutation = useMutation({
    mutationFn: (selected: File) =>
      transactions.importFile(selected, accountId ?? undefined),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['transactions'] })
      // saldos mudam com os lançamentos importados
      queryClient.invalidateQueries({ queryKey: ['accounts'] })
      toaster.success('Transações importadas!')
      onSuccess()
    },
    onError: (err) => toaster.error(err),
  })

  const selectFile = (selected: File | undefined) => {
    if (!selected) return
    const message = validateFile(selected)
    setError(message)
    setFile(message ? null : selected)
  }

  const handleChange = (event: ChangeEvent<HTMLInputElement>) => {
    selectFile(event.target.files?.[0])
    // limpa o valor: escolher o mesmo arquivo de novo dispara o onChange
    event.target.value = ''
  }

  const handleDrop = (event: DragEvent<HTMLLabelElement>) => {
    event.preventDefault()
    setIsDragging(false)
    selectFile(event.dataTransfer.files[0])
  }

  const handleSubmit = (event: SubmitEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!file) {
      setError('Selecione a planilha que deseja importar.')
      return
    }
    importMutation.mutate(file)
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-5">
      <section className="flex flex-col gap-3 rounded-lg border border-border p-4">
        <div className="flex flex-col gap-1">
          <h3 className="text-sm font-semibold">1. Baixe o modelo</h3>
          <p className="text-xs text-muted-foreground">
            Preencha uma transação por linha, mantendo os nomes das colunas.
          </p>
        </div>
        {/* <button>, não <a> sem href: <a> sem href não recebe foco pelo teclado */}
        <Button
          type="button"
          variant="outline"
          onClick={() =>
            Promise.all([
              queryClient.fetchQuery(categoriesQueryOptions()),
              queryClient.fetchQuery(creditCardsQueryOptions()),
            ])
              .then(([categoryList, cardList]) =>
                handlerDownloadTemplate({
                  categoryNames: categoryList.map(({ name }) => name),
                  cardNames: cardList.map(({ name }) => name),
                }),
              )
              .catch((err) => toaster.error(err))
          }
          className="w-fit cursor-pointer"
        >
          <Download /> Baixar modelo .xlsx
        </Button>
      </section>

      <section className="flex flex-col gap-3">
        <h3 className="text-sm font-semibold">
          2. Envie a planilha preenchida
        </h3>
        <label
          htmlFor={inputId}
          onDragOver={(event) => {
            event.preventDefault()
            setIsDragging(true)
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={handleDrop}
          className={cn(
            'flex cursor-pointer flex-col items-center gap-2 rounded-lg border border-dashed border-border-strong p-6 text-center transition-colors hover:bg-muted',
            'has-focus-visible:outline-2 has-focus-visible:outline-offset-2 has-focus-visible:outline-ring',
            isDragging && 'bg-muted',
            error && 'border-destructive-text',
          )}
        >
          {file ? (
            <>
              <FileSpreadsheet className="size-6 text-success" />
              <span className="text-sm font-medium break-all">{file.name}</span>
              <span className="text-xs text-muted-foreground">
                {formatSize(file.size)} · clique para trocar
              </span>
            </>
          ) : (
            <>
              <Upload className="size-6 text-muted-foreground" />
              <span className="text-sm font-medium">
                Clique para selecionar ou arraste o arquivo
              </span>
              <span className="text-xs text-muted-foreground">
                .xls ou .xlsx, até {formatSize(MAX_FILE_BYTES)}
              </span>
            </>
          )}
          <input
            id={inputId}
            type="file"
            accept=".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
            onChange={handleChange}
            disabled={importMutation.isPending}
            aria-invalid={!!error}
            className="sr-only"
          />
        </label>
        {error && (
          <small role="alert" className="text-[11px] text-destructive-text">
            {error}
          </small>
        )}
      </section>

      <FormField
        htmlFor="import-account"
        label="Conta"
        hint="Recebe as linhas sem cartão. Compras no cartão vão para a conta do cartão."
      >
        <AccountSelect
          id="import-account"
          value={accountId}
          onChange={setAccountId}
        />
      </FormField>

      <DialogFooter>
        <DialogClose render={<Button type="button" variant="outline" />}>
          Cancelar
        </DialogClose>
        <Button
          type="submit"
          disabled={!file || importMutation.isPending}
          className="cursor-pointer"
        >
          {importMutation.isPending ? 'Importando...' : 'Importar'}
        </Button>
      </DialogFooter>
    </form>
  )
}

type ImportTransactionsDialogProps = DialogRootProps & {
  onSuccess: () => void
}

export const ImportTransactionsDialog = ({
  onSuccess,
  ...rootProps
}: ImportTransactionsDialogProps) => (
  <Dialog {...rootProps}>
    <DialogContent className="md:max-w-lg">
      <DialogHeader className="flex-row items-center gap-3">
        <span
          aria-hidden="true"
          className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-brand text-brand-foreground"
        >
          <FileSpreadsheet className="size-4" />
        </span>
        <DialogTitle className="flex-1">Importar transações</DialogTitle>
        <DialogDescription className="sr-only">
          Baixe o modelo, preencha e envie a planilha.
        </DialogDescription>
        <DialogClose
          render={
            <Button
              variant="ghost"
              size="icon"
              aria-label="Fechar"
              className="cursor-pointer"
            />
          }
        >
          <X />
        </DialogClose>
      </DialogHeader>

      <ImportForm onSuccess={onSuccess} />
    </DialogContent>
  </Dialog>
)
