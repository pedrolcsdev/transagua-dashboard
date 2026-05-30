import type { Contract } from "@/lib/contracts"
import { createId } from "@/lib/contracts"
import type { UserProfile } from "@/lib/profile"

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
  reviewHistory?: ReviewHistoryEntry[]
}

export type ReviewHistoryEntry = {
  id: string
  previousValue: number
  newValue: number
  reason: string
  changedAt: string
  changedByProfile: UserProfile
}

export type WorkforceActualItem = {
  roleId: string
  roleName: string
  plannedCount: number
  actualCount: number
}

export type DailyExecution = {
  id: string
  contractId: string
  date: string
  items: DailyExecutionItem[]
  workforceActual: WorkforceActualItem[]
  closedAt?: string
  closedByProfile?: UserProfile
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

    if (!Array.isArray(parsedExecutions)) {
      return []
    }

    return parsedExecutions.map((execution) => {
      const executionRecord = execution as Record<string, unknown>
      const items = Array.isArray(executionRecord.items)
        ? executionRecord.items
        : []
      const workforceActual = Array.isArray(executionRecord.workforceActual)
        ? executionRecord.workforceActual
        : []

      return {
      id: execution.id ?? createId(),
      contractId: execution.contractId ?? "",
      date: execution.date ?? "",
      items: items.map((item) => {
        const itemRecord = item as Record<string, unknown>
        const reviewHistory = Array.isArray(itemRecord.reviewHistory)
          ? itemRecord.reviewHistory
          : []

        return {
          serviceId:
            typeof itemRecord.serviceId === "string" ? itemRecord.serviceId : "",
          realizedDaily: Number(itemRecord.realizedDaily) || 0,
          observation:
            typeof itemRecord.observation === "string" ? itemRecord.observation : "",
          deviationReason:
            itemRecord.deviationReason === "atraso-logistica" ||
            itemRecord.deviationReason === "chuva" ||
            itemRecord.deviationReason === "falta-material" ||
            itemRecord.deviationReason === "falta-equipamento" ||
            itemRecord.deviationReason === "equipe-reduzida" ||
            itemRecord.deviationReason === "outro"
              ? itemRecord.deviationReason
              : "",
          reviewObservation:
            typeof itemRecord.reviewObservation === "string"
              ? itemRecord.reviewObservation
              : "",
          reviewCompleted: Boolean(itemRecord.reviewCompleted),
          reviewedAt:
            typeof itemRecord.reviewedAt === "string"
              ? itemRecord.reviewedAt
              : undefined,
          reviewHistory: reviewHistory.map((entry) => {
            const historyRecord = entry as Record<string, unknown>

            return {
              id:
                typeof historyRecord.id === "string" && historyRecord.id.length > 0
                  ? historyRecord.id
                  : createId(),
              previousValue: Number(historyRecord.previousValue) || 0,
              newValue: Number(historyRecord.newValue) || 0,
              reason:
                typeof historyRecord.reason === "string"
                  ? historyRecord.reason
                  : "",
              changedAt:
                typeof historyRecord.changedAt === "string"
                  ? historyRecord.changedAt
                  : new Date().toISOString(),
              changedByProfile:
                historyRecord.changedByProfile === "director" ||
                historyRecord.changedByProfile === "manager" ||
                historyRecord.changedByProfile === "leader" ||
                historyRecord.changedByProfile === "logistics"
                  ? historyRecord.changedByProfile
                  : "manager",
            }
          }),
        }
      }),
      workforceActual: workforceActual.map((item) => {
        const workforceRecord = item as Record<string, unknown>

        return {
          roleId:
            typeof workforceRecord.roleId === "string" &&
            workforceRecord.roleId.length > 0
              ? workforceRecord.roleId
              : createId(),
          roleName:
            typeof workforceRecord.roleName === "string"
              ? workforceRecord.roleName
              : "",
          plannedCount: Number(workforceRecord.plannedCount) || 0,
          actualCount: Number(workforceRecord.actualCount) || 0,
        }
      }),
      closedAt: execution.closedAt ?? undefined,
      closedByProfile:
        execution.closedByProfile === "director" ||
        execution.closedByProfile === "manager" ||
        execution.closedByProfile === "leader" ||
        execution.closedByProfile === "logistics"
          ? execution.closedByProfile
          : undefined,
      createdAt: execution.createdAt ?? new Date().toISOString(),
      updatedAt: execution.updatedAt ?? new Date().toISOString(),
      }
    })
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
      reviewObservation: existingItem?.reviewObservation ?? "",
      reviewCompleted: existingItem?.reviewCompleted ?? false,
      reviewedAt: existingItem?.reviewedAt,
      reviewHistory: existingItem?.reviewHistory ?? [],
    }
  })
}

export function buildWorkforceActual(
  contract: Contract,
  existingExecution?: DailyExecution
): WorkforceActualItem[] {
  return contract.plannedWorkforce.map((role) => {
    const existingRole = existingExecution?.workforceActual.find(
      (item) => item.roleId === role.id
    )

    return {
      roleId: role.id,
      roleName: role.roleName,
      plannedCount: Number(role.plannedCount) || 0,
      actualCount: existingRole?.actualCount ?? 0,
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
          closedAt: execution.closedAt ?? existingExecution.closedAt,
          closedByProfile:
            execution.closedByProfile ?? existingExecution.closedByProfile,
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

export function isExecutionClosed(execution?: DailyExecution | null) {
  return Boolean(execution?.closedAt)
}
