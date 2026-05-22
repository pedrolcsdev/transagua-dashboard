import type { Contract } from "@/lib/contracts"

export type DeviationReason =
  | "atraso-logistica"
  | "chuva"
  | "falta-material"
  | "falta-equipamento"
  | "equipe-reduzida"
  | "outro"

export type DailyExecutionItem = {
  serviceId: string
  realizedDaily: number
  observation: string
  deviationReason: DeviationReason | ""
  reviewObservation?: string
  reviewCompleted?: boolean
  reviewedAt?: string
}

export type DailyExecution = {
  id: string
  contractId: string
  date: string
  items: DailyExecutionItem[]
  createdAt: string
  updatedAt: string
}

export type DailyExecutionFormItem = DailyExecutionItem & {
  serviceName: string
  unit: string
  dailyGoal: number
  totalQuantity: number
  completedQuantity: number
}

export const DAILY_EXECUTIONS_STORAGE_KEY = "transagua:daily-executions"

export const deviationReasonOptions: Array<{
  value: DeviationReason
  label: string
}> = [
  { value: "atraso-logistica", label: "Atraso da logística" },
  { value: "chuva", label: "Chuva" },
  { value: "falta-material", label: "Falta de material" },
  { value: "falta-equipamento", label: "Falta de equipamento" },
  { value: "equipe-reduzida", label: "Equipe reduzida" },
  { value: "outro", label: "Outro" },
]

export function getTodayInputValue() {
  return new Date().toISOString().slice(0, 10)
}

export function loadDailyExecutions(): DailyExecution[] {
  const storedExecutions = localStorage.getItem(DAILY_EXECUTIONS_STORAGE_KEY)

  if (!storedExecutions) {
    return []
  }

  try {
    const parsedExecutions = JSON.parse(storedExecutions)

    return Array.isArray(parsedExecutions) ? parsedExecutions : []
  } catch {
    return []
  }
}

export function saveDailyExecutions(executions: DailyExecution[]) {
  localStorage.setItem(DAILY_EXECUTIONS_STORAGE_KEY, JSON.stringify(executions))
}

export function buildExecutionItems(
  contract: Contract,
  existingExecution?: DailyExecution
): DailyExecutionFormItem[] {
  return contract.services.map((service) => {
    const existingItem = existingExecution?.items.find(
      (item) => item.serviceId === service.id
    )

    return {
      serviceId: service.id,
      serviceName: service.name,
      unit: service.unit,
      dailyGoal: Number(service.dailyGoal) || 0,
      totalQuantity: Number(service.totalQuantity) || 0,
      completedQuantity: Number(service.completedQuantity) || 0,
      realizedDaily: existingItem?.realizedDaily ?? 0,
      observation: existingItem?.observation ?? "",
      deviationReason: existingItem?.deviationReason ?? "",
    }
  })
}

export function upsertDailyExecution(
  executions: DailyExecution[],
  execution: DailyExecution
) {
  const existingExecution = executions.find(
    (item) =>
      item.contractId === execution.contractId && item.date === execution.date
  )

  if (!existingExecution) {
    return [execution, ...executions]
  }

  return executions.map((item) =>
    item.id === existingExecution.id
      ? {
          ...execution,
          id: existingExecution.id,
          createdAt: existingExecution.createdAt,
        }
      : item
  )
}

export function syncContractProgressFromExecutions(
  contracts: Contract[],
  executions: DailyExecution[]
) {
  return contracts.map((contract) => ({
    ...contract,
    services: contract.services.map((service) => {
      const completedQuantity = executions.reduce((total, execution) => {
        if (execution.contractId !== contract.id) {
          return total
        }

        const executionItem = execution.items.find(
          (item) => item.serviceId === service.id
        )

        return total + (Number(executionItem?.realizedDaily) || 0)
      }, 0)

      return {
        ...service,
        completedQuantity,
      }
    }),
  }))
}
