import {
  AlertTriangle,
  Briefcase,
  ClipboardList,
  PackageOpen,
  TrendingDown,
  TrendingUp,
  Users,
} from "lucide-react"

import { MetricCard } from "@/components/MetricCard"
import { PageHeader } from "@/components/PageHeader"
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
import { loadContracts } from "@/lib/contracts"
import { loadDailyExecutions } from "@/lib/daily-executions"
import { loadOperationalRequests } from "@/lib/requests"

const DASHBOARD_TOLERANCE = 5

function getDashboardData() {
  const contracts = loadContracts()
  const executions = loadDailyExecutions()
  const requests = loadOperationalRequests()
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
      description: "Último lançamento com divergência entre efetivo planejado e realizado",
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

export function Dashboard() {
  const data = getDashboardData()
  const topContracts = data.summaries
    .slice()
    .sort((a, b) => b.percentExecuted - a.percentExecuted)
    .slice(0, 5)

  const chartItems = topContracts.map((summary) => ({
    label: summary.contract.name,
    value: summary.percentExecuted,
    helper: `${numberFormatter.format(summary.percentExecuted)}%`,
  }))

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Visão executiva"
        title="Dashboard"
        description="Acompanhe ritmo contratual, solicitações pendentes, equipes abaixo da meta e divergências de efetivo sem perder o foco operacional."
      />

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
          description="Último lançamento do contrato"
          value={data.workforceDivergenceContracts.length}
          icon={Users}
          tone={data.workforceDivergenceContracts.length > 0 ? "warning" : "default"}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-4">
        <MetricCard
          title="Equipes abaixo da meta"
          description="Último lançamento do contrato"
          value={data.contractsBelowGoal.length}
          icon={ClipboardList}
          tone={data.contractsBelowGoal.length > 0 ? "danger" : "default"}
        />

        <Card className="rounded-lg border-[#d7e5e5] shadow-[0_12px_36px_rgba(12,55,56,0.06)] lg:col-span-3">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle />
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
                  className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3"
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

      <section className="grid gap-4 lg:grid-cols-[1fr_360px]">
        <Card className="rounded-lg border-[#d7e5e5] shadow-[0_12px_36px_rgba(12,55,56,0.06)]">
          <CardHeader>
            <CardTitle>Execução por contrato</CardTitle>
            <CardDescription>Contratos com maior avanço físico</CardDescription>
          </CardHeader>
          <CardContent>
            {chartItems.length === 0 ? (
              <EmptyState
                icon={Briefcase}
                title="Sem dados de execução"
                description="Cadastre contratos e lançamentos para visualizar este gráfico."
              />
            ) : (
              <HorizontalBarChart items={chartItems} />
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-[#d7e5e5] shadow-[0_12px_36px_rgba(12,55,56,0.06)]">
          <CardHeader>
            <CardTitle>Ritmo contratual</CardTitle>
            <CardDescription>
              Comparação entre o executado e o progresso esperado.
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
                    className="rounded-lg border bg-muted/20 p-3"
                  >
                    <div className="flex items-center justify-between gap-3">
                      <p className="font-medium">{summary.contract.name}</p>
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
                    <p className="mt-1 text-xs text-muted-foreground">
                      Executado {numberFormatter.format(summary.percentExecuted)}% ·
                      Esperado {numberFormatter.format(summary.expectedProgress)}%
                    </p>
                  </div>
                ))
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
