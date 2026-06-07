import {
  AlertTriangle,
  Briefcase,
  CalendarDays,
  ClipboardList,
  PackageOpen,
  TrendingDown,
  TrendingUp,
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
  getPerformanceLabel,
  getStatusClassName,
  hasExecutionBelowGoal,
  hasWorkforceDivergence,
  numberFormatter,
} from "@/lib/analytics"
import { getContractsForUser, loadContracts } from "@/lib/contracts"
import { loadDailyExecutions } from "@/lib/daily-executions"
import type { AppUser } from "@/lib/profile"
import { loadOperationalRequests } from "@/lib/requests"

const DASHBOARD_TOLERANCE = 5

type DashboardProps = {
  currentUser: AppUser
}

function getDashboardData(currentUser: AppUser) {
  const contracts = getContractsForUser(loadContracts(), currentUser)
  const allowedContractIds = new Set(contracts.map((contract) => contract.id))
  const executions = loadDailyExecutions().filter((execution) =>
    allowedContractIds.has(execution.contractId)
  )
  const requests = loadOperationalRequests().filter((request) =>
    allowedContractIds.has(request.contractId)
  )
  const summaries = buildContractSummaries(contracts, executions)
  const rows = buildReportRows(contracts, executions)
  const activeContracts = contracts.filter(
    (contract) => contract.status === "ativo"
  )
  const delayedContracts = summaries.filter(
    (summary) =>
      summary.contract.status === "ativo" &&
      summary.progressGap < -DASHBOARD_TOLERANCE
  )
  const aheadContracts = summaries.filter(
    (summary) =>
      summary.contract.status === "ativo" &&
      summary.progressGap > DASHBOARD_TOLERANCE
  )
  const contractsBelowGoal = activeContracts.filter((contract) => {
    const latestExecution = getLatestExecutionForContract(contract.id, executions)
    return latestExecution ? hasExecutionBelowGoal(latestExecution, contract) : false
  })
  const workforceDivergenceContracts = activeContracts.filter((contract) => {
    const latestExecution = getLatestExecutionForContract(contract.id, executions)
    return latestExecution ? hasWorkforceDivergence(latestExecution) : false
  })
  const pendingRequests = countPendingRequests(requests)

  const alerts = [
    ...rows
      .filter((row) => row.status === "red")
      .slice(0, 3)
      .map((row) => ({
        id: row.id,
        title: row.serviceName,
        description: `${row.contractName} · ${row.date}`,
        badgeLabel: getPerformanceLabel(row.status),
        badgeClassName: getStatusClassName(row.status),
      })),
    ...delayedContracts.slice(0, 2).map((summary) => ({
      id: `delay-${summary.contract.id}`,
      title: summary.contract.name,
      description: `Atrasado ${numberFormatter.format(Math.abs(summary.progressGap))}% frente ao esperado`,
      badgeLabel: "Contrato atrasado",
      badgeClassName: "border-red-200 bg-red-50 text-red-700",
    })),
    ...workforceDivergenceContracts.slice(0, 2).map((contract) => ({
      id: `workforce-${contract.id}`,
      title: contract.name,
      description:
        "Último lançamento com divergência entre efetivo planejado e realizado",
      badgeLabel: "Efetivo divergente",
      badgeClassName: "border-amber-200 bg-amber-50 text-amber-700",
    })),
  ].slice(0, 6)

  return {
    summaries,
    activeContracts: activeContracts.length,
    delayedContracts,
    aheadContracts,
    contractsBelowGoal,
    workforceDivergenceContracts,
    pendingRequests,
    alerts,
  }
}

