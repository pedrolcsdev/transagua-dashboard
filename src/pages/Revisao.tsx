import { useEffect, useMemo, useState } from "react"
import { CheckCircle2, ClipboardCheck, History, Save } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  createId,
  getContractsForUser,
  loadContracts,
  saveContracts,
  type Contract,
} from "@/lib/contracts"
import {
  loadDailyExecutions,
  saveDailyExecutions,
  syncContractProgressFromExecutions,
  type DailyExecution,
  type DailyExecutionItem,
} from "@/lib/daily-executions"
import { formatDateBR, formatDateTimeBR } from "@/lib/dates"
import { hasCapability } from "@/lib/permissions"
import type { AppUser } from "@/lib/profile"
import { cn } from "@/lib/utils"

type ReviewRow = {
  execution: DailyExecution
  item: DailyExecutionItem
  contract?: Contract
  service?: Contract["services"][number]
}

const percentFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
})

function getPerformanceStatus(realized: number, goal: number) {
  if (goal <= 0) {
    return {
      label: "Sem meta",
      percentage: 0,
      className: "border-muted bg-muted/40 text-muted-foreground",
    }
  }

  const percentage = (realized / goal) * 100

  if (percentage >= 100) {
    return {
      label: "Meta atingida",
      percentage,
      className: "border-emerald-200 bg-emerald-50 text-emerald-700",
    }
  }

  if (percentage >= 80) {
    return {
      label: "Atenção",
      percentage,
      className: "border-amber-200 bg-amber-50 text-amber-700",
    }
  }

  return {
    label: "Crítico",
    percentage,
    className: "border-red-200 bg-red-50 text-red-700",
  }
}

type RevisaoProps = {
  currentUser: AppUser
}

function getNumberInputValue(value: number) {
  return value === 0 ? "" : String(value)
}

