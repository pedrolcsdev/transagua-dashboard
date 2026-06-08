import {
  createId,
  saveContracts,
  type Contract,
  type ContractService,
  type PlannedWorkforceRole,
} from "@/lib/contracts"
import {
  saveDailyExecutions,
  syncContractProgressFromExecutions,
  type DailyExecution,
  type DeviationReason,
} from "@/lib/daily-executions"
import { saveFuelEntries, type FuelEntry } from "@/lib/fuel"
import { appUsers } from "@/lib/profile"
import {
  saveOperationalRequests,
  type OperationalRequest,
  type RequestHistoryEntry,
  type RequestStatus,
} from "@/lib/requests"

const TEST_PREFIX = "test-seed"

type TestDataBundle = {
  contracts: Contract[]
  executions: DailyExecution[]
  requests: OperationalRequest[]
  fuelEntries: FuelEntry[]
}

export type TestDataSummary = {
  contracts: number
  executions: number
  requests: number
  fuelEntries: number
  observations: number
  logisticsUpdates: number
}

const managerIds = appUsers
  .filter((user) => user.profile === "manager")
  .map((user) => user.id)
const leaderIds = appUsers
  .filter((user) => user.profile === "leader")
  .map((user) => user.id)
const logisticsUserId =
  appUsers.find((user) => user.profile === "logistics")?.id ?? "logistics-test"

function testId(scope: string, index: number) {
  return `${TEST_PREFIX}:${scope}:${index}`
}

function dateDaysAgo(daysAgo: number) {
  const date = new Date()
  date.setHours(12, 0, 0, 0)
  date.setDate(date.getDate() - daysAgo)

  return date.toISOString().slice(0, 10)
}

function isoForDate(date: string, hour: number) {
  return `${date}T${String(hour).padStart(2, "0")}:00:00.000Z`
}

function createWorkforce(
  contractIndex: number,
  entries: Array<[string, number]>
): PlannedWorkforceRole[] {
  return entries.map(([roleName, plannedCount], index) => ({
    id: testId(`workforce-${contractIndex}`, index),
    roleName,
    plannedCount,
  }))
}

function createService(
  contractIndex: number,
  serviceIndex: number,
  service: Omit<ContractService, "id" | "contractValue" | "completedQuantity">
): ContractService {
  return {
    id: testId(`service-${contractIndex}`, serviceIndex),
    ...service,
    contractValue: service.totalQuantity * service.unitValue,
    completedQuantity: 0,
  }
}

