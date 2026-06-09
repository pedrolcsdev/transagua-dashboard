import { useMemo, useState } from "react"
import {
  AlertTriangle,
  Briefcase,
  CheckCircle2,
  ClipboardList,
  Gauge,
  PackageOpen,
  TrendingDown,
  Users,
} from "lucide-react"

import { MetricCard } from "@/components/MetricCard"
import { HorizontalBarChart } from "@/components/SimpleCharts"
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

  const contractsOnTrack = Math.max(
    0,
    activeContracts.length - delayedContracts.length
  )
  const largestImpact = contractSnapshots[0]
  const workforceImpactCount = workforceDivergenceContracts.filter((contract) =>
    delayedContractIds.has(contract.id)
  ).length

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
    largestImpact,
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

  const rhythmItems = data.summaries
    .filter((summary) => summary.contract.status === "ativo")
    .slice()
    .sort((a, b) => a.progressGap - b.progressGap)
    .slice(0, 5)
    .map((summary) => ({
      label: summary.contract.name,
      value: Math.max(0, Math.min(100, summary.percentExecuted)),
      helper: `${numberFormatter.format(summary.percentExecuted)}% executado · ${numberFormatter.format(summary.expectedProgress)}% esperado`,
    }))

  const largestImpactText = data.largestImpact
    ? data.largestImpact.summary.contract.name
    : "sem impacto relevante"

  return (
    <div className="flex flex-col gap-4">
      <section className="overflow-hidden rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_18px_42px_-32px_rgba(15,23,42,0.35)]">
        <div className="grid gap-4 border-b border-[var(--border-subtle)] px-5 py-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <Badge
                variant="outline"
                className={operationStatusClassNames[data.operationStatus]}
              >
                {operationStatusLabels[data.operationStatus]}
              </Badge>
              <p className="text-sm font-medium text-[var(--text-secondary)]">
                Painel operacional · {periodLabel}
              </p>
            </div>
            <h1 className="mt-3 max-w-5xl text-2xl font-semibold leading-tight tracking-tight text-[var(--text-primary)] md:text-3xl">
              {data.operationSummary}
            </h1>
            <p className="mt-2 text-sm text-[var(--text-secondary)]">
              Olá, {currentUser.name}. Priorize os contratos com atraso,
              execução abaixo da meta e efetivo diferente do planejado.
            </p>
          </div>

          <div className="flex w-fit items-center gap-1 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-primary)] p-1">
            {(["today", "week", "total"] as const).map((option) => (
              <button
                key={option}
                type="button"
                onClick={() => setPeriod(option)}
                className={cn(
                  "h-8 rounded-lg px-3 text-xs font-semibold transition active:translate-y-px",
                  period === option
                    ? "bg-[var(--accent-color)] text-[var(--accent-contrast)] shadow-[0_8px_18px_var(--shadow-color)]"
                    : "text-[var(--text-secondary)] hover:bg-[var(--bg-elevated)] hover:text-[var(--text-primary)]"
                )}
              >
                {option === "today"
                  ? "Hoje"
                  : option === "week"
                    ? "Semana"
                    : "Total"}
              </button>
            ))}
          </div>
        </div>

        <div className="grid gap-px bg-[var(--border-subtle)] md:grid-cols-2 xl:grid-cols-5">
          <MetricCard
            title="Contratos atrasados"
            description={`${data.actionRequiredContracts} ${pluralize(
              data.actionRequiredContracts,
              "exige ação imediata",
              "exigem ação imediata"
            )}`}
            value={data.delayedContracts.length}
            icon={TrendingDown}
            tone={data.delayedContracts.length > 0 ? "danger" : "default"}
            className="rounded-none border-0 shadow-none ring-0 hover:translate-y-0"
          />

          <MetricCard
            title="Solicitações pendentes"
            description={`${data.delayedRequests.length} vinculadas a contratos atrasados`}
            value={data.pendingRequests}
            icon={PackageOpen}
            tone={data.pendingRequests > 0 ? "warning" : "default"}
            className="rounded-none border-0 shadow-none ring-0 hover:translate-y-0"
          />

          <MetricCard
            title="Efetivo diferente do planejado"
            description={`Impacta ${data.workforceImpactCount} ${pluralize(
              data.workforceImpactCount,
              "contrato atrasado",
              "contratos atrasados"
            )}`}
            value={data.workforceDivergenceContracts.length}
            icon={Users}
            tone={
              data.workforceDivergenceContracts.length > 0 ? "warning" : "default"
            }
            className="rounded-none border-0 shadow-none ring-0 hover:translate-y-0"
          />

          <MetricCard
            title="Equipes abaixo da meta"
            description={`Maior impacto: ${largestImpactText}`}
            value={data.contractsBelowGoal.length}
            icon={ClipboardList}
            tone={data.contractsBelowGoal.length > 0 ? "danger" : "default"}
            className="rounded-none border-0 shadow-none ring-0 hover:translate-y-0"
          />

          <MetricCard
            title="Ritmo da operação"
            description={`${data.contractsOnTrack} no ritmo · ${data.delayedContracts.length} fora do esperado`}
            value={`${data.contractsOnTrack}/${data.activeContracts}`}
            icon={Gauge}
            tone={data.delayedContracts.length > 0 ? "warning" : "positive"}
            className="rounded-none border-0 shadow-none ring-0 hover:translate-y-0"
          />
        </div>
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.35fr_0.65fr]">
        <Card className="border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_18px_42px_-32px_rgba(15,23,42,0.35)]">
          <CardHeader className="grid gap-2 border-b border-[var(--border-subtle)] sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-base text-[var(--text-primary)]">
                <AlertTriangle className="size-5 text-[var(--accent-color)]" />
                Atenção imediata
              </CardTitle>
              <CardDescription className="text-[var(--text-secondary)]">
                Prioridades ranqueadas por atraso, meta, efetivo e solicitações.
              </CardDescription>
            </div>
            <Badge className="w-fit border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--accent-color)]">
              até {MAX_PRIORITIES} itens
            </Badge>
          </CardHeader>
          <CardContent className="flex flex-col gap-2 pt-4">
            {data.priorities.length === 0 ? (
              <EmptyState
                icon={CheckCircle2}
                title="Sem prioridades imediatas"
                description="Não há atrasos, metas críticas ou solicitações pendentes para este período."
              />
            ) : (
              data.priorities.map((priority, index) => (
                <div
                  key={priority.id}
                  className="grid gap-3 rounded-xl border border-[var(--border-subtle)] bg-[var(--bg-secondary)] p-3 md:grid-cols-[auto_minmax(0,1fr)_auto] md:items-start"
                >
                  <span className="flex size-8 items-center justify-center rounded-lg bg-[var(--card-bg)] font-mono text-sm font-semibold text-[var(--text-primary)] ring-1 ring-[var(--border-color)]">
                    {index + 1}
                  </span>
                  <div className="min-w-0">
                    <p className="truncate font-semibold text-[var(--text-primary)]">
                      {priority.title}
                    </p>
                    <p className="text-xs text-[var(--text-secondary)]">{priority.context}</p>
                    <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">
                      {priority.reason}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={cn(
                      "w-fit",
                      priorityStatusClassNames[priority.status]
                    )}
                  >
                    {priorityStatusLabels[priority.status]}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_18px_42px_-32px_rgba(15,23,42,0.35)]">
          <CardHeader className="border-b border-[var(--border-subtle)]">
            <CardTitle className="text-base text-[var(--text-primary)]">
              Próxima ação sugerida
            </CardTitle>
            <CardDescription className="text-[var(--text-secondary)]">
              Leitura resumida para orientar a coordenação.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3 pt-4">
            {data.priorities[0] ? (
              <>
                <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
                  <p className="text-xs font-semibold uppercase text-[var(--text-secondary)]">
                    Priorizar agora
                  </p>
                  <p className="mt-2 font-semibold text-[var(--text-primary)]">
                    {data.priorities[0].title}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-[var(--text-primary)]">
                    {data.priorities[0].reason}
                  </p>
                </div>
                <p className="text-sm leading-relaxed text-[var(--text-secondary)]">
                  A ordem considera desvio de cronograma, execução abaixo da
                  meta, efetivo e solicitações pendentes no mesmo contexto.
                </p>
              </>
            ) : (
              <EmptyState
                icon={CheckCircle2}
                title="Acompanhar rotina"
                description="A operação não indica ação emergencial no período selecionado."
              />
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_18px_42px_-32px_rgba(15,23,42,0.35)]">
        <CardHeader className="grid gap-2 border-b border-[var(--border-subtle)] sm:grid-cols-[1fr_auto] sm:items-start">
          <div>
            <CardTitle className="text-base text-[var(--text-primary)]">
              Ritmo da operação
            </CardTitle>
            <CardDescription className="text-[var(--text-secondary)]">
              Contratos ativos mais fora do esperado, do maior atraso ao menor.
            </CardDescription>
          </div>
          <Badge className="w-fit border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--accent-color)]">
            {data.contractsOnTrack} de {data.activeContracts} no ritmo
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 pt-4 lg:grid-cols-[0.9fr_1.1fr]">
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
            <p className="text-sm text-[var(--text-secondary)]">Resumo do ritmo</p>
            <p className="mt-3 font-mono text-4xl font-semibold tracking-tight text-[var(--text-primary)]">
              {data.contractsOnTrack}/{data.activeContracts}
            </p>
            <p className="mt-2 text-sm leading-relaxed text-[var(--text-secondary)]">
              Contratos ativos dentro do esperado contra o cronograma geral.
              Os desvios relevantes aparecem como prioridades quando combinados
              com meta, efetivo ou solicitações.
            </p>
          </div>
          <div className="rounded-xl border border-[var(--border-color)] bg-[var(--bg-secondary)] p-4">
            {rhythmItems.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="Sem contratos para comparar"
                description="Os contratos ativos aparecerão aqui com sua situação de ritmo."
              />
            ) : (
              <HorizontalBarChart items={rhythmItems} />
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
