import { useEffect, useMemo, useState, type FormEvent } from "react"
import { CalendarDays, ClipboardList, Lock, Save, ShieldCheck, Users } from "lucide-react"

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
import {
  getContractsForUser,
  loadContracts,
  saveContracts,
  type Contract,
} from "@/lib/contracts"
import {
  DAILY_EXECUTIONS_STORAGE_KEY,
  buildExecutionItems,
  buildWorkforceActual,
  deviationReasonOptions,
  getTodayInputValue,
  isExecutionClosed,
  loadDailyExecutions,
  saveDailyExecutions,
  syncContractProgressFromExecutions,
  upsertDailyExecution,
  type DailyExecution,
  type DailyExecutionFormItem,
  type DeviationReason,
  type WorkforceActualItem,
} from "@/lib/daily-executions"
import { createId } from "@/lib/contracts"
import { formatDateTimeBR } from "@/lib/dates"
import { hasCapability } from "@/lib/permissions"
import type { AppUser } from "@/lib/profile"

function getInitialExecutionState(currentUser: AppUser) {
  const contracts = loadContracts()
  const availableContracts = getContractsForUser(contracts, currentUser)
  const executions = loadDailyExecutions()
  const date = getTodayInputValue()
  const selectedContractId =
    availableContracts.find((contract) => contract.status !== "encerrado")?.id ??
    ""
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
    workforceActual: selectedContract
      ? buildWorkforceActual(selectedContract, existingExecution)
      : [],
  }
}

type LancamentoDiarioProps = {
  currentUser: AppUser
}

function getNumberInputValue(value: number) {
  return value === 0 ? "" : String(value)
}