export function Revisao({ currentUser }: RevisaoProps) {
  const [contracts, setContracts] = useState<Contract[]>(() =>
    loadContracts()
  )
  const [executions, setExecutions] = useState<DailyExecution[]>(() =>
    loadDailyExecutions()
  )
  const [realizedDrafts, setRealizedDrafts] = useState<Record<string, string>>({})
  const [reviewObservationDrafts, setReviewObservationDrafts] = useState<
    Record<string, string>
  >({})
  const [reviewReasonDrafts, setReviewReasonDrafts] = useState<Record<string, string>>(
    {}
  )
  const [rowErrors, setRowErrors] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState("")

  const profile = currentUser.profile
  const canManageReview = hasCapability(profile, "review.manage")
  const visibleContracts = useMemo(
    () => getContractsForUser(contracts, currentUser),
    [contracts, currentUser]
  )
  const visibleContractIds = useMemo(
    () => new Set(visibleContracts.map((contract) => contract.id)),
    [visibleContracts]
  )
  const reviewRows = useMemo<ReviewRow[]>(
    () =>
      executions
        .filter((execution) => visibleContractIds.has(execution.contractId))
        .flatMap((execution) => {
          const contract = visibleContracts.find(
            (item) => item.id === execution.contractId
          )

          return execution.items.map((item) => ({
            execution,
            item,
            contract,
            service: contract?.services.find(
              (service) => service.id === item.serviceId
            ),
          }))
        }),
    [executions, visibleContractIds, visibleContracts]
  )

  const completedReviews = useMemo(
    () => reviewRows.filter((row) => row.item.reviewCompleted).length,
    [reviewRows]
  )

  useEffect(() => {
    saveDailyExecutions(executions)
  }, [executions])

  useEffect(() => {
    saveContracts(contracts)
  }, [contracts])

  function getRowKey(executionId: string, serviceId: string) {
    return `${executionId}-${serviceId}`
  }

  function updateExecutionItem(
    executionId: string,
    serviceId: string,
    updater: (item: DailyExecutionItem) => DailyExecutionItem,
    successMessage: string
  ) {
    const now = new Date().toISOString()
    const nextExecutions = executions.map((execution) =>
      execution.id === executionId
        ? {
            ...execution,
            updatedAt: now,
            items: execution.items.map((item) =>
              item.serviceId === serviceId ? updater(item) : item
            ),
          }
        : execution
    )

    const syncedContracts = syncContractProgressFromExecutions(
      contracts,
      nextExecutions
    )

    setExecutions(nextExecutions)
    setContracts(syncedContracts)
    setFeedback(successMessage)
  }

  function saveReviewRow(executionId: string, serviceId: string) {
    const row = reviewRows.find(
      (entry) =>
        entry.execution.id === executionId && entry.item.serviceId === serviceId
    )

    if (!row || !canManageReview) {
      return false
    }

    const rowKey = getRowKey(executionId, serviceId)
    const nextRealized = Number(realizedDrafts[rowKey] ?? row.item.realizedDaily) || 0
    const reviewObservation =
      reviewObservationDrafts[rowKey] ?? row.item.reviewObservation ?? ""
    const reviewReason = reviewReasonDrafts[rowKey] ?? ""
    const currentRealized = Number(row.item.realizedDaily) || 0
    const hasRealizedChange = nextRealized !== currentRealized

    if (hasRealizedChange && reviewReason.trim().length === 0) {
      setRowErrors((current) => ({
        ...current,
        [rowKey]: "Informe o motivo da correção antes de salvar.",
      }))
      return false
    }

    setRowErrors((current) => {
      const nextErrors = { ...current }
      delete nextErrors[rowKey]
      return nextErrors
    })

    updateExecutionItem(
      executionId,
      serviceId,
      (item) => ({
        ...item,
        realizedDaily: nextRealized,
        reviewObservation: reviewObservation.trim(),
        reviewHistory: hasRealizedChange
          ? [
              ...(item.reviewHistory ?? []),
              {
                id: createId(),
                previousValue: currentRealized,
                newValue: nextRealized,
                reason: reviewReason.trim(),
                changedAt: new Date().toISOString(),
                changedByProfile: profile,
              },
            ]
          : item.reviewHistory ?? [],
      }),
      hasRealizedChange
        ? "Correção gerencial salva com histórico."
        : "Observação de revisão atualizada."
    )

    setRealizedDrafts((current) => ({
      ...current,
      [rowKey]: String(nextRealized),
    }))
    setReviewObservationDrafts((current) => ({
      ...current,
      [rowKey]: reviewObservation,
    }))
    setReviewReasonDrafts((current) => ({
      ...current,
      [rowKey]: "",
    }))

    return true
  }

  function completeReview(executionId: string, serviceId: string) {
    const rowKey = getRowKey(executionId, serviceId)
    const row = reviewRows.find(
      (entry) =>
        entry.execution.id === executionId && entry.item.serviceId === serviceId
    )

    if (!row || !canManageReview) {
      return
    }

    const hasPendingRealizedChange =
      realizedDrafts[rowKey] !== undefined &&
      Number(realizedDrafts[rowKey]) !== (Number(row.item.realizedDaily) || 0)
    const hasPendingObservationChange =
      reviewObservationDrafts[rowKey] !== undefined &&
      reviewObservationDrafts[rowKey] !== (row.item.reviewObservation ?? "")

    if (hasPendingRealizedChange || hasPendingObservationChange) {
      const didSave = saveReviewRow(executionId, serviceId)

      if (!didSave) {
        return
      }
    }

    const now = new Date().toISOString()

    updateExecutionItem(
      executionId,
      serviceId,
      (item) => ({
        ...item,
        reviewCompleted: true,
        reviewedAt: now,
      }),
      "Revisão concluída."
    )
  }

  if (!canManageReview) {
    return (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Revisão</CardTitle>
          <CardDescription>
            Apenas o Gestor pode validar e corrigir lançamentos.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Conferência gerencial
          </p>
          <h2 className="text-2xl font-semibold text-[#102f31]">Revisão</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            Corrija produtividade, registre justificativas e mantenha histórico
            auditável das alterações feitas pelo Gestor.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Card size="sm" className="rounded-lg">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">Itens lançados</p>
              <p className="text-xl font-semibold">{reviewRows.length}</p>
            </CardContent>
          </Card>
          <Card size="sm" className="rounded-lg">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">Revisados</p>
              <p className="text-xl font-semibold">{completedReviews}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Lançamentos para revisão</CardTitle>
          <CardDescription>
            Verde igual ou acima da meta, amarelo entre 80% e 99% e vermelho
            abaixo de 80%.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {reviewRows.length === 0 ? (
            <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
              <div className="flex size-12 items-center justify-center rounded-lg bg-background text-muted-foreground">
                <ClipboardCheck />
              </div>
              <div>
                <p className="font-medium">Nenhum lançamento para revisar</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  Os lançamentos diários aparecerão aqui assim que forem salvos.
                </p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {reviewRows.map(({ execution, item, contract, service }) => {
                const goal = Number(service?.dailyGoal) || 0
                const realized = Number(item.realizedDaily) || 0
                const performance = getPerformanceStatus(realized, goal)
                const rowKey = getRowKey(execution.id, item.serviceId)
                const workforcePlanned = execution.workforceActual.reduce(
                  (total, role) => total + (Number(role.plannedCount) || 0),
                  0
                )
                const workforceActual = execution.workforceActual.reduce(
                  (total, role) => total + (Number(role.actualCount) || 0),
                  0
                )

                return (
                  <div
                    key={rowKey}
                    className="rounded-lg border bg-card p-4"
                  >
                    <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <h3 className="font-semibold">
                            {service?.name ?? "Serviço removido"}
                          </h3>
                          <Badge
                            variant="outline"
                            className={cn("border", performance.className)}
                          >
                            {performance.label} ·{" "}
                            {percentFormatter.format(performance.percentage)}%
                          </Badge>
                          {item.reviewCompleted && (
                            <Badge variant="secondary">Revisão concluída</Badge>
                          )}
                          {execution.closedAt && (
                            <Badge variant="outline">Dia fechado</Badge>
                          )}
                        </div>
                        <p className="mt-1 text-sm text-muted-foreground">
                          {contract?.name ?? "Contrato não encontrado"} ·{" "}
                          {contract?.client ?? "Cliente não encontrado"} ·{" "}
                          {formatDateBR(execution.date)}
                        </p>
                      </div>

                      <div className="grid grid-cols-4 gap-2 text-sm lg:min-w-[28rem]">
                        <div className="rounded-lg border bg-muted/20 p-3">
                          <p className="text-xs text-muted-foreground">Meta</p>
                          <p className="font-semibold">
                            {goal} {service?.unit ?? ""}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3">
                          <p className="text-xs text-muted-foreground">Realizado</p>
                          <p className="font-semibold">
                            {realized} {service?.unit ?? ""}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3">
                          <p className="text-xs text-muted-foreground">Efetivo</p>
                          <p className="font-semibold">
                            {workforceActual}/{workforcePlanned}
                          </p>
                        </div>
                        <div className="rounded-lg border bg-muted/20 p-3">
                          <p className="text-xs text-muted-foreground">Acumulado</p>
                          <p className="font-semibold">
                            {service?.completedQuantity ?? 0} {service?.unit ?? ""}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className="mt-4 grid gap-4 lg:grid-cols-[220px_220px_1fr_auto] lg:items-end">
                      <FieldGroup>
                        <Field>
                          <FieldLabel htmlFor={`review-realized-${item.serviceId}`}>
                            Corrigir realizado
                          </FieldLabel>
                          <Input
                            id={`review-realized-${item.serviceId}`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={
                              realizedDrafts[rowKey] ??
                              getNumberInputValue(item.realizedDaily)
                            }
                            onChange={(event) =>
                              setRealizedDrafts((current) => ({
                                ...current,
                                [rowKey]: event.target.value,
                              }))
                            }
                          />
                        </Field>
                      </FieldGroup>

                      <Field>
                        <FieldLabel htmlFor={`review-reason-${item.serviceId}`}>
                          Motivo da correção
                        </FieldLabel>
                        <Input
                          id={`review-reason-${item.serviceId}`}
                          value={reviewReasonDrafts[rowKey] ?? ""}
                          onChange={(event) =>
                            setReviewReasonDrafts((current) => ({
                              ...current,
                              [rowKey]: event.target.value,
                            }))
                          }
                          placeholder="Ex.: medição conferida em campo"
                        />
                      </Field>

                      <Field>
                        <FieldLabel htmlFor={`review-note-${item.serviceId}`}>
                          Observação de revisão
                        </FieldLabel>
                        <textarea
                          id={`review-note-${item.serviceId}`}
                          className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          value={
                            reviewObservationDrafts[rowKey] ??
                            item.reviewObservation ??
                            ""
                          }
                          onChange={(event) =>
                            setReviewObservationDrafts((current) => ({
                              ...current,
                              [rowKey]: event.target.value,
                            }))
                          }
                          placeholder="Comentário do Gestor"
                        />
                      </Field>

                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => saveReviewRow(execution.id, item.serviceId)}
                        >
                          <Save data-icon="inline-start" />
                          Salvar
                        </Button>
                        <Button
                          type="button"
                          variant={item.reviewCompleted ? "secondary" : "default"}
                          onClick={() => completeReview(execution.id, item.serviceId)}
                        >
                          {item.reviewCompleted ? (
                            <CheckCircle2 data-icon="inline-start" />
                          ) : (
                            <Save data-icon="inline-start" />
                          )}
                          {item.reviewCompleted ? "Concluída" : "Concluir"}
                        </Button>
                      </div>
                    </div>

                    {rowErrors[rowKey] && (
                      <p className="mt-3 text-sm text-destructive">
                        {rowErrors[rowKey]}
                      </p>
                    )}

                    {(item.observation || item.deviationReason) && (
                      <div className="mt-4 rounded-lg bg-muted/30 p-3 text-sm text-muted-foreground">
                        {item.deviationReason && (
                          <p>Motivo do desvio: {item.deviationReason}</p>
                        )}
                        {item.observation && <p>Observação: {item.observation}</p>}
                      </div>
                    )}

                    {(item.reviewHistory?.length ?? 0) > 0 && (
                      <div className="mt-4 rounded-lg border bg-muted/20 p-3">
                        <div className="mb-3 flex items-center gap-2 text-sm font-medium">
                          <History className="size-4" />
                          Histórico de correções
                        </div>
                        <div className="flex flex-col gap-2 text-sm text-muted-foreground">
                          {item.reviewHistory?.map((entry) => (
                            <div
                              key={entry.id}
                              className="rounded-lg border bg-background p-3"
                            >
                              <p className="font-medium text-foreground">
                                {entry.previousValue} para {entry.newValue}
                              </p>
                              <p>Motivo: {entry.reason}</p>
                              <p>
                                Data: {formatDateTimeBR(entry.changedAt)}
                              </p>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}

          {feedback && (
            <div className="mt-4 rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {feedback}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
