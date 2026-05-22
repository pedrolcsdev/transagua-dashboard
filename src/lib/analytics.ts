import type { Contract, ContractService } from "@/lib/contracts"
import {
  deviationReasonOptions,
  type DailyExecution,
  type DailyExecutionItem,
} from "@/lib/daily-executions"

export type PerformanceStatus = "green" | "yellow" | "red" | "no-goal"

export type ReportRow = {
  id: string
  date: string
  contractId: string
  contractName: string
  contractStatus: Contract["status"]
  serviceId: string
  serviceName: string
  unit: string
  meta: number
  realized: number
  percentage: number
  difference: number
  observation: string
  reviewObservation: string
  deviationReason: string
  status: PerformanceStatus
  reviewCompleted: boolean
}

export type ContractSummary = {
  contract: Contract
  plannedQuantity: number
  realizedQuantity: number
  plannedValue: number
  realizedValue: number
  percentExecuted: number
}

export const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

export const numberFormatter = new Intl.NumberFormat("pt-BR", {
  maximumFractionDigits: 1,
})

export const reasonLabelByValue = Object.fromEntries(
  deviationReasonOptions.map((option) => [option.value, option.label])
)

export function getPerformanceStatus(
  realized: number,
  goal: number
): PerformanceStatus {
  if (goal <= 0) {
    return "no-goal"
  }

  const percentage = (realized / goal) * 100

  if (percentage >= 100) {
    return "green"
  }

  if (percentage >= 80) {
    return "yellow"
  }

  return "red"
}

export function getPerformanceLabel(status: PerformanceStatus) {
  const labels: Record<PerformanceStatus, string> = {
    green: "Dentro da meta",
    yellow: "Atenção",
    red: "Crítico",
    "no-goal": "Sem meta",
  }

  return labels[status]
}

export function getStatusClassName(status: PerformanceStatus) {
  const classes: Record<PerformanceStatus, string> = {
    green: "border-emerald-200 bg-emerald-50 text-emerald-700",
    yellow: "border-amber-200 bg-amber-50 text-amber-700",
    red: "border-red-200 bg-red-50 text-red-700",
    "no-goal": "border-muted bg-muted/40 text-muted-foreground",
  }

  return classes[status]
}

export function getServiceRealizedQuantity(
  contractId: string,
  serviceId: string,
  executions: DailyExecution[]
) {
  return executions.reduce((total, execution) => {
    if (execution.contractId !== contractId) {
      return total
    }

    const item = execution.items.find((entry) => entry.serviceId === serviceId)

    return total + (Number(item?.realizedDaily) || 0)
  }, 0)
}

export function getServicePlannedValue(service: ContractService) {
  return (Number(service.totalQuantity) || 0) * (Number(service.unitValue) || 0)
}

export function getServiceRealizedValue(
  contractId: string,
  service: ContractService,
  executions: DailyExecution[]
) {
  return (
    getServiceRealizedQuantity(contractId, service.id, executions) *
    (Number(service.unitValue) || 0)
  )
}

export function buildContractSummaries(
  contracts: Contract[],
  executions: DailyExecution[]
): ContractSummary[] {
  return contracts.map((contract) => {
    const totals = contract.services.reduce(
      (summary, service) => {
        const plannedQuantity = Number(service.totalQuantity) || 0
        const realizedQuantity = getServiceRealizedQuantity(
          contract.id,
          service.id,
          executions
        )
        const plannedValue = getServicePlannedValue(service)
        const realizedValue = getServiceRealizedValue(
          contract.id,
          service,
          executions
        )

        return {
          plannedQuantity: summary.plannedQuantity + plannedQuantity,
          realizedQuantity: summary.realizedQuantity + realizedQuantity,
          plannedValue: summary.plannedValue + plannedValue,
          realizedValue: summary.realizedValue + realizedValue,
        }
      },
      {
        plannedQuantity: 0,
        realizedQuantity: 0,
        plannedValue: 0,
        realizedValue: 0,
      }
    )

    return {
      contract,
      ...totals,
      percentExecuted:
        totals.plannedQuantity > 0
          ? (totals.realizedQuantity / totals.plannedQuantity) * 100
          : 0,
    }
  })
}

export function buildReportRows(
  contracts: Contract[],
  executions: DailyExecution[]
): ReportRow[] {
  return executions.flatMap((execution) => {
    const contract = contracts.find((item) => item.id === execution.contractId)

    return execution.items.map((item: DailyExecutionItem) => {
      const service = contract?.services.find(
        (entry) => entry.id === item.serviceId
      )
      const meta = Number(service?.dailyGoal) || 0
      const realized = Number(item.realizedDaily) || 0
      const percentage = meta > 0 ? (realized / meta) * 100 : 0
      const status = getPerformanceStatus(realized, meta)

      return {
        id: `${execution.id}-${item.serviceId}`,
        date: execution.date,
        contractId: execution.contractId,
        contractName: contract?.name ?? "Contrato removido",
        contractStatus: contract?.status ?? "encerrado",
        serviceId: item.serviceId,
        serviceName: service?.name ?? "Serviço removido",
        unit: service?.unit ?? "",
        meta,
        realized,
        percentage,
        difference: realized - meta,
        observation: item.observation,
        reviewObservation: item.reviewObservation ?? "",
        deviationReason: item.deviationReason
          ? reasonLabelByValue[item.deviationReason] ?? item.deviationReason
          : "",
        status,
        reviewCompleted: Boolean(item.reviewCompleted),
      }
    })
  })
}

export function isWithinPeriod(date: string, startDate: string, endDate: string) {
  if (startDate && date < startDate) {
    return false
  }

  if (endDate && date > endDate) {
    return false
  }

  return true
}
