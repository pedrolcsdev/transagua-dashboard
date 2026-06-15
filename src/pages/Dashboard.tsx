import { useMemo, useState } from "react"
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  ListChecks,
  PackageOpen,
  RefreshCw,
  ShieldCheck,
  Truck,
  Users,
} from "lucide-react"

import { EmptyState } from "@/components/StateViews"
import { Badge } from "@/components/ui/badge"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  buildContractSummaries,
  buildReportRows,
  countPendingRequests,
  getLatestExecutionForContract,
  hasExecutionBelowGoal,
  hasWorkforceDivergence,
  numberFormatter,
  type ContractSummary,
  type ReportRow,
} from "@/lib/analytics"
import { getContractsForUser, loadContracts, type Contract } from "@/lib/contracts"
import { formatDateBR } from "@/lib/dates"
import {
  type DailyExecution,
  loadDailyExecutions,
} from "@/lib/daily-executions"
import type { AppUser } from "@/lib/profile"
import {
  type OperationalRequest,
  loadOperationalRequests,
} from "@/lib/requests"
import { cn } from "@/lib/utils"

const DASHBOARD_TOLERANCE = 5
const CRITICAL_PROGRESS_GAP = -15
const MAX_PRIORITIES = 5

type DashboardProps = {
  currentUser: AppUser
}

type DashboardPeriod = "today" | "week" | "total"
type OperationStatus = "critical" | "attention" | "stable"
type PriorityStatus = "critical" | "attention" | "pending"
type HealthStatus = "healthy" | "attention" | "critical" | "no-data"

type PriorityItem = {
  id: string
  title: string
  context: string
  reason: string
  status: PriorityStatus
  score: number
}

type ContractDecisionSnapshot = {
  summary: ContractSummary
  belowGoalRows: ReportRow[]
  hasWorkforceGap: boolean
  pendingRequests: OperationalRequest[]
  score: number
  status: PriorityStatus
  reasons: string[]
}

type ContractHealthItem = {
  contract: Contract
  status: HealthStatus
}

type LogisticPendingItem = {
  request: OperationalRequest
  contract?: Contract
  dueLabel: string
  dueTone: "danger" | "warning" | "neutral"
}

const operationStatusClassNames: Record<OperationStatus, string> = {
  critical: "border-red-200 bg-red-50 text-red-700",
  attention: "border-amber-200 bg-amber-50 text-amber-700",
  stable: "border-emerald-200 bg-emerald-50 text-emerald-700",
}

const operationStatusLabels: Record<OperationStatus, string> = {
  critical: "Crítico",
  attention: "Atenção",
  stable: "Estável",
}

const priorityStatusClassNames: Record<PriorityStatus, string> = {
  critical: "border-red-200 bg-red-50 text-red-700",
  attention: "border-amber-200 bg-amber-50 text-amber-700",
  pending: "border-sky-200 bg-sky-50 text-sky-700",
}

const priorityStatusLabels: Record<PriorityStatus, string> = {
  critical: "Crítico",
  attention: "Atenção",
  pending: "Pendente",
}

const healthLabels: Record<HealthStatus, string> = {
  healthy: "Saudáveis",
  attention: "Atenção",
  critical: "Críticos",
  "no-data": "Sem dados",
}

const healthClassNames: Record<HealthStatus, string> = {
  healthy: "bg-emerald-500",
  attention: "bg-amber-400",
  critical: "bg-red-500",
  "no-data": "bg-slate-300",
}

const dueToneClassNames: Record<LogisticPendingItem["dueTone"], string> = {
  danger: "border-red-200 bg-red-50 text-red-700",
  warning: "border-amber-200 bg-amber-50 text-amber-700",
  neutral: "border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]",
}

function isInPeriod(dateValue: string, period: DashboardPeriod) {
  if (!dateValue) {
    return false
  }

  const today = new Date()
  const date = new Date(`${dateValue}T00:00:00`)
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const diffDays = Math.floor(
    (todayStart.getTime() - date.getTime()) / 86_400_000
  )

  return period === "today" ? diffDays === 0 : diffDays >= 0 && diffDays < 7
}

function filterExecutionsByPeriod(
  executions: DailyExecution[],
  period: DashboardPeriod
) {
  if (period === "total") {
    return executions
  }

  return executions.filter((execution) => isInPeriod(execution.date, period))
}