export function Dashboard({ currentUser }: DashboardProps) {
  const data = getDashboardData(currentUser)
  const topContracts = data.summaries
    .slice()
    .sort((a, b) => b.percentExecuted - a.percentExecuted)
    .slice(0, 5)

  const chartItems = topContracts.map((summary) => ({
    label: summary.contract.name,
    value: summary.percentExecuted,
    helper: `${numberFormatter.format(summary.percentExecuted)}%`,
  }))

  const healthScore =
    data.activeContracts === 0
      ? 0
      : Math.max(
          0,
          Math.round(
            ((data.activeContracts - data.delayedContracts.length) /
              data.activeContracts) *
              100
          )
        )

  return (
    <div className="flex flex-col gap-5">
      <section className="grid gap-4 rounded-[2.2rem] border border-[#dfe8ea] bg-white p-5 shadow-[0_24px_60px_-34px_rgba(15,23,42,0.35)] lg:grid-cols-[minmax(0,1fr)_auto] lg:items-end lg:p-7">
        <div className="min-w-0">
          <p className="text-sm font-medium text-[#667b80]">
            Olá, {currentUser.name}
          </p>
          <h1 className="mt-1 text-3xl font-semibold tracking-tight text-[#101820]">
            Painel operacional
          </h1>
          <p className="mt-3 max-w-3xl text-sm leading-6 text-[#667b80]">
            Acompanhe ritmo contratual, solicitações pendentes, equipes abaixo
            da meta e divergências de efetivo sem perder o foco operacional.
          </p>
        </div>

        <div className="flex items-center gap-2 rounded-2xl border border-[#e5ecef] bg-[#f6f8fb] p-1">
          <span className="rounded-xl px-3 py-2 text-xs font-semibold text-[#667b80]">
            Hoje
          </span>
          <span className="rounded-xl bg-[#101820] px-3 py-2 text-xs font-semibold text-white">
            Semana
          </span>
          <span className="flex size-8 items-center justify-center rounded-xl bg-white text-[#667b80]">
            <CalendarDays className="size-4" />
          </span>
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <MetricCard
          title="Contratos ativos"
          description="Em operação"
          value={data.activeContracts}
          icon={Briefcase}
        />
        <MetricCard
          title="Contratos atrasados"
          description="Abaixo do esperado"
          value={data.delayedContracts.length}
          icon={TrendingDown}
          tone={data.delayedContracts.length > 0 ? "danger" : "default"}
        />
        <MetricCard
          title="Contratos adiantados"
          description="Acima do esperado"
          value={data.aheadContracts.length}
          icon={TrendingUp}
          tone={data.aheadContracts.length > 0 ? "positive" : "default"}
        />
        <MetricCard
          title="Solicitações pendentes"
          description="Aguardando logística"
          value={data.pendingRequests}
          icon={PackageOpen}
          tone={data.pendingRequests > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Divergência de efetivo"
          description="Último lançamento"
          value={data.workforceDivergenceContracts.length}
          icon={Users}
          tone={data.workforceDivergenceContracts.length > 0 ? "warning" : "default"}
        />
      </section>

      <section className="grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="border-[#dfe8ea] bg-white shadow-[0_28px_70px_-42px_rgba(15,23,42,0.45)]">
          <CardHeader className="grid gap-1 sm:grid-cols-[1fr_auto] sm:items-start">
            <div>
              <CardTitle className="text-lg text-[#101820]">
                Ritmo geral da operação
              </CardTitle>
              <CardDescription className="text-[#667b80]">
                Saúde dos contratos ativos nesta carteira.
              </CardDescription>
            </div>
            <Badge className="w-fit border-[#d7edf2] bg-[#eef8fb] text-[#087fca]">
              {healthScore}% estável
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-5 lg:grid-cols-[0.8fr_1.2fr]">
            <div className="rounded-[1.5rem] border border-[#dfe8ea] bg-[#f8fafc] p-5">
              <p className="text-sm text-[#667b80]">Índice de saúde</p>
              <p className="mt-3 font-mono text-5xl font-semibold tracking-tight">
                {healthScore}
              </p>
              <p className="mt-2 text-sm text-[#667b80]">
                Quanto menor o atraso relativo, maior o índice.
              </p>
            </div>
            <div className="rounded-[1.5rem] border border-[#dfe8ea] bg-[#f8fafc] p-5">
              {chartItems.length === 0 ? (
                <EmptyState
                  icon={Briefcase}
                  title="Sem dados de execução"
                  description="Cadastre contratos e lançamentos para visualizar este gráfico."
                />
              ) : (
                <HorizontalBarChart items={chartItems} />
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="border-[#dfe8ea] bg-white shadow-[0_24px_55px_-34px_rgba(15,23,42,0.32)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <AlertTriangle className="size-5 text-[#087fca]" />
              Alertas operacionais
            </CardTitle>
            <CardDescription>
              Itens críticos, atrasos contratuais e divergências de efetivo.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.alerts.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="Sem alertas operacionais"
                description="Os contratos e lançamentos atuais não possuem pendências críticas."
              />
            ) : (
              data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between gap-3 rounded-2xl border border-[#e5ecef] bg-[#f8fafc] p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{alert.title}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.description}
                    </p>
                  </div>
                  <Badge variant="outline" className={alert.badgeClassName}>
                    {alert.badgeLabel}
                  </Badge>
                </div>
              ))
            )}
          </CardContent>
        </Card>
      </section>

      <section className="grid gap-4 lg:grid-cols-[0.8fr_1.2fr]">
        <MetricCard
          title="Equipes abaixo da meta"
          description="Último lançamento do contrato"
          value={data.contractsBelowGoal.length}
          icon={ClipboardList}
          tone={data.contractsBelowGoal.length > 0 ? "danger" : "default"}
        />

        <Card className="border-[#dfe8ea] bg-white shadow-[0_24px_55px_-34px_rgba(15,23,42,0.32)]">
          <CardHeader>
            <CardTitle>Comparativo de ritmo contratual</CardTitle>
            <CardDescription>
              Contratos ordenados pelo desvio entre executado e esperado.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.summaries.length === 0 ? (
              <EmptyState
                icon={TrendingUp}
                title="Sem contratos para comparar"
                description="Os contratos ativos aparecerão aqui com sua situação de ritmo."
              />
            ) : (
              data.summaries
                .slice()
                .sort((a, b) => a.progressGap - b.progressGap)
                .slice(0, 5)
                .map((summary) => (
                  <div
                    key={summary.contract.id}
                    className="grid gap-3 rounded-2xl border border-[#e5ecef] bg-[#f8fafc] p-3 md:grid-cols-[minmax(0,1fr)_auto] md:items-center"
                  >
                    <div className="min-w-0">
                      <p className="truncate font-medium">
                        {summary.contract.name}
                      </p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Executado {numberFormatter.format(summary.percentExecuted)}% ·
                        Esperado {numberFormatter.format(summary.expectedProgress)}%
                      </p>
                    </div>
                    <Badge
                      variant="outline"
                      className={
                        summary.progressGap < -DASHBOARD_TOLERANCE
                          ? "border-red-200 bg-red-50 text-red-700"
                          : summary.progressGap > DASHBOARD_TOLERANCE
                            ? "border-emerald-200 bg-emerald-50 text-emerald-700"
                            : "border-amber-200 bg-amber-50 text-amber-700"
                      }
                    >
                      {summary.progressGap < -DASHBOARD_TOLERANCE
                        ? "Atrasado"
                        : summary.progressGap > DASHBOARD_TOLERANCE
                          ? "Adiantado"
                          : "No ritmo"}
                    </Badge>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