function buildContracts(): Contract[] {
  const templates = [
    {
      name: "Rede coletora - Vila Esperanca",
      client: "Companhia Aguas do Litoral",
      team: "Equipe Sul - Rede coletora",
      deadline: 120,
      startOffset: 34,
      endOffset: -86,
      managerId: managerIds[0],
      leaderId: leaderIds[0],
      workforce: [
        ["Encarregado geral", 1],
        ["Pedreiro", 3],
        ["Servente", 6],
        ["Operador de compactador", 1],
      ] as Array<[string, number]>,
      services: [
        ["VES-001", "Implantacao de rede coletora", "m", 1800, 215, 30],
        ["VES-002", "Ligacoes domiciliares", "un", 220, 680, 4],
        ["VES-003", "Recomposicao de passeio", "m2", 950, 125, 16],
      ],
    },
    {
      name: "Drenagem urbana - Setor Norte",
      client: "Prefeitura Municipal de Vale Verde",
      team: "Equipe Norte - Drenagem",
      deadline: 18,
      startOffset: 27,
      endOffset: -99,
      managerId: managerIds[1] ?? managerIds[0],
      leaderId: leaderIds[1] ?? leaderIds[0],
      workforce: [
        ["Encarregado de frente", 1],
        ["Operador de retroescavadeira", 2],
        ["Ajudante operacional", 5],
        ["Motorista", 2],
      ] as Array<[string, number]>,
      services: [
        ["NOR-001", "Drenagem superficial", "m", 2600, 148, 32],
        ["NOR-002", "Recomposicao asfaltica", "m2", 4200, 92, 52],
        ["NOR-003", "Sinalizacao provisoria", "un", 160, 185, 2],
      ],
    },
    {
      name: "Adutora emergencial - Distrito Industrial",
      client: "Saneamento Regional",
      team: "Equipe Oeste - Adutora",
      deadline: 75,
      startOffset: 19,
      endOffset: -56,
      managerId: managerIds[0],
      leaderId: leaderIds[2] ?? leaderIds[0],
      workforce: [
        ["Supervisor de montagem", 1],
        ["Soldador PEAD", 2],
        ["Ajudante", 4],
        ["Operador de munck", 1],
      ] as Array<[string, number]>,
      services: [
        ["ADI-001", "Assentamento PEAD DN250", "m", 1250, 310, 24],
        ["ADI-002", "Testes de estanqueidade", "un", 28, 920, 1],
        ["ADI-003", "Travessia nao destrutiva", "m", 180, 760, 5],
      ],
    },
    {
      name: "Manutencao preventiva - Zona Leste",
      client: "Aguas Metropolitanas",
      team: "Equipe Leste - Manutencao",
      deadline: 10,
      startOffset: 12,
      endOffset: -58,
      managerId: managerIds[1] ?? managerIds[0],
      leaderId: leaderIds[0],
      workforce: [
        ["Lider de manutencao", 1],
        ["Tecnico hidraulico", 3],
        ["Auxiliar", 4],
      ] as Array<[string, number]>,
      services: [
        ["ZLE-001", "Troca de registros", "un", 90, 420, 3],
        ["ZLE-002", "Inspecao de poco de visita", "un", 140, 180, 7],
        ["ZLE-003", "Limpeza de rede", "m", 3200, 38, 110],
      ],
    },
    {
      name: "Reservatorio elevado - Parque Sul",
      client: "Consorcio Parque Sul",
      team: "Equipe Central - Estruturas",
      deadline: 6,
      startOffset: 45,
      endOffset: -135,
      managerId: managerIds[0],
      leaderId: leaderIds[1] ?? leaderIds[0],
      workforce: [
        ["Mestre de obras", 1],
        ["Armador", 3],
        ["Carpinteiro", 2],
        ["Servente", 5],
      ] as Array<[string, number]>,
      services: [
        ["RPS-001", "Fundacao em concreto", "m3", 420, 980, 6],
        ["RPS-002", "Forma e escoramento", "m2", 1800, 145, 32],
        ["RPS-003", "Montagem hidraulica", "un", 54, 780, 2],
      ],
    },
    {
      name: "Interligacoes comerciais - Centro",
      client: "Transagua Operacoes",
      team: "Equipe Centro - Atendimento",
      deadline: 45,
      startOffset: 8,
      endOffset: -37,
      managerId: managerIds[1] ?? managerIds[0],
      leaderId: leaderIds[2] ?? leaderIds[0],
      workforce: [
        ["Encarregado", 1],
        ["Instalador", 4],
        ["Motorista", 1],
      ] as Array<[string, number]>,
      services: [
        ["CEN-001", "Ligacao comercial", "un", 180, 520, 5],
        ["CEN-002", "Padronizacao de cavalete", "un", 150, 360, 4],
        ["CEN-003", "Vistoria tecnica", "un", 260, 95, 10],
      ],
    },
  ]

  return templates.map((template, contractIndex) => {
    const plannedWorkforce = createWorkforce(contractIndex, template.workforce)
    const services = template.services.map(
      ([code, name, unit, totalQuantity, unitValue, dailyGoal], serviceIndex) =>
        createService(contractIndex, serviceIndex, {
          code: String(code),
          name: String(name),
          description: `${name} com apontamento ficticio para simulacao operacional.`,
          unit: String(unit),
          totalQuantity: Number(totalQuantity),
          unitValue: Number(unitValue),
          monthlyGoal: Number(dailyGoal) * 22,
          dailyGoal: Number(dailyGoal),
        })
    )
    const now = new Date().toISOString()

    return {
      id: testId("contract", contractIndex),
      name: template.name,
      client: template.client,
      workingDaysDeadline: template.deadline,
      deadlineUnit: contractIndex === 1 || contractIndex === 4 ? "semana" : "dia",
      startDate: dateDaysAgo(template.startOffset),
      expectedEndDate: dateDaysAgo(template.endOffset),
      status: contractIndex === 3 ? "pausado" : "ativo",
      team: template.team,
      managerId: template.managerId ?? managerIds[0] ?? "",
      leaderId: template.leaderId ?? leaderIds[0] ?? "",
      employeeCount: plannedWorkforce.reduce(
        (total, role) => total + role.plannedCount,
        0
      ),
      plannedWorkforce,
      observations:
        "Registro ficticio gerado pela aba Testes para simular uso real da plataforma.",
      services,
      createdAt: now,
      updatedAt: now,
    }
  })
}

