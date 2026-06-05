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

  function editContract(contract: Contract) {
    setEditingContractId(contract.id)
    setFormData({
      name: contract.name,
      client: contract.client,
      workingDaysDeadline: contract.workingDaysDeadline,
      deadlineUnit: contract.deadlineUnit,
      startDate: contract.startDate,
      expectedEndDate: contract.expectedEndDate,
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
    const normalizedFormData: ContractFormData = {
      ...formData,
      name: formData.name.trim(),
      client: formData.client.trim(),
      workingDaysDeadline: Number(formData.workingDaysDeadline) || 0,
      deadlineUnit: formData.deadlineUnit,
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
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Responsáveis</TableHead>
                    <TableHead>Efetivo</TableHead>
                    <TableHead>Serviços</TableHead>
                    {canManageContracts && <TableHead className="text-right">Ações</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleContracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{contract.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {contract.client}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {statusLabelByValue[contract.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            {contract.workingDaysDeadline || "-"}{" "}
                            {getDeadlineUnitLabel(
                              contract.deadlineUnit,
                              contract.workingDaysDeadline
                            )}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contract.startDate || "Sem início"} até{" "}
                            {contract.expectedEndDate || "sem previsão"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{contract.team}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>
                            Gestor: {getUserById(contract.managerId)?.name ?? "-"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Líder: {getUserById(contract.leaderId)?.name ?? "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">
                            {getPlannedWorkforceTotal(contract.plannedWorkforce)} pessoas
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {contract.plannedWorkforce
                              .map(
                                (role) =>
                                  `${role.plannedCount} ${role.roleName || "Função"}`
                              )
                              .join(" · ")}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{contract.services.length}</TableCell>
                      {canManageContracts && (
                        <TableCell>
                          <div className="flex justify-end gap-2">
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => editContract(contract)}
                            >
                              <Edit3 data-icon="inline-start" />
                              Editar
                            </Button>
                            <Button
                              type="button"
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteContract(contract.id)}
                            >
                              <Trash2 data-icon="inline-start" />
                              Excluir
                            </Button>
                          </div>
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
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
            {canManageContracts && isEditing && (
              <CardAction>
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  <X data-icon="inline-start" />
                  Cancelar
                </Button>
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
                        type="date"
                        value={formData.startDate}
                        onChange={(event) =>
                          updateField("startDate", event.target.value)
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
                        type="date"
                        value={formData.expectedEndDate}
                        onChange={(event) =>
                          updateField("expectedEndDate", event.target.value)
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
