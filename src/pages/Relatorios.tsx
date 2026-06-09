import { useMemo, useState } from "react"
import { ClipboardList } from "lucide-react"

import { MetricCard } from "@/components/MetricCard"
import { PageHeader } from "@/components/PageHeader"
import { DonutLegend, HorizontalBarChart } from "@/components/SimpleCharts"
import { EmptyState } from "@/components/StateViews"
import { Badge } from "@/components/ui/badge"
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
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  buildReportRows,
  getPerformanceLabel,
  getStatusClassName,
  isWithinPeriod,
  numberFormatter,
  type PerformanceStatus,
} from "@/lib/analytics"
import { getContractsForUser, loadContracts } from "@/lib/contracts"
import { loadDailyExecutions } from "@/lib/daily-executions"
import type { AppUser } from "@/lib/profile"

const statusOptions: Array<{
  value: PerformanceStatus | "all" | "reviewed" | "pending-review"
  label: string
}> = [
  { value: "all", label: "Todos" },
  { value: "green", label: "Verde" },
  { value: "yellow", label: "Amarelo" },
  { value: "red", label: "Vermelho" },
  { value: "reviewed", label: "Revisados" },
  { value: "pending-review", label: "Pendentes de revisão" },
]

type RelatoriosProps = {
  currentUser: AppUser
}

function getReportData(currentUser: AppUser) {
  const contracts = getContractsForUser(loadContracts(), currentUser)
  const allowedContractIds = new Set(contracts.map((contract) => contract.id))
  const executions = loadDailyExecutions().filter((execution) =>
    allowedContractIds.has(execution.contractId)
  )

  return {
    contracts,
    rows: buildReportRows(contracts, executions),
  }
}