function buildExecutions(contracts: Contract[]): DailyExecution[] {
  const reasons: DeviationReason[] = [
    "chuva",
    "falta-material",
    "atraso-logistica",
    "equipe-reduzida",
    "falta-equipamento",
    "outro",
  ]

  return contracts.flatMap((contract, contractIndex) =>
    Array.from({ length: 10 }, (_, dayIndex) => {
      const date = dateDaysAgo(1 + dayIndex)
      const workforceActual = contract.plannedWorkforce.map((role, roleIndex) => ({
        roleId: role.id,
        roleName: role.roleName,
        plannedCount: role.plannedCount,
        actualCount: Math.max(
          0,
          role.plannedCount - ((contractIndex + dayIndex + roleIndex) % 5 === 0 ? 1 : 0)
        ),
      }))
      const items = contract.services.map((service, serviceIndex) => {
        const factor = [1.12, 0.94, 0.76, 1.03][
          (contractIndex + dayIndex + serviceIndex) % 4
        ]
        const realizedDaily = Number((service.dailyGoal * factor).toFixed(2))
        const belowGoal = realizedDaily < service.dailyGoal
        const reviewCompleted = (contractIndex + dayIndex + serviceIndex) % 3 === 0
        const reviewedAt = reviewCompleted ? isoForDate(date, 18) : undefined

        const deviationReason: DeviationReason | "" = belowGoal
          ? reasons[(dayIndex + serviceIndex) % reasons.length]
          : ""

        return {
          serviceId: service.id,
          realizedDaily,
          observation: belowGoal
            ? `Producao abaixo da meta por ${reasons[(dayIndex + serviceIndex) % reasons.length]}.`
            : `Frente executada conforme programacao do dia ${dayIndex + 1}.`,
          deviationReason,
          reviewObservation: reviewCompleted
            ? "Conferido pelo Gestor com base no diario de campo."
            : "",
          reviewCompleted,
          reviewedAt,
          reviewHistory:
            reviewCompleted && belowGoal
              ? [
                  {
                    id: testId(`review-${contractIndex}-${dayIndex}`, serviceIndex),
                    previousValue: Number((realizedDaily * 0.92).toFixed(2)),
                    newValue: realizedDaily,
                    reason: "Ajuste ficticio apos conferencia da medicao.",
                    changedAt: reviewedAt ?? isoForDate(date, 18),
                    changedByProfile: "manager" as const,
                  },
                ]
              : [],
        }
      })

      return {
        id: testId(`execution-${contractIndex}`, dayIndex),
        contractId: contract.id,
        date,
        items,
        workforceActual,
        closedAt: dayIndex > 1 ? isoForDate(date, 17) : undefined,
        closedByProfile: dayIndex > 1 ? ("leader" as const) : undefined,
        createdAt: isoForDate(date, 8),
        updatedAt: isoForDate(date, 17),
      }
    })
  )
}

function buildRequests(contracts: Contract[]): OperationalRequest[] {
  const titles = [
    "Entrega de tubos DN150",
    "Reposicao de diesel",
    "Retroescavadeira para frente norte",
    "Cones e cavaletes extras",
    "Bomba submersivel reserva",
    "Transporte de equipe",
  ]
  const statuses: RequestStatus[] = ["pendente", "em-atendimento", "atendido"]

  return Array.from({ length: 18 }, (_, index) => {
    const contract = contracts[index % contracts.length]
    const status = statuses[index % statuses.length]
    const date = dateDaysAgo(index % 9)
    const createdByUserId = contract.leaderId
    const history: RequestHistoryEntry[] = [
      {
        id: testId(`request-history-${index}`, 0),
        action: "Solicitacao criada",
        toStatus: "pendente" as const,
        note: "Demanda ficticia criada para validar o fluxo Lider -> Logistica.",
        changedByProfile: "leader" as const,
        changedByUserId: createdByUserId,
        changedAt: isoForDate(date, 9),
      },
    ]

    if (status !== "pendente") {
      history.push({
        id: testId(`request-history-${index}`, 1),
        action: "Status atualizado",
        fromStatus: "pendente",
        toStatus: "em-atendimento",
        note: "Logistica separou recurso e alinhou janela de entrega.",
        changedByProfile: "logistics",
        changedByUserId: logisticsUserId,
        changedAt: isoForDate(date, 11),
      })
    }

    if (status === "atendido") {
      history.push({
        id: testId(`request-history-${index}`, 2),
        action: "Status atualizado",
        fromStatus: "em-atendimento",
        toStatus: "atendido",
        note: "Atendimento concluido e validado com a frente de obra.",
        changedByProfile: "logistics",
        changedByUserId: logisticsUserId,
        changedAt: isoForDate(date, 15),
      })
    }

    return {
      id: testId("request", index),
      title: titles[index % titles.length],
      description: `${titles[index % titles.length]} para ${contract.name}.`,
      contractId: contract.id,
      date,
      status,
      createdByProfile: "leader",
      createdByUserId,
      history,
      createdAt: isoForDate(date, 9),
      updatedAt: isoForDate(date, status === "pendente" ? 9 : 15),
    }
  })
}