export function LancamentoDiario({ currentUser }: LancamentoDiarioProps) {
  const [initialState] = useState(() => getInitialExecutionState(currentUser))
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
  const [workforceActual, setWorkforceActual] = useState<WorkforceActualItem[]>(
    () => initialState.workforceActual
  )
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState("")

  const profile = currentUser.profile
  const canManageExecution = hasCapability(profile, "daily-execution.manage")
  const availableContracts = useMemo(
    () =>
      getContractsForUser(contracts, currentUser).filter(
        (contract) => contract.status !== "encerrado"
      ),
    [contracts, currentUser]
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

  const executionIsClosed = isExecutionClosed(existingExecution)
  const totalRealizedToday = useMemo(
    () =>
      items.reduce((total, item) => total + (Number(item.realizedDaily) || 0), 0),
    [items]
  )
  const totalPlannedWorkforce = useMemo(
    () =>
      workforceActual.reduce(
        (total, role) => total + (Number(role.plannedCount) || 0),
        0
      ),
    [workforceActual]
  )
  const totalActualWorkforce = useMemo(
    () =>
      workforceActual.reduce(
        (total, role) => total + (Number(role.actualCount) || 0),
        0
      ),
    [workforceActual]
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

  function updateWorkforce(roleId: string, actualCount: number) {
    setWorkforceActual((currentWorkforce) =>
      currentWorkforce.map((role) =>
        role.roleId === roleId ? { ...role, actualCount } : role
      )
    )
  }

  function loadItemsForSelection(contractId: string, date: string) {
    const contract = contracts.find((item) => item.id === contractId)
    const execution = executions.find(
      (item) => item.contractId === contractId && item.date === date
    )

    setItems(contract ? buildExecutionItems(contract, execution) : [])
    setWorkforceActual(contract ? buildWorkforceActual(contract, execution) : [])
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
      const realizedDailyInput = item.realizedDaily.trim()
      const realizedDaily = Number(realizedDailyInput)
      const dailyGoal = Number(item.dailyGoal) || 0

      if (realizedDailyInput.length === 0) {
        errors[item.serviceId] =
          "Informe o realizado diário. Use 0 quando não houver execução."
        return
      }

      if (!Number.isFinite(realizedDaily) || realizedDaily < 0) {
        errors[item.serviceId] = "Informe um valor válido para o realizado diário."
        return
      }

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

    if (!canManageExecution || executionIsClosed || !selectedContract || !validateItems()) {
      return
    }

    const now = new Date().toISOString()
    const execution: DailyExecution = {
      id: existingExecution?.id ?? createId(),
      contractId: selectedContract.id,
      date: selectedDate,
      createdAt: existingExecution?.createdAt ?? now,
      updatedAt: now,
      closedAt: existingExecution?.closedAt,
      closedByProfile: existingExecution?.closedByProfile,
      workforceActual: workforceActual.map((role) => ({
        roleId: role.roleId,
        roleName: role.roleName,
        plannedCount: Number(role.plannedCount) || 0,
        actualCount: Number(role.actualCount) || 0,
      })),
      items: items.map((item) => ({
        serviceId: item.serviceId,
        realizedDaily: Number(item.realizedDaily),
        observation: item.observation.trim(),
        deviationReason: item.deviationReason,
        reviewObservation: item.reviewObservation,
        reviewCompleted: item.reviewCompleted,
        reviewedAt: item.reviewedAt,
        reviewHistory: item.reviewHistory ?? [],
      })),
    }

    const nextExecutions = upsertDailyExecution(executions, execution)
    const syncedContracts = syncContractProgressFromExecutions(
      contracts,
      nextExecutions
    )
    const refreshedContract =
      syncedContracts.find((contract) => contract.id === selectedContract.id) ??
      selectedContract
    const refreshedExecution = nextExecutions.find(
      (item) =>
        item.contractId === selectedContract.id && item.date === selectedDate
    )

    setExecutions(nextExecutions)
    setContracts(syncedContracts)
    setItems(buildExecutionItems(refreshedContract, refreshedExecution))
    setWorkforceActual(buildWorkforceActual(refreshedContract, refreshedExecution))
    setFeedback("Lançamento diário salvo com sucesso.")
  }

  function closeDay() {
    if (!canManageExecution) {
      return
    }

    if (!existingExecution) {
      setFeedback("Salve o lançamento antes de fechar o dia.")
      return
    }

    if (executionIsClosed) {
      setFeedback("Este expediente já foi fechado.")
      return
    }

    if (!validateItems()) {
      setFeedback("Revise os serviços antes de fechar o dia.")
      return
    }

    const confirmClosing = window.confirm(
      "Deseja fechar o dia deste contrato nesta data?"
    )

    if (!confirmClosing) {
      return
    }

    const confirmBlocking = window.confirm(
      "Confirma o fechamento? Depois disso, o Líder não poderá mais editar este lançamento."
    )

    if (!confirmBlocking) {
      return
    }

    const now = new Date().toISOString()

    setExecutions((currentExecutions) =>
      currentExecutions.map((execution) =>
        execution.id === existingExecution.id
          ? {
              ...execution,
              closedAt: now,
              closedByProfile: profile,
              updatedAt: now,
            }
          : execution
      )
    )
    setFeedback(
      "Dia fechado com sucesso. A partir de agora, apenas o Gestor pode ajustar pela revisão."
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Execução de campo
          </p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">
            Lançamento Diário
          </h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Registre produtividade e efetivo diário por função. Depois do
            fechamento do dia, somente o Gestor pode corrigir o lançamento.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Card size="sm" className="rounded-lg">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">Realizado no dia</p>
              <p className="text-xl font-semibold">{totalRealizedToday}</p>
            </CardContent>
          </Card>
          <Card size="sm" className="rounded-lg">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">Efetivo presente</p>
              <p className="text-xl font-semibold">
                {totalActualWorkforce}/{totalPlannedWorkforce}
              </p>
            </CardContent>
          </Card>
        </div>
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

              {existingExecution && !executionIsClosed && (
                <div className="flex items-center gap-2 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  <CalendarDays />
                  Este contrato já possui lançamento nesta data. Ao salvar, o
                  registro será atualizado.
                </div>
              )}

              {executionIsClosed && (
                <div className="flex items-center gap-2 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2 text-sm text-amber-800">
                  <Lock className="size-4" />
                  Expediente fechado em {formatDateTimeBR(existingExecution?.closedAt)}.
                  Apenas o Gestor pode corrigir pela tela de revisão.
                </div>
              )}

              <Card className="rounded-lg border-dashed">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Users className="size-4" />
                    Efetivo do dia
                  </CardTitle>
                  <CardDescription>
                    Compare o efetivo planejado do contrato com o time presente na
                    obra.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <div className="grid gap-3 md:grid-cols-3">
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Planejado</p>
                      <p className="text-lg font-semibold">{totalPlannedWorkforce}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Realizado</p>
                      <p className="text-lg font-semibold">{totalActualWorkforce}</p>
                    </div>
                    <div className="rounded-lg border bg-muted/20 p-3">
                      <p className="text-xs text-muted-foreground">Diferença</p>
                      <p className="text-lg font-semibold">
                        {totalActualWorkforce - totalPlannedWorkforce}
                      </p>
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    {workforceActual.map((role) => (
                      <div
                        key={role.roleId}
                        className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_140px]"
                      >
                        <div>
                          <p className="font-medium">{role.roleName || "Função"}</p>
                          <p className="text-xs text-muted-foreground">
                            Planejado: {role.plannedCount}
                          </p>
                        </div>
                        <Field>
                          <FieldLabel htmlFor={`workforce-${role.roleId}`}>
                            Presente
                          </FieldLabel>
                          <Input
                            id={`workforce-${role.roleId}`}
                            type="number"
                            min="0"
                            value={getNumberInputValue(role.actualCount)}
                            onChange={(event) =>
                              updateWorkforce(
                                role.roleId,
                                event.target.value === ""
                                  ? 0
                                  : Number(event.target.value)
                              )
                            }
                            disabled={executionIsClosed}
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <div className="grid gap-4 xl:grid-cols-2">
                {items.map((item) => {
                  const hasRealizedDailyInput = item.realizedDaily.trim().length > 0
                  const realizedDaily = hasRealizedDailyInput
                    ? Number(item.realizedDaily) || 0
                    : 0
                  const dailyGoal = Number(item.dailyGoal) || 0
                  const isBelowGoal = hasRealizedDailyInput && realizedDaily < dailyGoal
                  const dailyDifference = realizedDaily - dailyGoal
                  const dailyPercentage =
                    dailyGoal > 0 ? (realizedDaily / dailyGoal) * 100 : 0
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
                  const physicalBalance =
                    (Number(item.totalQuantity) || 0) - projectedTotal

                  return (
                    <Card key={item.serviceId} className="rounded-lg">
                      <CardHeader>
                        <CardTitle>{item.serviceName}</CardTitle>
                        <CardDescription>
                          Meta diária: {item.dailyGoal} {item.unit}
                        </CardDescription>
                      </CardHeader>
                      <CardContent className="flex flex-col gap-4">
                        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                          <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">Total</p>
                            <p className="font-semibold">
                              {item.totalQuantity} {item.unit}
                            </p>
                          </div>
                          <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">Acumulado</p>
                            <p className="font-semibold">
                              {projectedTotal} {item.unit}
                            </p>
                          </div>
                          <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">Avanço</p>
                            <p className="font-semibold">
                              {dailyPercentage.toFixed(1)}%
                            </p>
                          </div>
                          <div className="rounded-lg border bg-muted/20 p-3">
                            <p className="text-xs text-muted-foreground">Saldo</p>
                            <p className="font-semibold">
                              {physicalBalance.toFixed(1)} {item.unit}
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
                                  event.target.value
                                )
                              }
                              required
                              disabled={executionIsClosed}
                            />
                            {fieldErrors[item.serviceId]?.startsWith("Informe") && (
                              <p className="text-sm text-destructive">
                                {fieldErrors[item.serviceId]}
                              </p>
                            )}
                            <p className="text-xs text-muted-foreground">
                              Digite 0 quando o serviço não tiver execução nesta data.
                            </p>
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
                              disabled={executionIsClosed}
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
                                <Badge variant="destructive">Abaixo da meta</Badge>
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
                              disabled={executionIsClosed}
                            />
                            {fieldErrors[item.serviceId]?.startsWith(
                              "Observação"
                            ) && (
                              <p className="text-sm text-destructive">
                                {fieldErrors[item.serviceId]}
                              </p>
                            )}
                            <p className="mt-1 text-xs text-muted-foreground">
                              Diferença do dia: {dailyDifference.toFixed(1)} {item.unit} ·
                              Avanço acumulado: {progress.toFixed(1)}%
                            </p>
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
                <Button type="button" variant="outline" onClick={closeDay}>
                  <ShieldCheck data-icon="inline-start" />
                  Fechar dia
                </Button>
                <Button type="submit" disabled={!canManageExecution || executionIsClosed}>
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
