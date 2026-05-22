import { useEffect, useMemo, useState, type FormEvent } from "react"
import { CalendarDays, ClipboardList, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import { loadContracts, saveContracts, type Contract } from "@/lib/contracts"
import {
  DAILY_EXECUTIONS_STORAGE_KEY,
  buildExecutionItems,
  deviationReasonOptions,
  getTodayInputValue,
  loadDailyExecutions,
  saveDailyExecutions,
  syncContractProgressFromExecutions,
  upsertDailyExecution,
  type DailyExecution,
  type DailyExecutionFormItem,
  type DeviationReason,
} from "@/lib/daily-executions"
import { createId } from "@/lib/contracts"

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
})

function getInitialExecutionState() {
  const contracts = loadContracts()
  const executions = loadDailyExecutions()
  const date = getTodayInputValue()
  const selectedContractId =
    contracts.find((contract) => contract.status !== "encerrado")?.id ?? ""
  const selectedContract = contracts.find(
    (contract) => contract.id === selectedContractId
  )
  const existingExecution = executions.find(
    (execution) =>
      execution.contractId === selectedContractId && execution.date === date
  )

  return {
    contracts,
    executions,
    selectedContractId,
    selectedDate: date,
    items: selectedContract
      ? buildExecutionItems(selectedContract, existingExecution)
      : [],
  }
}