function buildFuelEntries(contracts: Contract[]): FuelEntry[] {
  const equipment = [
    "Retroescavadeira CAT 416",
    "Caminhao basculante VW 24280",
    "Compactador manual",
    "Gerador 55 kVA",
  ]

  return Array.from({ length: 16 }, (_, index) => {
    const date = dateDaysAgo(index % 8)
    const fuelType = index % 3 === 0 ? "gasolina" : "diesel"
    const liters = fuelType === "diesel" ? 85 + index * 4 : 36 + index * 2
    const literPrice = fuelType === "diesel" ? 6.18 : 5.74
    const now = isoForDate(date, 14)

    return {
      id: testId("fuel", index),
      contractId: contracts[index % contracts.length].id,
      date,
      station: index % 2 === 0 ? "Posto Rota Azul" : "Posto Avenida",
      fuelType,
      literPrice,
      liters,
      equipment: equipment[index % equipment.length],
      driver: ["Joao Pereira", "Marcos Silva", "Renato Nunes"][index % 3],
      plateOrTag: ["TRG-2041", "BCK-8A12", "EQP-017", "GER-055"][index % 4],
      outstandingBalance: index % 5 === 0 ? Number((liters * literPrice).toFixed(2)) : 0,
      observations: "Abastecimento ficticio para simulacao de logistica.",
      createdAt: now,
      updatedAt: now,
    }
  })
}

function buildTestData(): TestDataBundle {
  const baseContracts = buildContracts()
  const executions = buildExecutions(baseContracts)
  const contracts = syncContractProgressFromExecutions(baseContracts, executions)

  return {
    contracts,
    executions,
    requests: buildRequests(contracts),
    fuelEntries: buildFuelEntries(contracts),
  }
}

function summarize(bundle: TestDataBundle): TestDataSummary {
  return {
    contracts: bundle.contracts.length,
    executions: bundle.executions.length,
    requests: bundle.requests.length,
    fuelEntries: bundle.fuelEntries.length,
    observations: bundle.executions.reduce(
      (total, execution) =>
        total + execution.items.filter((item) => item.observation).length,
      0
    ),
    logisticsUpdates: bundle.requests.reduce(
      (total, request) =>
        total +
        request.history.filter((entry) => entry.changedByProfile === "logistics")
          .length,
      0
    ),
  }
}

export function createOperationalTestData() {
  const bundle = buildTestData()

  saveContracts(bundle.contracts)
  saveDailyExecutions(bundle.executions)
  saveOperationalRequests(bundle.requests)
  saveFuelEntries(bundle.fuelEntries)

  return summarize(bundle)
}

export function clearOperationalTestData() {
  const emptyBundle: TestDataBundle = {
    contracts: [],
    executions: [],
    requests: [],
    fuelEntries: [],
  }

  saveContracts(emptyBundle.contracts)
  saveDailyExecutions(emptyBundle.executions)
  saveOperationalRequests(emptyBundle.requests)
  saveFuelEntries(emptyBundle.fuelEntries)

  return summarize(emptyBundle)
}

export function getOperationalTestDataPreview(): TestDataSummary {
  const bundle = buildTestData()

  return summarize(bundle)
}

export function createManualTestId() {
  return `${TEST_PREFIX}:manual:${createId()}`
}
