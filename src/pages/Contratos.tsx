import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Edit3, FileText, Plus, Save, Trash2, Users, X } from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel, FieldSet } from "@/components/ui/field"
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
  CONTRACTS_STORAGE_KEY,
  contractDeadlineUnitOptions,
  contractStatusOptions,
  createEmptyContractForm,
  createEmptyPlannedWorkforceRole,
  createEmptyService,
  createId,
  getContractsForUser,
  getDeadlineUnitLabel,
  getPlannedWorkforceTotal,
  getServiceContractValue,
  loadContracts,
  saveContracts,
  serviceUnitOptions,
  type Contract,
  type ContractDeadlineUnit,
  type ContractFormData,
  type ContractService,
  type ContractStatus,
  type PlannedWorkforceRole,
} from "@/lib/contracts"
import {
  formatDateBR,
  maskDateInputValue,
  normalizeDateForInput,
} from "@/lib/dates"
import { hasCapability } from "@/lib/permissions"
import { getUserById, getUsersByProfile, type AppUser } from "@/lib/profile"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const statusLabelByValue = Object.fromEntries(
  contractStatusOptions.map((option) => [option.value, option.label])
) as Record<ContractStatus, string>

type ContratosProps = {
  currentUser: AppUser
}

function getNumberInputValue(value: number) {
  return value === 0 ? "" : String(value)
}

type TestContractTemplateId = "test-1" | "test-2"

function createService(
  service: Omit<ContractService, "id" | "contractValue">
): ContractService {
  return {
    id: createId(),
    ...service,
    contractValue: Number(service.totalQuantity) * Number(service.unitValue),
  }
}

function createWorkforceRole(
  roleName: string,
  plannedCount: number
): PlannedWorkforceRole {
  return {
    id: createId(),
    roleName,
    plannedCount,
  }
}

