import { normalizeDateForInput } from "@/lib/dates"
import { getUsersByProfile, type AppUser } from "@/lib/profile"

export type ContractStatus = "ativo" | "pausado" | "encerrado"
export type ContractDeadlineUnit = "dia" | "semana" | "mes"

export type PlannedWorkforceRole = {
  id: string
  roleName: string
  plannedCount: number
}

export type ContractService = {
  id: string
  code: string
  name: string
  description: string
  unit: string
  totalQuantity: number
  unitValue: number
  contractValue: number
  monthlyGoal: number
  dailyGoal: number
  completedQuantity: number
}

export type Contract = {
  id: string
  name: string
  client: string
  workingDaysDeadline: number
  deadlineUnit: ContractDeadlineUnit
  startDate: string
  expectedEndDate: string
  status: ContractStatus
  team: string
  managerId: string
  leaderId: string
  employeeCount: number
  plannedWorkforce: PlannedWorkforceRole[]
  observations: string
  services: ContractService[]
  createdAt: string
  updatedAt: string
}

export type ContractFormData = Omit<Contract, "id" | "createdAt" | "updatedAt">

export const CONTRACTS_STORAGE_KEY = "transagua:contracts"

export const contractStatusOptions: Array<{
  value: ContractStatus
  label: string
}> = [
  { value: "ativo", label: "Ativo" },
  { value: "pausado", label: "Pausado" },
  { value: "encerrado", label: "Encerrado" },
]

export const contractDeadlineUnitOptions: Array<{
  value: ContractDeadlineUnit
  label: string
}> = [
  { value: "dia", label: "Dia" },
  { value: "semana", label: "Semana" },
  { value: "mes", label: "Mês" },
]

export const serviceUnitOptions = ["m", "m²", "m³", "km", "un", "und", "VB", "h"]

export function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

export function createEmptyService(): ContractService {
  return {
    id: createId(),
    code: "",
    name: "",
    description: "",
    unit: "m",
    totalQuantity: 0,
    unitValue: 0,
    contractValue: 0,
    monthlyGoal: 0,
    dailyGoal: 0,
    completedQuantity: 0,
  }
}

export function createEmptyPlannedWorkforceRole(): PlannedWorkforceRole {
  return {
    id: createId(),
    roleName: "",
    plannedCount: 0,
  }
}

export function getPlannedWorkforceTotal(workforce: PlannedWorkforceRole[]) {
  return workforce.reduce(
    (total, role) => total + (Number(role.plannedCount) || 0),
    0
  )
}

function createLegacyPlannedWorkforce(employeeCount: number) {
  return [
    {
      id: createId(),
      roleName: "Equipe geral",
      plannedCount: Math.max(1, Number(employeeCount) || 1),
    },
  ]
}

export function normalizePlannedWorkforce(
  workforce: unknown,
  fallbackEmployeeCount = 1
) {
  if (!Array.isArray(workforce) || workforce.length === 0) {
    return createLegacyPlannedWorkforce(fallbackEmployeeCount)
  }

  const normalizedWorkforce = workforce.map((role) => ({
    id:
      typeof role?.id === "string" && role.id.length > 0 ? role.id : createId(),
    roleName:
      typeof role?.roleName === "string" ? role.roleName.trim() : "",
    plannedCount: Math.max(0, Number(role?.plannedCount) || 0),
  }))

  return normalizedWorkforce.length > 0
    ? normalizedWorkforce
    : createLegacyPlannedWorkforce(fallbackEmployeeCount)
}

export function createEmptyContractForm(): ContractFormData {
  const defaultManagerId = getUsersByProfile("manager")[0]?.id ?? ""
  const defaultLeaderId = getUsersByProfile("leader")[0]?.id ?? ""

  return {
    name: "",
    client: "",
    workingDaysDeadline: 0,
    deadlineUnit: "dia",
    startDate: "",
    expectedEndDate: "",
    status: "ativo",
    team: "",
    managerId: defaultManagerId,
    leaderId: defaultLeaderId,
    employeeCount: 1,
    plannedWorkforce: [createEmptyPlannedWorkforceRole()],
    observations: "",
    services: [createEmptyService()],
  }
}