export function LancamentoDiario() {
  const [initialState] = useState(() => getInitialExecutionState())
  const [contracts, setContracts] = useState<Contract[]>(
    () => initialState.contracts
  )
  const [executions, setExecutions] = useState<DailyExecution[]>(
    () => initialState.executions
  )
  const [selectedContractId, setSelectedContractId] = useState(
    () => initialState.selectedContractId
  )
  const [selectedDate, setSelectedDate] = useState(
    () => initialState.selectedDate
  )
  const [items, setItems] = useState<DailyExecutionFormItem[]>(
    () => initialState.items
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState("")

  const availableContracts = useMemo(
    () => contracts.filter((contract) => contract.status !== "encerrado"),
    [contracts]
  )

  const selectedContract = useMemo(
    () =>
      availableContracts.find((contract) => contract.id === selectedContractId),
    [availableContracts, selectedContractId]
  )

  const existingExecution = useMemo(
    () =>
      executions.find(
        (execution) =>
          execution.contractId === selectedContractId &&
          execution.date === selectedDate
      ),
    [executions, selectedContractId, selectedDate]
  )

  const totalRealizedToday = useMemo(
    () =>
      items.reduce((total, item) => total + (Number(item.realizedDaily) || 0), 0),
    [items]
  )

  useEffect(() => {
    saveDailyExecutions(executions)
  }, [executions])

  useEffect(() => {
    saveContracts(contracts)
  }, [contracts])

  function updateItem<K extends keyof DailyExecutionFormItem>(
    serviceId: string,
    field: K,
    value: DailyExecutionFormItem[K]
  ) {
    setItems((currentItems) =>
      currentItems.map((item) =>
        item.serviceId === serviceId ? { ...item, [field]: value } : item
      )
    )

    setFieldErrors((currentErrors) => {
      const nextErrors = { ...currentErrors }
      delete nextErrors[serviceId]
      return nextErrors
    })
  }

  function loadItemsForSelection(contractId: string, date: string) {
    const contract = contracts.find((item) => item.id === contractId)
    const execution = executions.find(
      (item) => item.contractId === contractId && item.date === date
    )

    setItems(contract ? buildExecutionItems(contract, execution) : [])
    setFieldErrors({})
    setFeedback("")
  }

  function changeContract(contractId: string) {
    setSelectedContractId(contractId)
    loadItemsForSelection(contractId, selectedDate)
  }

  function changeDate(date: string) {
    setSelectedDate(date)
    loadItemsForSelection(selectedContractId, date)
  }

  function validateItems() {
    const errors: Record<string, string> = {}

    items.forEach((item) => {
      const realizedDaily = Number(item.realizedDaily) || 0
      const dailyGoal = Number(item.dailyGoal) || 0

      if (realizedDaily < dailyGoal && item.observation.trim().length === 0) {
        errors[item.serviceId] =
          "Observação obrigatória quando o realizado fica abaixo da meta."
      }
    })

    setFieldErrors(errors)

    return Object.keys(errors).length === 0
  }

  function submitExecution(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setFeedback("")

    if (!selectedContract || !validateItems()) {
      return
    }

    const now = new Date().toISOString()
    const execution: DailyExecution = {
      id: createId(),
      contractId: selectedContract.id,
      date: selectedDate,
      createdAt: now,
      updatedAt: now,
      items: items.map((item) => ({
        serviceId: item.serviceId,
        realizedDaily: Number(item.realizedDaily) || 0,
        observation: item.observation.trim(),
        deviationReason: item.deviationReason,
      })),
    }

    const nextExecutions = upsertDailyExecution(executions, execution)
    const syncedContracts = syncContractProgressFromExecutions(
      contracts,
      nextExecutions
    )

    setExecutions(nextExecutions)
    setContracts(syncedContracts)
    setItems(
      buildExecutionItems(
        syncedContracts.find((contract) => contract.id === selectedContract.id) ??
          selectedContract,
        execution
      )
    )
    setFeedback("Lançamento diário salvo e contrato atualizado.")
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Execução de campo
          </p>
          <h2 className="text-2xl font-semibold text-[#102f31]">
            Lançamento Diário
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Selecione um contrato, informe a data e registre a quantidade
            realizada por serviço.
          </p>
        </div>

        <Card size="sm" className="rounded-lg">
          <CardContent className="px-4">
            <p className="text-xs text-muted-foreground">Realizado no dia</p>
            <p className="text-xl font-semibold">{totalRealizedToday}</p>
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Dados do lançamento</CardTitle>
          <CardDescription>
            Lançamentos são salvos em {DAILY_EXECUTIONS_STORAGE_KEY}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {availableContracts.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-lg bg-background text-muted-foreground">
                <ClipboardList />
              </div>
              <div>
                <p className="font-medium">Nenhum contrato disponível</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Cadastre um contrato ativo antes de lançar a execução diária.
                </p>
              </div>
            </div>
          ) : (
            <form onSubmit={submitExecution} className="flex flex-col gap-6">
              <FieldGroup className="grid gap-4 md:grid-cols-[1fr_220px]">
                <Field>
                  <FieldLabel htmlFor="daily-contract">Contrato</FieldLabel>
                  <select
                    id="daily-contract"
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={selectedContractId}
                    onChange={(event) => changeContract(event.target.value)}
                    required
                  >
                    {availableContracts.map((contract) => (
                      <option key={contract.id} value={contract.id}>
                        {contract.name} - {contract.client}
                      </option>
                    ))}
                  </select>
                </Field>

                <Field>
                  <FieldLabel htmlFor="daily-date">Data</FieldLabel>
                  <Input
                    id="daily-date"
                    type="date"
                    value={selectedDate}
                    onChange={(event) => changeDate(event.target.value)}
                    required
                  />
                </Field>
              </FieldGroup>

              {existingExecution && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  <CalendarDays />
                  Este contrato já possui lançamento nesta data. Ao salvar, o
                  registro será atualizado.
                </div>
              )}

              <div className="grid gap-4 xl:grid-cols-2">
                {items.map((item) => {
                  const realizedDaily = Number(item.realizedDaily) || 0
                  const dailyGoal = Number(item.dailyGoal) || 0
                  const isBelowGoal = realizedDaily < dailyGoal
                  const projectedTotal =
                    Number(item.completedQuantity) +
                    realizedDaily -
                    (existingExecution?.items.find(
                      (executionItem) =>
                        executionItem.serviceId === item.serviceId
                    )?.realizedDaily ?? 0)
                  const progress =
                    item.totalQuantity > 0
                      ? (projectedTotal / item.totalQuantity) * 100
                      : 0

                  return (
                    <Card key={item.serviceId} className="rounded-lg">
                      <CardHeader>
                        <CardTitle>{item.serviceName}</CardTitle>
                        <CardDescription>
                          Meta diária: {item.dailyGoal} {item.unit}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4">
                        <div className="grid grid-cols-3 gap-3">
                          <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              Total
                            </p>
                            <p className="font-semibold">
                              {item.totalQuantity} {item.unit}
                            </p>
                          </div>
                          <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              Acumulado
                            </p>
                            <p className="font-semibold">
                              {projectedTotal} {item.unit}
                            </p>
                          </div>
                          <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">
                              Avanço
                            </p>
                            <p className="font-semibold">
                              {percentFormatter.format(progress)}%
                            </p>
                          </div>
                        </div>

                        <FieldGroup>
                          <Field>
                            <FieldLabel htmlFor={`realized-${item.serviceId}`}>
                              Realizado diário
                            </FieldLabel>
                            <Input
                              id={`realized-${item.serviceId}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={item.realizedDaily}
                              onChange={(event) =>
                                updateItem(
                                  item.serviceId,
                                  "realizedDaily",
                                  Number(event.target.value)
                                )
                              }
                              required
                            />
                          </Field>

                          <Field>
                            <FieldLabel htmlFor={`reason-${item.serviceId}`}>
                              Motivo do desvio
                            </FieldLabel>
                            <select
                              id={`reason-${item.serviceId}`}
                              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                              value={item.deviationReason}
                              onChange={(event) =>
                                updateItem(
                                  item.serviceId,
                                  "deviationReason",
                                  event.target.value as DeviationReason | ""
                                )
                              }
                            >
                              <option value="">Sem desvio informado</option>
                              {deviationReasonOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                          </Field>

                          <Field data-invalid={Boolean(fieldErrors[item.serviceId])}>
                            <div className="flex items-center justify-between gap-3">
                              <FieldLabel htmlFor={`observation-${item.serviceId}`}>
                                Observação
                              </FieldLabel>
                              {isBelowGoal && (
                                <Badge variant="destructive">
                                  Abaixo da meta
                                </Badge>
                              )}
                            </div>
                            <textarea
                              id={`observation-${item.serviceId}`}
                              className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 aria-invalid:border-destructive"
                              value={item.observation}
                              onChange={(event) =>
                                updateItem(
                                  item.serviceId,
                                  "observation",
                                  event.target.value
                                )
                              }
                              aria-invalid={Boolean(fieldErrors[item.serviceId])}
                              placeholder={
                                isBelowGoal
                                  ? "Obrigatória para realizado abaixo da meta"
                                  : "Opcional"
                              }
                            />
                            {fieldErrors[item.serviceId] && (
                              <p className="text-sm text-destructive">
                                {fieldErrors[item.serviceId]}
                              </p>
                            )}
                          </Field>
                        </FieldGroup>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>

              {feedback && (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {feedback}
                </div>
              )}

              <CardFooter className="justify-end gap-2 px-0 pb-0">
                <Button type="submit">
                  <Save data-icon="inline-start" />
                  Salvar lançamento
                </Button>
              </CardFooter>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
