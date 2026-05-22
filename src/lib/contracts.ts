export type ContractStatus = "ativo" | "pausado" | "encerrado"

export type ContractService = {
  id: string
  name: string
  unit: string
  totalQuantity: number
  unitValue: number
  dailyGoal: number
  completedQuantity: number
}

export type Contract = {
  id: string
  name: string
  client: string
  startDate: string
  expectedEndDate: string
  status: ContractStatus
  team: string
  employeeCount: number
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

export const serviceUnitOptions = ["m", "m²", "km", "un", "h"]

export function createId() {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random()}`
}

export function createEmptyService(): ContractService {
  return {
    id: createId(),
    name: "",
    unit: "m",
    totalQuantity: 0,
    unitValue: 0,
    dailyGoal: 0,
    completedQuantity: 0,
  }
}

export function createEmptyContractForm(): ContractFormData {
  return {
    name: "",
    client: "",
    startDate: "",
    expectedEndDate: "",
    status: "ativo",
    team: "",
    employeeCount: 1,
    services: [createEmptyService()],
  }
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

    return parsedContracts.map((contract) => ({
      ...contract,
      services: Array.isArray(contract.services)
        ? contract.services.map((service: ContractService) => ({
            ...service,
            completedQuantity: Number(service.completedQuantity) || 0,
          }))
        : [],
    }))
  } catch {
    return []
  }
}

export function saveContracts(contracts: Contract[]) {
  localStorage.setItem(CONTRACTS_STORAGE_KEY, JSON.stringify(contracts))
}