export function getServiceUnitValue(service: ContractService) {
  return Number(service.unitValue) || 0
}

export function getServiceContractValue(service: ContractService) {
  const totalQuantity = Number(service.totalQuantity) || 0
  const unitValue = getServiceUnitValue(service)

  return totalQuantity * unitValue
}

export function getContractsForUser(contracts: Contract[], currentUser: AppUser) {
  if (currentUser.profile === "director" || currentUser.profile === "logistics") {
    return contracts
  }

  if (currentUser.profile === "manager") {
    return contracts.filter((contract) => contract.managerId === currentUser.id)
  }

  return contracts.filter((contract) => contract.leaderId === currentUser.id)
}

export function loadContracts(): Contract[] {
  const storedContracts = localStorage.getItem(CONTRACTS_STORAGE_KEY)

  if (!storedContracts) {
    return []
  }

  try {
    const parsedContracts = JSON.parse(storedContracts)

    if (!Array.isArray(parsedContracts)) {
      return []
    }

    return parsedContracts.map((contract) => {
      const plannedWorkforce = normalizePlannedWorkforce(
        contract.plannedWorkforce,
        Number(contract.employeeCount) || 1
      )

      return {
        id: contract.id ?? createId(),
        name: contract.name ?? "",
        client: contract.client ?? "",
        workingDaysDeadline: Number(contract.workingDaysDeadline) || 0,
        deadlineUnit:
          contract.deadlineUnit === "semana" || contract.deadlineUnit === "mes"
            ? contract.deadlineUnit
            : "dia",
        startDate: normalizeDateForInput(contract.startDate),
        expectedEndDate: normalizeDateForInput(contract.expectedEndDate),
        status: contract.status ?? "ativo",
        team: contract.team ?? "",
        employeeCount:
          Number(contract.employeeCount) ||
          getPlannedWorkforceTotal(plannedWorkforce) ||
          1,
        plannedWorkforce,
        observations: contract.observations ?? "",
        managerId:
          typeof contract.managerId === "string" && contract.managerId.length > 0
            ? contract.managerId
            : getUsersByProfile("manager")[0]?.id ?? "",
        leaderId:
          typeof contract.leaderId === "string" && contract.leaderId.length > 0
            ? contract.leaderId
            : getUsersByProfile("leader")[0]?.id ?? "",
        services: Array.isArray(contract.services)
          ? contract.services.map(
              (service: Partial<ContractService> & { unitValue?: number }) => ({
                id: service.id ?? createId(),
                code: service.code ?? "",
                name: service.name ?? "",
                description: service.description ?? "",
                unit: service.unit ?? "m",
                totalQuantity: Number(service.totalQuantity) || 0,
                unitValue:
                  Number(service.unitValue) ||
                  ((Number(service.totalQuantity) || 0) > 0
                    ? (Number(service.contractValue) || 0) /
                      (Number(service.totalQuantity) || 0)
                    : 0),
                contractValue:
                  (Number(service.totalQuantity) || 0) *
                  (Number(service.unitValue) ||
                    ((Number(service.totalQuantity) || 0) > 0
                      ? (Number(service.contractValue) || 0) /
                        (Number(service.totalQuantity) || 0)
                      : 0)),
                monthlyGoal: Number(service.monthlyGoal) || 0,
                dailyGoal: Number(service.dailyGoal) || 0,
                completedQuantity: Number(service.completedQuantity) || 0,
              })
            )
          : [],
        createdAt: contract.createdAt ?? new Date().toISOString(),
        updatedAt: contract.updatedAt ?? new Date().toISOString(),
      }
    })
  } catch {
    return []
  }
}

export function saveContracts(contracts: Contract[]) {
  localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts))
}

export function getDeadlineUnitLabel(
  unit: ContractDeadlineUnit,
  quantity: number
) {
  if (unit === "semana") {
    return quantity === 1 ? "semana" : "semanas"
  }

  if (unit === "mes") {
    return quantity === 1 ? "mês" : "meses"
  }

  return quantity === 1 ? "dia" : "dias"
}