export function Relatorios({ currentUser }: RelatoriosProps) {
  const data = useMemo(() => getReportData(currentUser), [currentUser])
  const [contractId, setContractId] = useState("all")
  const [serviceId, setServiceId] = useState("all")
  const [startDate, setStartDate] = useState("")
  const [endDate, setEndDate] = useState("")
  const [status, setStatus] = useState<
    PerformanceStatus | "all" | "reviewed" | "pending-review"
  >("all")

  const services = useMemo(
    () =>
      data.contracts
        .filter((contract) => contractId === "all" || contract.id === contractId)
        .flatMap((contract) =>
          contract.services.map((service) => ({
            id: service.id,
            name: service.name,
            contractName: contract.name,
          }))
        ),
    [contractId, data.contracts]
  )

  const filteredRows = useMemo(
    () =>
      data.rows.filter((row) => {
        const matchesContract =
          contractId === "all" || row.contractId === contractId
        const matchesService = serviceId === "all" || row.serviceId === serviceId
        const matchesPeriod = isWithinPeriod(row.date, startDate, endDate)
        const matchesStatus =
          status === "all" ||
          row.status === status ||
          (status === "reviewed" && row.reviewCompleted) ||
          (status === "pending-review" && !row.reviewCompleted)

        return matchesContract && matchesService && matchesPeriod && matchesStatus
      }),
    [contractId, data.rows, endDate, serviceId, startDate, status]
  )

  const totals = useMemo(
    () =>
      filteredRows.reduce(
        (summary, row) => ({
          meta: summary.meta + row.meta,
          realized: summary.realized + row.realized,
          difference: summary.difference + row.difference,
        }),
        { meta: 0, realized: 0, difference: 0 }
      ),
    [filteredRows]
  )

  const percentage = totals.meta > 0 ? (totals.realized / totals.meta) * 100 : 0
  const workforceDivergenceRows = useMemo(
    () => filteredRows.filter((row) => row.workforceDifference !== 0).length,
    [filteredRows]
  )
  const closedDays = useMemo(
    () => filteredRows.filter((row) => Boolean(row.closedAt)).length,
    [filteredRows]
  )

  const distribution = [
    {
      label: "Concluído",
      value: filteredRows.filter((row) => row.status === "green").length,
      colorClassName: "bg-emerald-500",
    },
    {
      label: "Atenção",
      value: filteredRows.filter((row) => row.status === "yellow").length,
      colorClassName: "bg-amber-500",
    },
    {
      label: "Crítico",
      value: filteredRows.filter((row) => row.status === "red").length,
      colorClassName: "bg-red-500",
    },
  ]

  const serviceChartItems = services
    .map((service) => {
      const serviceRows = filteredRows.filter((row) => row.serviceId === service.id)
      const realized = serviceRows.reduce((total, row) => total + row.realized, 0)

      return {
        label: service.name,
        value: realized,
        helper: numberFormatter.format(realized),
      }
    })
    .filter((item) => item.value > 0)
    .slice(0, 6)

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Análise operacional"
        title="Relatórios"
        description="Filtre contratos, períodos, serviços e status para acompanhar metas, realizado, revisão gerencial e situação do efetivo."
      />

      <Card className="rounded-lg border-[var(--border-color)] shadow-[0_12px_36px_rgba(12,55,56,0.06)]">
        <CardHeader>
          <CardTitle>Filtros</CardTitle>
          <CardDescription>Refine a visão do relatório operacional.</CardDescription>
        </CardHeader>
        <CardContent>
          <FieldGroup className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
            <Field>
              <FieldLabel htmlFor="report-contract">Contrato</FieldLabel>
              <select
                id="report-contract"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={contractId}
                onChange={(event) => {
                  setContractId(event.target.value)
                  setServiceId("all")
                }}
              >
                <option value="all">Todos</option>
                {data.contracts.map((contract) => (
                  <option key={contract.id} value={contract.id}>
                    {contract.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="report-service">Serviço</FieldLabel>
              <select
                id="report-service"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={serviceId}
                onChange={(event) => setServiceId(event.target.value)}
              >
                <option value="all">Todos</option>
                {services.map((service) => (
                  <option
                    key={`${service.contractName}-${service.id}`}
                    value={service.id}
                  >
                    {service.name}
                  </option>
                ))}
              </select>
            </Field>

            <Field>
              <FieldLabel htmlFor="report-start">Início</FieldLabel>
              <Input
                id="report-start"
                type="date"
                className="h-9"
                value={startDate}
                onChange={(event) => setStartDate(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="report-end">Fim</FieldLabel>
              <Input
                id="report-end"
                type="date"
                className="h-9"
                value={endDate}
                onChange={(event) => setEndDate(event.target.value)}
              />
            </Field>

            <Field>
              <FieldLabel htmlFor="report-status">Status</FieldLabel>
              <select
                id="report-status"
                className="h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                value={status}
                onChange={(event) =>
                  setStatus(
                    event.target.value as
                      | PerformanceStatus
                      | "all"
                      | "reviewed"
                      | "pending-review"
                  )
                }
              >
                {statusOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>
            </Field>
          </FieldGroup>
        </CardContent>
      </Card>

      <section className="grid gap-4 md:grid-cols-4">
        <MetricCard title="Meta" description="Soma filtrada" value={numberFormatter.format(totals.meta)} />
        <MetricCard title="Realizado" description="Produção filtrada" value={numberFormatter.format(totals.realized)} />
        <MetricCard title="Percentual" description="Realizado / meta" value={`${numberFormatter.format(percentage)}%`} />
        <MetricCard
          title="Diferença"
          description="Realizado - meta"
          value={numberFormatter.format(totals.difference)}
          tone={totals.difference < 0 ? "danger" : "positive"}
        />
      </section>

      <section className="grid gap-4 md:grid-cols-2">
        <MetricCard
          title="Divergências de efetivo"
          description="Linhas com efetivo diferente do planejado"
          value={workforceDivergenceRows}
          tone={workforceDivergenceRows > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Dias fechados"
          description="Lançamentos já encerrados pelo Líder"
          value={closedDays}
        />
      </section>

      <section className="grid gap-4 lg:grid-cols-[1fr_1fr]">
        <Card className="rounded-lg border-[var(--border-color)] shadow-[0_12px_36px_rgba(12,55,56,0.06)]">
          <CardHeader>
            <CardTitle>Status dos lançamentos</CardTitle>
            <CardDescription>Distribuição por faixa de meta</CardDescription>
          </CardHeader>
          <CardContent>
            <DonutLegend items={distribution} />
          </CardContent>
        </Card>

        <Card className="rounded-lg border-[var(--border-color)] shadow-[0_12px_36px_rgba(12,55,56,0.06)]">
          <CardHeader>
            <CardTitle>Realizado por serviço</CardTitle>
            <CardDescription>Serviços com produção no filtro atual</CardDescription>
          </CardHeader>
          <CardContent>
            {serviceChartItems.length === 0 ? (
              <EmptyState
                icon={ClipboardList}
                title="Sem produção no filtro"
                description="Ajuste contrato, período, serviço ou status para ampliar a busca."
              />
            ) : (
              <HorizontalBarChart items={serviceChartItems} />
            )}
          </CardContent>
        </Card>
      </section>

      <Card className="rounded-lg border-[var(--border-color)] shadow-[0_12px_36px_rgba(12,55,56,0.06)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <ClipboardList />
            Detalhamento
          </CardTitle>
          <CardDescription>
            Meta, realizado, percentual, observações, revisão do Gestor e efetivo do lançamento.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {filteredRows.length === 0 ? (
            <EmptyState
              icon={ClipboardList}
              title="Nenhum lançamento encontrado"
              description="Os resultados aparecerão aqui quando houver lançamentos compatíveis com os filtros selecionados."
            />
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Data</TableHead>
                  <TableHead>Contrato</TableHead>
                  <TableHead>Serviço</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Meta</TableHead>
                  <TableHead>Realizado</TableHead>
                  <TableHead>%</TableHead>
                  <TableHead>Efetivo</TableHead>
                  <TableHead>Revisão</TableHead>
                  <TableHead>Observações</TableHead>
                  <TableHead>Motivo</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRows.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell>{row.date}</TableCell>
                    <TableCell>{row.contractName}</TableCell>
                    <TableCell>{row.serviceName}</TableCell>
                    <TableCell>
                      <Badge
                        variant="outline"
                        className={getStatusClassName(row.status)}
                      >
                        {getPerformanceLabel(row.status)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {numberFormatter.format(row.meta)} {row.unit}
                    </TableCell>
                    <TableCell>
                      {numberFormatter.format(row.realized)} {row.unit}
                    </TableCell>
                    <TableCell>
                      {numberFormatter.format(row.percentage)}%
                    </TableCell>
                    <TableCell>
                      <span
                        className={
                          row.workforceDifference === 0
                            ? "text-foreground"
                            : row.workforceDifference > 0
                              ? "text-emerald-700"
                              : "text-amber-700"
                        }
                      >
                        {row.workforceSummary}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.reviewCompleted ? "Concluída" : "Pendente"}
                    </TableCell>
                    <TableCell className="max-w-72 whitespace-normal">
                      {[row.observation, row.reviewObservation]
                        .filter(Boolean)
                        .join(" | ") || "-"}
                    </TableCell>
                    <TableCell>{row.deviationReason || "-"}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
