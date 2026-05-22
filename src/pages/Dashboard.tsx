import { AlertTriangle, BarChart3, Briefcase, TrendingUp } from "lucide-react"

import { MetricCard } from "@/components/MetricCard"
import { PageHeader } from "@/components/PageHeader"
import { HorizontalBarChart, MetricBar } from "@/components/SimpleCharts"
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
  currencyFormatter,
  getPerformanceLabel,
  getStatusClassName,
  numberFormatter,
} from "@/lib/analytics"
import { loadContracts } from "@/lib/contracts"
import { loadDailyExecutions } from "@/lib/daily-executions"

function getDashboardData() {
  const contracts = loadContracts()
  const executions = loadDailyExecutions()
  const summaries = buildContractSummaries(contracts, executions)
  const rows = buildReportRows(contracts, executions)

  const activeContracts = contracts.filter(
    (contract) => contract.status === "ativo"
  ).length
  const plannedValue = summaries.reduce(
    (total, summary) => total + summary.plannedValue,
    0
  )
  const realizedValue = summaries.reduce(
    (total, summary) => total + summary.realizedValue,
    0
  )
  const plannedQuantity = summaries.reduce(
    (total, summary) => total + summary.plannedQuantity,
    0
  )
  const realizedQuantity = summaries.reduce(
    (total, summary) => total + summary.realizedQuantity,
    0
  )
  const percentExecuted =
    plannedQuantity > 0 ? (realizedQuantity / plannedQuantity) * 100 : 0
  const productivity =
    rows.length > 0
      ? rows.reduce((total, row) => total + row.percentage, 0) / rows.length
      : 0

  const alerts = rows
    .filter((row) => row.status === "red" || row.status === "yellow")
    .slice(0, 5)

  return {
    summaries,
    rows,
    activeContracts,
    plannedValue,
    realizedValue,
    financialDifference: realizedValue - plannedValue,
    percentExecuted,
    productivity,
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

  const productivityTone =
    data.productivity >= 100
      ? "positive"
      : data.productivity >= 80
        ? "warning"
        : "danger"

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Visão executiva"
        title="Dashboard"
        description="Acompanhe execução física, valores planejados e sinais operacionais a partir dos contratos e lançamentos diários."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Contratos ativos"
          description="Contratos em operação"
          value={data.activeContracts}
          icon={Briefcase}
        />

        <MetricCard
          title="Percentual executado"
          description="Realizado físico acumulado"
          value={`${numberFormatter.format(data.percentExecuted)}%`}
          icon={BarChart3}
        >
          <MetricBar value={data.percentExecuted} />
        </MetricCard>

        <MetricCard
          title="Valor planejado"
          description="Quantidade total x valor unitário"
          value={currencyFormatter.format(data.plannedValue)}
        />

        <MetricCard
          title="Valor realizado"
          description="Realizado acumulado x valor unitário"
          value={currencyFormatter.format(data.realizedValue)}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-3">
        <MetricCard
          title="Diferença financeira"
          description="Realizado menos planejado"
          value={currencyFormatter.format(data.financialDifference)}
          tone={data.financialDifference < 0 ? "danger" : "positive"}
        />

        <MetricCard
          title="Produtividade"
          description="Média realizado/meta dos lançamentos"
          value={`${numberFormatter.format(data.productivity)}%`}
          icon={TrendingUp}
          tone={productivityTone}
        >
          <MetricBar
            value={data.productivity}
            className={
              data.productivity >= 100
                ? "bg-emerald-600"
                : data.productivity >= 80
                  ? "bg-amber-500"
                  : "bg-red-600"
            }
          />
        </MetricCard>

        <Card className="rounded-lg border-[#d7e5e5] shadow-[0_12px_36px_rgba(12,55,56,0.06)]">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-sm">
              <AlertTriangle />
              Alertas operacionais
            </CardTitle>
            <CardDescription>Itens abaixo ou próximos da meta</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            {data.alerts.length === 0 ? (
              <EmptyState
                icon={AlertTriangle}
                title="Sem alertas operacionais"
                description="Os lançamentos dentro da meta aparecerão sem pendências nesta área."
              />
            ) : (
              data.alerts.map((alert) => (
                <div
                  key={alert.id}
                  className="flex items-start justify-between gap-3 rounded-lg border bg-muted/20 p-3"
                >
                  <div className="min-w-0">
                    <p className="truncate font-medium">{alert.serviceName}</p>
                    <p className="text-xs text-muted-foreground">
                      {alert.contractName} · {alert.date}
                    </p>
                  </div>
                  <Badge
                    variant="outline"
                    className={getStatusClassName(alert.status)}
                  >
                    {getPerformanceLabel(alert.status)}
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
                icon={BarChart3}
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
            <CardTitle>Financeiro</CardTitle>
            <CardDescription>Planejado versus realizado</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <div>
              <div className="mb-2 flex justify-between gap-3 text-sm">
                <span>Planejado</span>
                <span>{currencyFormatter.format(data.plannedValue)}</span>
              </div>
              <MetricBar value={100} className="bg-[#0f7772]" />
            </div>
            <div>
              <div className="mb-2 flex justify-between gap-3 text-sm">
                <span>Realizado</span>
                <span>{currencyFormatter.format(data.realizedValue)}</span>
              </div>
              <MetricBar
                value={
                  data.plannedValue > 0
                    ? (data.realizedValue / data.plannedValue) * 100
                    : 0
                }
                className="bg-[#63c7bd]"
              />
            </div>
          </CardContent>
        </Card>
      </section>
    </div>
  )
}