function filterRequestsByPeriod(
  requests: OperationalRequest[],
  period: DashboardPeriod
) {
  if (period === "total") {
    return requests
  }

  return requests.filter((request) => isInPeriod(request.date, period))
}

function pluralize(count: number, singular: string, plural: string) {
  return count === 1 ? singular : plural
}

function joinReasons(reasons: string[]) {
  if (reasons.length <= 1) {
    return reasons[0] ?? "Monitorar evolução do contrato no período."
  }

  return `${reasons.slice(0, -1).join(", ")} e ${reasons[reasons.length - 1]}.`
}

function getContractDisplayContext(contract: Contract) {
  return contract.team ? `${contract.team} · ${contract.client}` : contract.client
}

function getDueStatus(dateValue: string): LogisticPendingItem["dueLabel"] {
  const today = new Date()
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const dueDate = new Date(`${dateValue}T00:00:00`)
  const diffDays = Math.ceil(
    (dueDate.getTime() - todayStart.getTime()) / 86_400_000
  )

  if (Number.isNaN(dueDate.getTime())) {
    return "Sem data"
  }

  if (diffDays < 0) {
    return `${Math.abs(diffDays)} ${pluralize(Math.abs(diffDays), "dia", "dias")} em atraso`
  }

  if (diffDays === 0) {
    return "Entrega hoje"
  }

  if (diffDays === 1) {
    return "Entrega amanhã"
  }

  return `Entrega em ${diffDays} dias`
}

function getDueTone(dateValue: string): LogisticPendingItem["dueTone"] {
  const today = new Date()
  const todayStart = new Date(
    today.getFullYear(),
    today.getMonth(),
    today.getDate()
  )
  const dueDate = new Date(`${dateValue}T00:00:00`)
  const diffDays = Math.ceil(
    (dueDate.getTime() - todayStart.getTime()) / 86_400_000
  )

  if (Number.isNaN(dueDate.getTime())) {
    return "neutral"
  }

  if (diffDays <= 1) {
    return "danger"
  }

  if (diffDays <= 3) {
    return "warning"
  }

  return "neutral"
}

function buildContractSnapshot(
  summary: ContractSummary,
  rows: ReportRow[],
  requests: OperationalRequest[],
  periodExecutions: DailyExecution[]
): ContractDecisionSnapshot {
  const contract = summary.contract
  const belowGoalRows = rows.filter(
    (row) => row.contractId === contract.id && row.status === "red"
  )
  const pendingRequests = requests.filter(
    (request) =>
      request.contractId === contract.id && request.status === "pendente"
  )
  const latestExecution = getLatestExecutionForContract(
    contract.id,
    periodExecutions
  )
  const hasWorkforceGap = latestExecution
    ? hasWorkforceDivergence(latestExecution)
    : false
  const isDelayed = summary.progressGap < -DASHBOARD_TOLERANCE
  const isCriticalDelay = summary.progressGap <= CRITICAL_PROGRESS_GAP
  const reasons: string[] = []

  if (isDelayed) {
    reasons.push(
      `${numberFormatter.format(Math.abs(summary.progressGap))}% abaixo do cronograma esperado`
    )
  }

  if (belowGoalRows.length > 0) {
    reasons.push(
      `${belowGoalRows.length} ${pluralize(
        belowGoalRows.length,
        "equipe abaixo da meta",
        "equipes abaixo da meta"
      )}`
    )
  }

  if (hasWorkforceGap) {
    reasons.push("efetivo diferente do planejado")
  }

  if (pendingRequests.length > 0) {
    reasons.push(
      `${pendingRequests.length} ${pluralize(
        pendingRequests.length,
        "solicitação pendente",
        "solicitações pendentes"
      )}`
    )
  }

  const combinedSignals =
    Number(isDelayed) +
    Number(belowGoalRows.length > 0) +
    Number(hasWorkforceGap) +
    Number(pendingRequests.length > 0)

  const score =
    Math.max(0, Math.abs(Math.min(summary.progressGap, 0))) * 3 +
    belowGoalRows.length * 12 +
    pendingRequests.length * 8 +
    (hasWorkforceGap ? 10 : 0) +
    (isCriticalDelay ? 24 : 0) +
    (combinedSignals >= 2 ? 14 : 0)

  const status: PriorityStatus =
    isCriticalDelay || (isDelayed && combinedSignals >= 2)
      ? "critical"
      : isDelayed || belowGoalRows.length > 0 || hasWorkforceGap
        ? "attention"
        : "pending"

  return {
    summary,
    belowGoalRows,
    hasWorkforceGap,
    pendingRequests,
    score,
    status,
    reasons,
  }
}