function buildTestContractTemplate(
  templateId: TestContractTemplateId,
  managerOptions: AppUser[],
  leaderOptions: AppUser[]
): ContractFormData {
  const primaryManager = managerOptions[0]?.id ?? ""
  const secondaryManager = managerOptions[1]?.id ?? primaryManager
  const primaryLeader = leaderOptions[0]?.id ?? ""
  const secondaryLeader = leaderOptions[1]?.id ?? primaryLeader

  if (templateId === "test-2") {
    const plannedWorkforce = [
      createWorkforceRole("Encarregado de frente", 1),
      createWorkforceRole("Operador de retroescavadeira", 2),
      createWorkforceRole("Ajudante operacional", 5),
      createWorkforceRole("Motorista", 2),
    ]

    return {
      name: "Contrato teste 2 - Setor Norte",
      client: "Prefeitura Municipal de Vale Verde",
      workingDaysDeadline: 18,
      deadlineUnit: "semana",
      startDate: formatDateBR("2026-07-08", ""),
      expectedEndDate: formatDateBR("2026-11-11", ""),
      status: "ativo",
      team: "Equipe Norte - Drenagem e recomposição",
      managerId: secondaryManager,
      leaderId: secondaryLeader,
      employeeCount: getPlannedWorkforceTotal(plannedWorkforce),
      plannedWorkforce,
      observations:
        "Modelo de teste para contrato com foco em recomposição viária, drenagem superficial e atendimento em vias com tráfego local.",
      services: [
        createService({
          code: "NOR-001",
          name: "Drenagem superficial",
          description:
            "Execução de sarjetas, caixas coletoras e interligações para escoamento pluvial.",
          unit: "m",
          totalQuantity: 2600,
          unitValue: 148,
          monthlyGoal: 650,
          dailyGoal: 32,
          completedQuantity: 180,
        }),
        createService({
          code: "NOR-002",
          name: "Recomposição asfáltica",
          description:
            "Regularização de base, imprimação e recomposição asfáltica em trechos intervenientes.",
          unit: "m²",
          totalQuantity: 4200,
          unitValue: 92,
          monthlyGoal: 1050,
          dailyGoal: 52,
          completedQuantity: 240,
        }),
        createService({
          code: "NOR-003",
          name: "Sinalização provisória",
          description:
            "Instalação, manutenção e retirada de sinalização temporária de obra.",
          unit: "un",
          totalQuantity: 160,
          unitValue: 185,
          monthlyGoal: 40,
          dailyGoal: 2,
          completedQuantity: 12,
        }),
      ],
    }
  }

  const plannedWorkforce = [
    createWorkforceRole("Encarregado geral", 1),
    createWorkforceRole("Pedreiro", 3),
    createWorkforceRole("Servente", 6),
    createWorkforceRole("Operador de compactador", 1),
  ]

  return {
    name: "Contrato teste 1 - Vila Esperança",
    client: "Companhia Águas do Litoral",
    workingDaysDeadline: 90,
    deadlineUnit: "dia",
    startDate: formatDateBR("2026-06-15", ""),
    expectedEndDate: formatDateBR("2026-09-28", ""),
    status: "ativo",
    team: "Equipe Sul - Rede coletora",
    managerId: primaryManager,
    leaderId: primaryLeader,
    employeeCount: getPlannedWorkforceTotal(plannedWorkforce),
    plannedWorkforce,
    observations:
      "Modelo de teste para contrato com implantação de rede, ligações domiciliares e recomposição de calçadas.",
    services: [
      createService({
        code: "VES-001",
        name: "Implantação de rede coletora",
        description:
          "Escavação, assentamento de tubulação PVC DN150 e reaterro compactado.",
        unit: "m",
        totalQuantity: 1800,
        unitValue: 215,
        monthlyGoal: 600,
        dailyGoal: 30,
        completedQuantity: 120,
      }),
      createService({
        code: "VES-002",
        name: "Ligações domiciliares",
        description:
          "Execução de ramais prediais, caixas de inspeção e conexão à rede principal.",
        unit: "un",
        totalQuantity: 220,
        unitValue: 680,
        monthlyGoal: 74,
        dailyGoal: 4,
        completedQuantity: 18,
      }),
      createService({
        code: "VES-003",
        name: "Recomposição de passeio",
        description:
          "Recomposição de calçadas em concreto desempenado após intervenção da rede.",
        unit: "m²",
        totalQuantity: 950,
        unitValue: 125,
        monthlyGoal: 315,
        dailyGoal: 16,
        completedQuantity: 64,
      }),
    ],
  }
}