function getDashboardData(currentUser: AppUser, period: DashboardPeriod) {
  const contracts = getContractsForUser(loadContracts(), currentUser)
  const allowedContractIds = new Set(contracts.map((contract) => contract.id))
  const allExecutions = loadDailyExecutions().filter((execution) =>
    allowedContractIds.has(execution.contractId)
  )
  const periodExecutions = filterExecutionsByPeriod(allExecutions, period)
  const requests = filterRequestsByPeriod(
    loadOperationalRequests().filter((request) =>
      allowedContractIds.has(request.contractId)
    ),
    period
  )
  const summaries = buildContractSummaries(contracts, allExecutions)
  const rows = buildReportRows(contracts, periodExecutions)
  const activeContracts = contracts.filter(
    (contract) => contract.status === "ativo"
  )
  const activeSummaries = summaries.filter(
    (summary) => summary.contract.status === "ativo"
  )
  const delayedContracts = activeSummaries.filter(
    (summary) => summary.progressGap < -DASHBOARD_TOLERANCE
  )
  const criticalDelayedContracts = delayedContracts.filter(
    (summary) => summary.progressGap <= CRITICAL_PROGRESS_GAP
  )
  const contractsBelowGoal = activeContracts.filter((contract) => {
    const latestExecution = getLatestExecutionForContract(
      contract.id,
      periodExecutions
    )
    return latestExecution ? hasExecutionBelowGoal(latestExecution, contract) : false
  })
  const workforceDivergenceContracts = activeContracts.filter((contract) => {
    const latestExecution = getLatestExecutionForContract(
      contract.id,
      periodExecutions
    )
    return latestExecution ? hasWorkforceDivergence(latestExecution) : false
  })
  const pendingRequests = countPendingRequests(requests)
  const delayedContractIds = new Set(
    delayedContracts.map((summary) => summary.contract.id)
  )
  const delayedRequests = requests.filter(
    (request) =>
      request.status === "pendente" && delayedContractIds.has(request.contractId)
  )
  const contractSnapshots = activeSummaries
    .map((summary) =>
      buildContractSnapshot(summary, rows, requests, periodExecutions)
    )
    .filter((snapshot) => snapshot.score > 0)
    .sort((a, b) => b.score - a.score)
  const actionRequiredContracts = contractSnapshots.filter(
    (snapshot) => snapshot.status === "critical"
  ).length

  const contractPriorities: PriorityItem[] = contractSnapshots.map((snapshot) => ({
    id: `contract-${snapshot.summary.contract.id}`,
    title: snapshot.summary.contract.name,
    context: getContractDisplayContext(snapshot.summary.contract),
    reason: joinReasons(snapshot.reasons),
    status: snapshot.status,
    score: snapshot.score,
  }))

  const requestPriorities: PriorityItem[] = requests
    .filter((request) => request.status === "pendente")
    .map((request) => {
      const summary = activeSummaries.find(
        (item) => item.contract.id === request.contractId
      )
      const contract = summary?.contract
      const isLinkedToDelay = summary
        ? summary.progressGap < -DASHBOARD_TOLERANCE
        : false

      return {
        id: `request-${request.id}`,
        title: request.title || "Solicitação operacional",
        context: contract
          ? `${contract.name} · ${formatDateBR(request.date)}`
          : formatDateBR(request.date),
        reason: isLinkedToDelay
          ? "Solicitação pendente vinculada a contrato atrasado."
          : "Solicitação pendente aguardando encaminhamento.",
        status: isLinkedToDelay ? "attention" : "pending",
        score: isLinkedToDelay ? 34 : 12,
      }
    })

  const priorities = [...contractPriorities, ...requestPriorities]
    .sort((a, b) => b.score - a.score)
    .slice(0, MAX_PRIORITIES)

  const healthItems: ContractHealthItem[] = activeContracts.map((contract) => {
    const summary = activeSummaries.find((item) => item.contract.id === contract.id)
    const latestExecution = getLatestExecutionForContract(contract.id, allExecutions)
    const snapshot = contractSnapshots.find(
      (item) => item.summary.contract.id === contract.id
    )

    if (!summary || !latestExecution) {
      return { contract, status: "no-data" }
    }

    if (
      summary.progressGap <= CRITICAL_PROGRESS_GAP ||
      snapshot?.status === "critical"
    ) {
      return { contract, status: "critical" }
    }

    if (
      summary.progressGap < -DASHBOARD_TOLERANCE ||
      snapshot?.status === "attention" ||
      snapshot?.status === "pending"
    ) {
      return { contract, status: "attention" }
    }

    return { contract, status: "healthy" }
  })

  const healthCounts = healthItems.reduce<Record<HealthStatus, number>>(
    (totals, item) => ({
      ...totals,
      [item.status]: totals[item.status] + 1,
    }),
    {
      healthy: 0,
      attention: 0,
      critical: 0,
      "no-data": 0,
    }
  )

  const pendingLogistics: LogisticPendingItem[] = requests
    .filter((request) => request.status === "pendente")
    .slice()
    .sort((a, b) => a.date.localeCompare(b.date))
    .slice(0, 4)
    .map((request) => ({
      request,
      contract: contracts.find((contract) => contract.id === request.contractId),
      dueLabel: getDueStatus(request.date),
      dueTone: getDueTone(request.date),
    }))

  const contractsOnTrack = Math.max(
    0,
    activeContracts.length - delayedContracts.length
  )
  const largestImpact = contractSnapshots[0]
  const workforceImpactCount = workforceDivergenceContracts.filter((contract) =>
    delayedContractIds.has(contract.id)
  ).length
  const latestExecutionDate = allExecutions
    .map((execution) => execution.date)
    .filter(Boolean)
    .sort()
    .at(-1)
  const pendingReviewItems = periodExecutions.reduce(
    (total, execution) =>
      total +
      execution.items.filter((item) => !item.reviewCompleted).length,
    0
  )

  const operationStatus: OperationStatus =
    criticalDelayedContracts.length > 0 || actionRequiredContracts > 0
      ? "critical"
      : priorities.length > 0 || pendingRequests > 0
        ? "attention"
        : "stable"

  const operationSummary =
    operationStatus === "stable"
      ? "Operação dentro do esperado: contratos no ritmo e sem prioridades críticas no período."
      : operationStatus === "critical"
        ? `Operação crítica: ${criticalDelayedContracts.length || actionRequiredContracts} ${pluralize(
            criticalDelayedContracts.length || actionRequiredContracts,
            "contrato exige",
            "contratos exigem"
          )} ação imediata, ${contractsBelowGoal.length} ${pluralize(
            contractsBelowGoal.length,
            "equipe abaixo da meta",
            "equipes abaixo da meta"
          )} e ${pendingRequests} ${pluralize(
            pendingRequests,
            "solicitação pendente",
            "solicitações pendentes"
          )}.`
        : `Operação em atenção: ${delayedContracts.length} ${pluralize(
            delayedContracts.length,
            "contrato atrasado",
            "contratos atrasados"
          )}, ${contractsBelowGoal.length} ${pluralize(
            contractsBelowGoal.length,
            "equipe abaixo da meta",
            "equipes abaixo da meta"
          )} e ${pendingRequests} ${pluralize(
            pendingRequests,
            "solicitação pendente",
            "solicitações pendentes"
          )}.`

  return {
    summaries,
    activeContracts: activeContracts.length,
    delayedContracts,
    criticalDelayedContracts,
    actionRequiredContracts,
    contractsBelowGoal,
    workforceDivergenceContracts,
    workforceImpactCount,
    pendingRequests,
    delayedRequests,
    contractsOnTrack,
    priorities,
    contractSnapshots,
    healthCounts,
    pendingLogistics,
    largestImpact,
    latestExecutionDate,
    pendingReviewItems,
    operationStatus,
    operationSummary,
  }
}

export function Dashboard({ currentUser }: DashboardProps) {
  const [period, setPeriod] = useState<DashboardPeriod>("week")
  const data = useMemo(
    () => getDashboardData(currentUser, period),
    [currentUser, period]
  )

  const periodLabel =
    period === "today"
      ? "hoje"
      : period === "week"
        ? "últimos 7 dias"
        : "total"

  const largestImpactText = data.largestImpact
    ? data.largestImpact.summary.contract.name
    : "sem impacto relevante"
  const decisionPriorities = data.contractSnapshots.slice(0, MAX_PRIORITIES)
  const totalHealthContracts = Math.max(data.activeContracts, 1)
  const healthyPercentage = Math.round(
    (data.healthCounts.healthy / totalHealthContracts) * 100
  )
  const hasActiveContracts = data.activeContracts > 0
  const healthGradient = `conic-gradient(#10b981 0 ${data.healthCounts.healthy / totalHealthContracts * 100}%, #f59e0b ${data.healthCounts.healthy / totalHealthContracts * 100}% ${(data.healthCounts.healthy + data.healthCounts.attention) / totalHealthContracts * 100}%, #ef4444 ${(data.healthCounts.healthy + data.healthCounts.attention) / totalHealthContracts * 100}% ${(data.healthCounts.healthy + data.healthCounts.attention + data.healthCounts.critical) / totalHealthContracts * 100}%, #cbd5e1 ${(data.healthCounts.healthy + data.healthCounts.attention + data.healthCounts.critical) / totalHealthContracts * 100}% 100%)`
  const topPriority = decisionPriorities[0]

  return (
    <div className="flex flex-col gap-4">
      <section className="rounded-xl border border-[var(--border-color)] bg-[var(--card-bg)] px-4 py-4 shadow-[0_14px_34px_-30px_rgba(15,23,42,0.28)] md:px-5">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_auto] xl:items-center">
          <div>
            <div className="flex flex-wrap items-center gap-2 text-sm text-[var(--text-secondary)]">
              <Badge
                variant="outline"
                className={operationStatusClassNames[data.operationStatus]}
              >
                {operationStatusLabels[data.operationStatus]}
              </Badge>
              <span className="font-medium">Dashboard operacional</span>
              <span className="hidden text-[var(--text-muted)] sm:inline">•</span>
              <span className="inline-flex items-center gap-1">
                <RefreshCw className="size-3.5" aria-hidden="true" />
                Atualizado em{" "}
                {data.latestExecutionDate
                  ? formatDateBR(data.latestExecutionDate)
                  : "sem registro"}
              </span>
            </div>
            <h1 className="mt-2 text-2xl font-semibold tracking-tight text-[var(--text-primary)] md:text-3xl">
              Centro de decisão operacional
            </h1>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(["today", "week", "total"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={cn(
                  "h-9 rounded-lg border px-3 text-xs font-semibold transition active:translate-y-px",
                  period === option
                    ? "border-[var(--accent-color)] bg-[var(--accent-color)] text-[var(--accent-contrast)]"
                    : "border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                )}
              >
                {option === "today"
                  ? "Hoje"
                  : option === "week"
                    ? "7 dias"
                    : "Total"}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-4 grid gap-3 md:grid-cols-3">
          <div
            className={cn(
              "rounded-lg border px-4 py-3",
              data.healthCounts.critical > 0
                ? "border-red-100 bg-red-50"
                : "border-[var(--border-color)] bg-[var(--bg-secondary)]"
            )}
          >
            <p
              className={cn(
                "flex items-center gap-2 text-xs font-semibold uppercase",
                data.healthCounts.critical > 0
                  ? "text-red-700"
                  : "text-[var(--text-secondary)]"
              )}
            >
              <AlertTriangle className="size-4" aria-hidden="true" />
              Contratos críticos
            </p>
            <p
              className={cn(
                "mt-2 font-mono text-3xl font-semibold",
                data.healthCounts.critical > 0
                  ? "text-red-700"
                  : "text-[var(--text-primary)]"
              )}
            >
              {data.healthCounts.critical}
            </p>
            <p
              className={cn(
                "text-sm",
                data.healthCounts.critical > 0
                  ? "text-red-700/80"
                  : "text-[var(--text-secondary)]"
              )}
            >
              {data.actionRequiredContracts} com ação imediata
            </p>
          </div>
          <div
            className={cn(
              "rounded-lg border px-4 py-3",
              data.contractsBelowGoal.length > 0
                ? "border-amber-100 bg-amber-50"
                : "border-[var(--border-color)] bg-[var(--bg-secondary)]"
            )}
          >
            <p
              className={cn(
                "flex items-center gap-2 text-xs font-semibold uppercase",
                data.contractsBelowGoal.length > 0
                  ? "text-amber-800"
                  : "text-[var(--text-secondary)]"
              )}
            >
              <Users className="size-4" aria-hidden="true" />
              Equipes abaixo da meta
            </p>
            <p
              className={cn(
                "mt-2 font-mono text-3xl font-semibold",
                data.contractsBelowGoal.length > 0
                  ? "text-amber-800"
                  : "text-[var(--text-primary)]"
              )}
            >
              {data.contractsBelowGoal.length}
            </p>
            <p
              className={cn(
                "truncate text-sm",
                data.contractsBelowGoal.length > 0
                  ? "text-amber-800/80"
                  : "text-[var(--text-secondary)]"
              )}
            >
              Maior impacto: {largestImpactText}
            </p>
          </div>
          <div className="rounded-lg border border-[var(--border-color)] bg-[var(--bg-secondary)] px-4 py-3">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase text-[var(--text-secondary)]">
              <PackageOpen className="size-4" aria-hidden="true" />
              Solicitações pendentes
            </p>
            <p className="mt-2 font-mono text-3xl font-semibold text-[var(--text-primary)]">
              {data.pendingRequests}
            </p>
            <p className="text-sm text-[var(--text-secondary)]">
              {data.delayedRequests.length} em contratos atrasados
            </p>
          </div>
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1.35fr)_minmax(22rem,0.65fr)]">
        <Card className="border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_18px_42px_-32px_rgba(15,23,42,0.35)]">
          <CardHeader className="grid gap-2 border-b border-[var(--border-subtle)] sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
                <AlertTriangle
                  aria-hidden="true"
                  className="size-5 text-red-600"
                />
                Prioridades de hoje
              </CardTitle>
              <CardDescription className="text-[var(--text-secondary)]">
                Contratos ranqueados por desvio, meta, efetivo e pendências.
              </CardDescription>
            </div>
            <Badge className="w-fit border-[var(--border-color)] bg-[var(--bg-secondary)] text-[var(--text-primary)]">
              {periodLabel}
            </Badge>
          </CardHeader>
          <CardContent className="p-0">
            {decisionPriorities.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Sem prioridades imediatas"
                description="Não há atrasos, metas críticas ou solicitações pendentes para este período."
              />
            ) : (
              decisionPriorities.map((snapshot, index) => (
                <div
                  key={snapshot.summary.contract.id}
                  className="grid gap-3 border-b border-[var(--border-subtle)] px-4 py-4 last:border-b-0 lg:grid-cols-[3rem_minmax(0,1fr)_7rem_7rem_7rem_6rem] lg:items-center"
                >
                  <span
                    className={cn(
                      "flex size-9 items-center justify-center rounded-lg font-mono text-sm font-semibold ring-1",
                      snapshot.status === "critical"
                        ? "bg-red-50 text-red-700 ring-red-200"
                        : "bg-amber-50 text-amber-800 ring-amber-200"
                    )}
                  >
                    {index + 1}
                  </span>
                  <div className="min-w-0 space-y-1">
                    <p className="font-semibold text-[var(--text-primary)]">
                      {snapshot.summary.contract.name}
                    </p>
                    <p className="text-sm text-[var(--text-secondary)]">
                      {getContractDisplayContext(snapshot.summary.contract)}
                    </p>
                    <p className="text-sm text-[var(--text-primary)] lg:hidden">
                      {joinReasons(snapshot.reasons)}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Desvio</p>
                    <p className="font-mono font-semibold text-red-700">
                      {numberFormatter.format(snapshot.summary.progressGap)}%
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Meta</p>
                    <p className="font-mono font-semibold text-[var(--text-primary)]">
                      {snapshot.belowGoalRows.length}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-secondary)]">Pendências</p>
                    <p className="font-mono font-semibold text-[var(--text-primary)]">
                      {snapshot.pendingRequests.length}
                    </p>
                  </div>
                  <div className="flex lg:justify-end">
                    <Badge
                      variant="outline"
                      className={priorityStatusClassNames[snapshot.status]}
                    >
                      {priorityStatusLabels[snapshot.status]}
                    </Badge>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_18px_42px_-32px_rgba(15,23,42,0.35)]">
          <CardHeader className="border-b border-[var(--border-subtle)]">
            <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
              <ShieldCheck className="size-5 text-[var(--accent-color)]" aria-hidden="true" />
              Saúde da operação
            </CardTitle>
            <CardDescription className="text-[var(--text-secondary)]">
              Visão geral dos contratos ativos.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 pt-4">
            <div className="grid grid-cols-[8rem_1fr] items-center gap-4">
              <div
                className="relative size-32 rounded-full"
                style={{ background: healthGradient }}
                aria-label={`${healthyPercentage}% dos contratos saudáveis`}
              >
                <div className="absolute inset-4 grid place-items-center rounded-full bg-[var(--card-bg)] text-center ring-1 ring-[var(--border-subtle)]">
                  <span className="font-mono text-2xl font-semibold text-[var(--text-primary)]">
                    {hasActiveContracts ? `${healthyPercentage}%` : "N/D"}
                  </span>
                  <span className="text-xs text-[var(--text-secondary)]">saudável</span>
                </div>
              </div>
              <div className="grid gap-2">
                {(["healthy", "attention", "critical", "no-data"] as const).map(
                  (status) => (
                    <div
                      key={status}
                      className="grid grid-cols-[1rem_1fr_auto] items-center gap-2 text-sm"
                    >
                      <span
                        className={cn("size-2.5 rounded-full", healthClassNames[status])}
                      />
                      <span className="text-[var(--text-secondary)]">
                        {healthLabels[status]}
                      </span>
                      <strong className="font-mono text-[var(--text-primary)]">
                        {data.healthCounts[status]}
                      </strong>
                    </div>
                  )
                )}
              </div>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
              <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                Próxima ação
              </p>
              <p className="mt-2 text-sm font-medium text-[var(--text-primary)]">
                {topPriority
                  ? topPriority.summary.contract.name
                  : "Acompanhar rotina operacional"}
              </p>
              <p className="mt-1 text-sm text-[var(--text-secondary)]">
                {topPriority
                  ? joinReasons(topPriority.reasons)
                  : "Sem contratos críticos no período selecionado."}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
        <Card className="border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_18px_42px_-32px_rgba(15,23,42,0.35)]">
          <CardHeader className="border-b border-[var(--border-subtle)]">
            <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
              <Truck className="size-5 text-[var(--accent-color)]" aria-hidden="true" />
              Pendências logísticas
            </CardTitle>
            <CardDescription className="text-[var(--text-secondary)]">
              Solicitações pendentes ordenadas pela data de entrega.
            </CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            {data.pendingLogistics.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Sem pendências logísticas"
                description="Não há solicitações pendentes no período selecionado."
              />
            ) : (
              data.pendingLogistics.map(({ request, contract, dueLabel, dueTone }) => (
                <div
                  key={request.id}
                  className="grid gap-2 border-b border-[var(--border-subtle)] px-4 py-3 last:border-b-0 sm:grid-cols-[minmax(0,1fr)_auto]"
                >
                  <div className="min-w-0">
                    <p className="font-medium text-[var(--text-primary)]">
                      {request.title || "Solicitação operacional"}
                    </p>
                    <p className="truncate text-sm text-[var(--text-secondary)]">
                      {contract?.name ?? "Contrato não encontrado"}
                    </p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                    <Badge variant="outline" className={dueToneClassNames[dueTone]}>
                      {dueLabel}
                    </Badge>
                    <span className="inline-flex items-center gap-1 text-sm text-[var(--text-secondary)]">
                      <Clock3 className="size-3.5" aria-hidden="true" />
                      {formatDateBR(request.date)}
                    </span>
                  </div>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_18px_42px_-32px_rgba(15,23,42,0.35)]">
          <CardHeader className="border-b border-[var(--border-subtle)]">
            <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
              <ListChecks className="size-5 text-[var(--accent-color)]" aria-hidden="true" />
              Resumo operacional
            </CardTitle>
            <CardDescription className="text-[var(--text-secondary)]">
              Sinais que ajudam a priorizar a rotina do coordenador.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 pt-4 sm:grid-cols-2">
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
              <p className="text-sm text-[var(--text-secondary)]">No ritmo</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-[var(--text-primary)]">
                {data.contractsOnTrack}/{data.activeContracts}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
              <p className="text-sm text-[var(--text-secondary)]">Efetivo divergente</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-[var(--text-primary)]">
                {data.workforceDivergenceContracts.length}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
              <p className="text-sm text-[var(--text-secondary)]">Itens a revisar</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-[var(--text-primary)]">
                {data.pendingReviewItems}
              </p>
            </div>
            <div className="rounded-lg border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3">
              <p className="text-sm text-[var(--text-secondary)]">Fora do esperado</p>
              <p className="mt-1 font-mono text-2xl font-semibold text-red-700">
                {data.delayedContracts.length}
              </p>
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