export function Contratos({ currentUser }: ContratosProps) {
  const [contracts, setContracts] = useState<Contract[]>(() => loadContracts())
  const [formData, setFormData] = useState<ContractFormData>(() =>
    createEmptyContractForm()
  )
  const [editingContractId, setEditingContractId] = useState<string | null>(
    null
  )
  const [feedback, setFeedback] = useState("")

  const profile = currentUser.profile
  const canManageContracts = hasCapability(profile, "contracts.manage")
  const isEditing = Boolean(editingContractId)
  const visibleContracts = useMemo(
    () => getContractsForUser(contracts, currentUser),
    [contracts, currentUser]
  )
  const managerOptions = getUsersByProfile("manager")
  const leaderOptions = getUsersByProfile("leader")
  const totalServices = useMemo(
    () =>
      visibleContracts.reduce(
        (total, contract) => total + contract.services.length,
        0
      ),
    [visibleContracts]
  )
  const totalPlannedWorkforce = useMemo(
    () =>
      visibleContracts.reduce(
        (total, contract) => total + getPlannedWorkforceTotal(contract.plannedWorkforce),
        0
      ),
    [visibleContracts]
  )

  useEffect(() => {
    saveContracts(contracts)
  }, [contracts])

  function updateField<K extends keyof ContractFormData>(
    field: K,
    value: ContractFormData[K]
  ) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))
  }

  function updateServiceField<K extends keyof ContractService>(
    serviceId: string,
    field: K,
    value: ContractService[K]
  ) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      services: currentFormData.services.map((service) =>
        service.id === serviceId ? { ...service, [field]: value } : service
      ),
    }))
  }

  function updateWorkforceField<K extends keyof PlannedWorkforceRole>(
    workforceId: string,
    field: K,
    value: PlannedWorkforceRole[K]
  ) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      plannedWorkforce: currentFormData.plannedWorkforce.map((role) =>
        role.id === workforceId ? { ...role, [field]: value } : role
      ),
    }))
  }

  function addService() {
    setFormData((currentFormData) => ({
      ...currentFormData,
      services: [...currentFormData.services, createEmptyService()],
    }))
  }

  function removeService(serviceId: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      services:
        currentFormData.services.length === 1
          ? currentFormData.services
          : currentFormData.services.filter((service) => service.id !== serviceId),
    }))
  }

  function addWorkforceRole() {
    setFormData((currentFormData) => ({
      ...currentFormData,
      plannedWorkforce: [
        ...currentFormData.plannedWorkforce,
        createEmptyPlannedWorkforceRole(),
      ],
    }))
  }

  function removeWorkforceRole(workforceId: string) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      plannedWorkforce:
        currentFormData.plannedWorkforce.length === 1
          ? currentFormData.plannedWorkforce
          : currentFormData.plannedWorkforce.filter((role) => role.id !== workforceId),
    }))
  }

  function resetForm() {
    setEditingContractId(null)
    setFormData(createEmptyContractForm())
  }

  function loadTestContractTemplate(templateId: TestContractTemplateId) {
    if (!canManageContracts || currentUser.profile !== "director") {
      return
    }

    setEditingContractId(null)
    setFormData(
      buildTestContractTemplate(templateId, managerOptions, leaderOptions)
    )
    setFeedback(
      templateId === "test-1"
        ? "Contrato teste 1 carregado no formulário."
        : "Contrato teste 2 carregado no formulário."
    )
  }

  function editContract(contract: Contract) {
    setEditingContractId(contract.id)
    setFormData({
      name: contract.name,
      client: contract.client,
      workingDaysDeadline: contract.workingDaysDeadline,
      deadlineUnit: contract.deadlineUnit,
      startDate: formatDateBR(contract.startDate, ""),
      expectedEndDate: formatDateBR(contract.expectedEndDate, ""),
      status: contract.status,
      team: contract.team,
      managerId: contract.managerId,
      leaderId: contract.leaderId,
      employeeCount: contract.employeeCount,
      plannedWorkforce: contract.plannedWorkforce.length
        ? contract.plannedWorkforce
        : [createEmptyPlannedWorkforceRole()],
      observations: contract.observations,
      services: contract.services.length
        ? contract.services
        : [createEmptyService()],
    })
  }

  function deleteContract(contractId: string) {
    if (!canManageContracts) {
      return
    }

    const shouldDelete = window.confirm("Excluir este contrato?")

    if (!shouldDelete) {
      return
    }

    setContracts((currentContracts) =>
      currentContracts.filter((contract) => contract.id !== contractId)
    )
    setFeedback("Contrato removido.")

    if (editingContractId === contractId) {
      resetForm()
    }
  }

  function submitContract(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canManageContracts) {
      return
    }

    const normalizedWorkforce = formData.plannedWorkforce
      .map((role) => ({
        ...role,
        roleName: role.roleName.trim(),
        plannedCount: Math.max(0, Number(role.plannedCount) || 0),
      }))
      .filter((role) => role.roleName.length > 0)

    if (normalizedWorkforce.length === 0) {
      window.alert("Informe ao menos uma função no efetivo planejado.")
      return
    }

    const employeeCount = getPlannedWorkforceTotal(normalizedWorkforce)

    if (employeeCount <= 0) {
      window.alert("O efetivo planejado deve ter pelo menos uma pessoa.")
      return
    }

    const now = new Date().toISOString()
    const normalizedStartDate = normalizeDateForInput(formData.startDate)
    const normalizedExpectedEndDate = normalizeDateForInput(
      formData.expectedEndDate
    )

    if (
      !/^\d{4}-\d{2}-\d{2}$/.test(normalizedStartDate) ||
      !/^\d{4}-\d{2}-\d{2}$/.test(normalizedExpectedEndDate)
    ) {
      window.alert("Informe as datas no formato dia/mes/ano.")
      return
    }

    const normalizedFormData: ContractFormData = {
      ...formData,
      name: formData.name.trim(),
      client: formData.client.trim(),
      workingDaysDeadline: Number(formData.workingDaysDeadline) || 0,
      deadlineUnit: formData.deadlineUnit,
      startDate: normalizedStartDate,
      expectedEndDate: normalizedExpectedEndDate,
      team: formData.team.trim(),
      managerId: formData.managerId,
      leaderId: formData.leaderId,
      employeeCount,
      plannedWorkforce: normalizedWorkforce,
      observations: formData.observations.trim(),
      services: formData.services.map((service) => ({
        ...service,
        code: service.code.trim(),
        name: service.name.trim(),
        description: service.description.trim(),
        unit: service.unit.trim(),
        totalQuantity: Number(service.totalQuantity),
        unitValue: Number(service.unitValue),
        contractValue: getServiceContractValue(service),
        monthlyGoal: Number(service.monthlyGoal),
        dailyGoal: Number(service.dailyGoal),
        completedQuantity: Number(service.completedQuantity),
      })),
    }

    if (editingContractId) {
      setContracts((currentContracts) =>
        currentContracts.map((contract) =>
          contract.id === editingContractId
            ? {
                ...contract,
                ...normalizedFormData,
                updatedAt: now,
              }
            : contract
        )
      )
      setFeedback("Contrato atualizado com sucesso.")
    } else {
      const newContract: Contract = {
        id: createId(),
        ...normalizedFormData,
        createdAt: now,
        updatedAt: now,
      }

      setContracts((currentContracts) => [newContract, ...currentContracts])
      setFeedback("Contrato criado com sucesso.")
    }

    resetForm()
  }

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Gestão operacional
          </p>
          <h2 className="text-2xl font-semibold text-[#102f31]">Contratos</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted-foreground">
            O Coordenador define prazo, metas, equipe, Gestor e Líder
            responsáveis. Cada perfil acompanha apenas as obras atribuídas.
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3">
          <Card size="sm" className="rounded-lg">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">Contratos</p>
              <p className="text-xl font-semibold">{visibleContracts.length}</p>
            </CardContent>
          </Card>
          <Card size="sm" className="rounded-lg">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">Serviços</p>
              <p className="text-xl font-semibold">{totalServices}</p>
            </CardContent>
          </Card>
          <Card size="sm" className="rounded-lg">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">Efetivo</p>
              <p className="text-xl font-semibold">{totalPlannedWorkforce}</p>
            </CardContent>
          </Card>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[minmax(0,1fr)_420px]">
        <Card className="rounded-lg border-[#d7e5e5] shadow-[0_12px_36px_rgba(12,55,56,0.06)]">
          <CardHeader>
            <CardTitle>Lista de contratos</CardTitle>
            <CardDescription>
              Contratos cadastrados em {CONTRACTS_STORAGE_KEY}.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visibleContracts.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-lg bg-background text-muted-foreground">
                  <FileText />
                </div>
                <div>
                  <p className="font-medium">Nenhum contrato disponível</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {canManageContracts
                      ? "Use o formulário ao lado para criar o primeiro contrato."
                      : "As obras atribuídas a este usuário aparecerão aqui."}
                  </p>
                </div>
              </div>
            ) : (
              <div className="[&_[data-slot=table-container]]:overflow-x-hidden">
                <Table className="table-fixed">
                  <colgroup>
                    <col className="w-[24%]" />
                    <col className="w-[12%]" />
                    <col className="w-[18%]" />
                    <col className="w-[17%]" />
                    <col className="w-[19%]" />
                    <col className="w-[10%]" />
                  </colgroup>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Prazo</TableHead>
                      <TableHead>Equipe</TableHead>
                      <TableHead>Responsáveis</TableHead>
                      <TableHead>Efetivo</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {visibleContracts.map((contract) => (
                      <TableRow key={contract.id} className="group">
                      <TableCell className="relative min-w-0 overflow-hidden">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate font-medium" title={contract.name}>
                            {contract.name}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contract.client}
                          </span>
                        </div>
                        {canManageContracts && (
                          <div className="absolute right-1 top-1/2 flex -translate-y-1/2 gap-1 rounded-md bg-card/95 p-1 opacity-0 shadow-sm ring-1 ring-border transition-opacity group-hover:opacity-100 group-focus-within:opacity-100">
                            <Button
                              type="button"
                              variant="outline"
                              size="icon-sm"
                              onClick={() => editContract(contract)}
                              title="Editar contrato"
                            >
                              <Edit3 />
                              <span className="sr-only">Editar contrato</span>
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="icon-sm"
                              onClick={() => deleteContract(contract.id)}
                              title="Excluir contrato"
                            >
                              <Trash2 />
                              <span className="sr-only">Excluir contrato</span>
                            </Button>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="overflow-hidden">
                        <Badge variant="secondary">
                          {statusLabelByValue[contract.status]}
                        </Badge>
                      </TableCell>
                      <TableCell className="min-w-0 overflow-hidden">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">
                            {contract.workingDaysDeadline || "-"}{" "}
                            {getDeadlineUnitLabel(
                              contract.deadlineUnit,
                              contract.workingDaysDeadline
                            )}
                          </span>
                          <span className="truncate text-xs text-muted-foreground">
                            {formatDateBR(contract.startDate, "Sem início")} até{" "}
                            {formatDateBR(contract.expectedEndDate, "sem previsão")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="min-w-0 overflow-hidden">
                        <span className="block truncate" title={contract.team}>
                          {contract.team}
                        </span>
                      </TableCell>
                      <TableCell className="min-w-0 overflow-hidden">
                        <div className="flex min-w-0 flex-col">
                          <span className="truncate">
                            Gestor: {getUserById(contract.managerId)?.name ?? "-"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Líder: {getUserById(contract.leaderId)?.name ?? "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell className="overflow-hidden">
                        <div className="flex flex-col leading-tight">
                          <span className="font-medium">
                            {getPlannedWorkforceTotal(contract.plannedWorkforce)}
                          </span>
                          <span className="text-xs text-muted-foreground">pessoas</span>
                        </div>
                      </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="rounded-lg border-[#d7e5e5] shadow-[0_12px_36px_rgba(12,55,56,0.06)] xl:sticky xl:top-24 xl:self-start">
          <CardHeader>
            <CardTitle>
              {canManageContracts
                ? isEditing
                  ? "Editar contrato"
                  : "Novo contrato"
                : "Carteira em acompanhamento"}
            </CardTitle>
            <CardDescription>
              {canManageContracts
                ? "Informe dados principais, efetivo planejado e serviços do contrato."
                : "Este perfil acompanha os contratos disponíveis para o usuário selecionado."}
            </CardDescription>
            {canManageContracts && (currentUser.profile === "director" || isEditing) && (
              <CardAction>
                <div className="flex flex-wrap justify-end gap-2">
                  {currentUser.profile === "director" && (
                    <>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => loadTestContractTemplate("test-1")}
                      >
                        Contrato teste 1
                      </Button>
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => loadTestContractTemplate("test-2")}
                      >
                        Contrato teste 2
                      </Button>
                    </>
                  )}
                  {isEditing && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={resetForm}
                    >
                      <X data-icon="inline-start" />
                      Cancelar
                    </Button>
                  )}
                </div>
              </CardAction>
            )}
          </CardHeader>

          {canManageContracts ? (
            <form onSubmit={submitContract}>
              <CardContent className="flex flex-col gap-6">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="contract-name">Nome</FieldLabel>
                    <Input
                      id="contract-name"
                      value={formData.name}
                      onChange={(event) => updateField("name", event.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="contract-client">Cliente</FieldLabel>
                    <Input
                      id="contract-client"
                      value={formData.client}
                      onChange={(event) => updateField("client", event.target.value)}
                      required
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="contract-start-date">Data início</FieldLabel>
                      <Input
                        id="contract-start-date"
                        type="text"
                        inputMode="numeric"
                        placeholder="dd/mm/aaaa"
                        maxLength={10}
                        value={formData.startDate}
                        onChange={(event) =>
                          updateField(
                            "startDate",
                            maskDateInputValue(event.target.value)
                          )
                        }
                        required
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="contract-end-date">
                        Data fim prevista
                      </FieldLabel>
                      <Input
                        id="contract-end-date"
                        type="text"
                        inputMode="numeric"
                        placeholder="dd/mm/aaaa"
                        maxLength={10}
                        value={formData.expectedEndDate}
                        onChange={(event) =>
                          updateField(
                            "expectedEndDate",
                            maskDateInputValue(event.target.value)
                          )
                        }
                        required
                      />
                    </Field>
                  </div>

                  <div className="grid gap-4 sm:grid-cols-3">
                    <Field>
                      <FieldLabel htmlFor="contract-status">Status</FieldLabel>
                      <select
                        id="contract-status"
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={formData.status}
                        onChange={(event) =>
                          updateField("status", event.target.value as ContractStatus)
                        }
                      >
                        {contractStatusOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="contract-working-days">Prazo útil</FieldLabel>
                      <Input
                        id="contract-working-days"
                        type="number"
                        min="0"
                        value={getNumberInputValue(formData.workingDaysDeadline)}
                        onChange={(event) =>
                          updateField(
                            "workingDaysDeadline",
                            event.target.value === ""
                              ? 0
                              : Number(event.target.value)
                          )
                        }
                      />
                    </Field>
                    <Field>
                      <FieldLabel htmlFor="contract-deadline-unit">
                        Medida do prazo
                      </FieldLabel>
                      <select
                        id="contract-deadline-unit"
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={formData.deadlineUnit}
                        onChange={(event) =>
                          updateField(
                            "deadlineUnit",
                            event.target.value as ContractDeadlineUnit
                          )
                        }
                      >
                        {contractDeadlineUnitOptions.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="contract-team">Equipe</FieldLabel>
                    <Input
                      id="contract-team"
                      value={formData.team}
                      onChange={(event) => updateField("team", event.target.value)}
                      required
                    />
                  </Field>

                  <div className="grid gap-4 sm:grid-cols-2">
                    <Field>
                      <FieldLabel htmlFor="contract-manager">
                        Gestor responsável
                      </FieldLabel>
                      <select
                        id="contract-manager"
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={formData.managerId}
                        onChange={(event) =>
                          updateField("managerId", event.target.value)
                        }
                        required
                      >
                        {managerOptions.map((manager) => (
                          <option key={manager.id} value={manager.id}>
                            {manager.name}
                          </option>
                        ))}
                      </select>
                    </Field>

                    <Field>
                      <FieldLabel htmlFor="contract-leader">
                        Líder responsável
                      </FieldLabel>
                      <select
                        id="contract-leader"
                        className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                        value={formData.leaderId}
                        onChange={(event) =>
                          updateField("leaderId", event.target.value)
                        }
                        required
                      >
                        {leaderOptions.map((leader) => (
                          <option key={leader.id} value={leader.id}>
                            {leader.name}
                          </option>
                        ))}
                      </select>
                    </Field>
                  </div>

                  <Field>
                    <FieldLabel htmlFor="contract-observations">Observações</FieldLabel>
                    <textarea
                      id="contract-observations"
                      className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={formData.observations}
                      onChange={(event) =>
                        updateField("observations", event.target.value)
                      }
                      placeholder="Observações operacionais do contrato"
                    />
                  </Field>
                </FieldGroup>

                <FieldSet className="gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Efetivo planejado</h3>
                      <p className="text-xs text-muted-foreground">
                        Defina o quadro previsto por função para comparação diária.
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={addWorkforceRole}
                    >
                      <Plus data-icon="inline-start" />
                      Função
                    </Button>
                  </div>

                  <div className="flex flex-col gap-3">
                    {formData.plannedWorkforce.map((role, index) => (
                      <div
                        key={role.id}
                        className="grid gap-3 rounded-lg border bg-muted/20 p-3 sm:grid-cols-[1fr_120px_auto]"
                      >
                        <Field>
                          <FieldLabel htmlFor={`workforce-role-${role.id}`}>
                            Função {index + 1}
                          </FieldLabel>
                          <Input
                            id={`workforce-role-${role.id}`}
                            value={role.roleName}
                            onChange={(event) =>
                              updateWorkforceField(
                                role.id,
                                "roleName",
                                event.target.value
                              )
                            }
                            placeholder="Líder, Operador, Servente"
                            required
                          />
                        </Field>

                        <Field>
                          <FieldLabel htmlFor={`workforce-count-${role.id}`}>
                            Quantidade
                          </FieldLabel>
                          <Input
                            id={`workforce-count-${role.id}`}
                            type="number"
                            min="0"
                            value={getNumberInputValue(role.plannedCount)}
                            onChange={(event) =>
                              updateWorkforceField(
                                role.id,
                                "plannedCount",
                                event.target.value === ""
                                  ? 0
                                  : Number(event.target.value)
                              )
                            }
                            required
                          />
                        </Field>

                        <div className="flex items-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeWorkforceRole(role.id)}
                            disabled={formData.plannedWorkforce.length === 1}
                            aria-label="Remover função"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                    <p className="text-xs text-muted-foreground">Total planejado</p>
                    <p className="mt-1 flex items-center gap-2 text-lg font-semibold">
                      <Users className="size-4" />
                      {getPlannedWorkforceTotal(formData.plannedWorkforce)} pessoas
                    </p>
                  </div>
                </FieldSet>

                <FieldSet className="gap-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <h3 className="text-sm font-semibold">Serviços</h3>
                      <p className="text-xs text-muted-foreground">
                        Adicione os serviços previstos dentro do contrato.
                      </p>
                    </div>
                    <Button type="button" variant="outline" size="sm" onClick={addService}>
                      <Plus data-icon="inline-start" />
                      Serviço
                    </Button>
                  </div>

                  <div className="flex flex-col gap-4">
                    {formData.services.map((service, index) => (
                      <div
                        key={service.id}
                        className="flex flex-col gap-4 rounded-lg border bg-muted/20 p-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <p className="text-sm font-medium">Serviço {index + 1}</p>
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => removeService(service.id)}
                            disabled={formData.services.length === 1}
                            aria-label="Remover serviço"
                          >
                            <Trash2 />
                          </Button>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-2">
                          <Field>
                            <FieldLabel htmlFor={`service-code-${service.id}`}>
                              Código
                            </FieldLabel>
                            <Input
                              id={`service-code-${service.id}`}
                              value={service.code}
                              onChange={(event) =>
                                updateServiceField(service.id, "code", event.target.value)
                              }
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`service-name-${service.id}`}>
                              Nome
                            </FieldLabel>
                            <Input
                              id={`service-name-${service.id}`}
                              value={service.name}
                              onChange={(event) =>
                                updateServiceField(service.id, "name", event.target.value)
                              }
                              required
                            />
                          </Field>
                        </div>

                        <Field>
                          <FieldLabel htmlFor={`service-description-${service.id}`}>
                            Descrição
                          </FieldLabel>
                          <textarea
                            id={`service-description-${service.id}`}
                            className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            value={service.description}
                            onChange={(event) =>
                              updateServiceField(
                                service.id,
                                "description",
                                event.target.value
                              )
                            }
                          />
                        </Field>

                        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
                          <Field>
                            <FieldLabel htmlFor={`service-unit-${service.id}`}>
                              Unidade
                            </FieldLabel>
                            <select
                              id={`service-unit-${service.id}`}
                              className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                              value={service.unit}
                              onChange={(event) =>
                                updateServiceField(service.id, "unit", event.target.value)
                              }
                            >
                              {serviceUnitOptions.map((unit) => (
                                <option key={unit} value={unit}>
                                  {unit}
                                </option>
                              ))}
                            </select>
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`service-total-${service.id}`}>
                              Quantidade total
                            </FieldLabel>
                            <Input
                              id={`service-total-${service.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={getNumberInputValue(service.totalQuantity)}
                              onChange={(event) =>
                                updateServiceField(
                                  service.id,
                                  "totalQuantity",
                                  event.target.value === ""
                                    ? 0
                                    : Number(event.target.value)
                                )
                              }
                              required
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`service-value-${service.id}`}>
                              Valor unitário
                            </FieldLabel>
                            <Input
                              id={`service-value-${service.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={getNumberInputValue(service.unitValue)}
                              onChange={(event) =>
                                updateServiceField(
                                  service.id,
                                  "unitValue",
                                  event.target.value === ""
                                    ? 0
                                    : Number(event.target.value)
                                )
                              }
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`service-unit-value-${service.id}`}>
                              Valor contratado
                            </FieldLabel>
                            <Input
                              id={`service-unit-value-${service.id}`}
                              value={currencyFormatter.format(
                                getServiceContractValue(service)
                              )}
                              readOnly
                            />
                          </Field>
                        </div>

                        <div className="grid gap-4 sm:grid-cols-3">
                          <Field>
                            <FieldLabel htmlFor={`service-monthly-goal-${service.id}`}>
                              Meta mensal
                            </FieldLabel>
                            <Input
                              id={`service-monthly-goal-${service.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={getNumberInputValue(service.monthlyGoal)}
                              onChange={(event) =>
                                updateServiceField(
                                  service.id,
                                  "monthlyGoal",
                                  event.target.value === ""
                                    ? 0
                                    : Number(event.target.value)
                                )
                              }
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`service-daily-goal-${service.id}`}>
                              Meta diária
                            </FieldLabel>
                            <Input
                              id={`service-daily-goal-${service.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={getNumberInputValue(service.dailyGoal)}
                              onChange={(event) =>
                                updateServiceField(
                                  service.id,
                                  "dailyGoal",
                                  event.target.value === ""
                                    ? 0
                                    : Number(event.target.value)
                                )
                              }
                            />
                          </Field>
                          <Field>
                            <FieldLabel htmlFor={`service-completed-${service.id}`}>
                              Realizado acumulado
                            </FieldLabel>
                            <Input
                              id={`service-completed-${service.id}`}
                              type="number"
                              min="0"
                              step="0.01"
                              value={getNumberInputValue(
                                service.completedQuantity
                              )}
                              onChange={(event) =>
                                updateServiceField(
                                  service.id,
                                  "completedQuantity",
                                  event.target.value === ""
                                    ? 0
                                    : Number(event.target.value)
                                )
                              }
                            />
                          </Field>
                        </div>
                      </div>
                    ))}
                  </div>
                </FieldSet>

                {feedback && (
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {feedback}
                  </div>
                )}
              </CardContent>

              <CardFooter className="justify-end gap-2">
                <Button type="submit">
                  <Save data-icon="inline-start" />
                  {isEditing ? "Salvar alterações" : "Criar contrato"}
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                Apenas o perfil Coordenador pode criar, editar e excluir
                contratos. Os demais perfis acompanham serviços, prazo e efetivo
                planejado conforme suas obras atribuídas.
              </div>

              {feedback && (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {feedback}
                </div>
              )}
            </CardContent>
          )}
        </Card>
      </div>
    </div>
  )
}
