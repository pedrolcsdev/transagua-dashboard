import { useEffect, useMemo, useState } from "react"
import { Edit3, FileText, Plus, Save, Trash2, X } from "lucide-react"

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
  contractStatusOptions,
  createEmptyContractForm,
  createEmptyService,
  createId,
  getServiceUnitValue,
  loadContracts,
  saveContracts,
  serviceUnitOptions,
  type Contract,
  type ContractFormData,
  type ContractService,
  type ContractStatus,
} from "@/lib/contracts"

const currencyFormatter = new Intl.NumberFormat("pt-BR", {
  style: "currency",
  currency: "BRL",
})

const statusLabelByValue = Object.fromEntries(
  contractStatusOptions.map((option) => [option.value, option.label])
) as Record<ContractStatus, string>

export function Contratos() {
  const [contracts, setContracts] = useState<Contract[]>(() => loadContracts())
  const [formData, setFormData] = useState<ContractFormData>(() =>
    createEmptyContractForm()
  )
  const [editingContractId, setEditingContractId] = useState<string | null>(
    null
  )

  const isEditing = Boolean(editingContractId)
  const totalServices = useMemo(
    () =>
      contracts.reduce((total, contract) => total + contract.services.length, 0),
    [contracts]
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
      startDate: contract.startDate,
      expectedEndDate: contract.expectedEndDate,
      updatedReferenceDate: contract.updatedReferenceDate,
      status: contract.status,
      team: contract.team,
      employeeCount: contract.employeeCount,
      observations: contract.observations,
      services: contract.services.length
        ? contract.services
        : [createEmptyService()],
    })
  }

  function deleteContract(contractId: string) {
    const shouldDelete = window.confirm("Excluir este contrato?")

    if (!shouldDelete) {
      return
    }

    setContracts((currentContracts) =>
      currentContracts.filter((contract) => contract.id !== contractId)
    )

    if (editingContractId === contractId) {
      resetForm()
    }
  }

  function submitContract(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const now = new Date().toISOString()
    const normalizedFormData: ContractFormData = {
      ...formData,
      name: formData.name.trim(),
      client: formData.client.trim(),
      workingDaysDeadline: Number(formData.workingDaysDeadline) || 0,
      updatedReferenceDate: formData.updatedReferenceDate,
      team: formData.team.trim(),
      employeeCount: Number(formData.employeeCount),
      observations: formData.observations.trim(),
      services: formData.services.map((service) => ({
        ...service,
        code: service.code.trim(),
        name: service.name.trim(),
        description: service.description.trim(),
        unit: service.unit.trim(),
        totalQuantity: Number(service.totalQuantity),
        contractValue: Number(service.contractValue),
        monthlyGoal: Number(service.monthlyGoal),
        dailyGoal: Number(service.dailyGoal),
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
    } else {
      const newContract: Contract = {
        id: createId(),
        ...normalizedFormData,
        createdAt: now,
        updatedAt: now,
      }

      setContracts((currentContracts) => [newContract, ...currentContracts])
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
            Cadastre contratos e seus serviços previstos. Estes dados ficam
            salvos no navegador via localStorage.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3 sm:flex">
          <Card size="sm" className="rounded-lg">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">Contratos</p>
              <p className="text-xl font-semibold">{contracts.length}</p>
            </CardContent>
          </Card>
          <Card size="sm" className="rounded-lg">
            <CardContent className="px-4">
              <p className="text-xs text-muted-foreground">Serviços</p>
              <p className="text-xl font-semibold">{totalServices}</p>
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
            {contracts.length === 0 ? (
              <div className="flex min-h-56 flex-col items-center justify-center gap-3 rounded-lg border border-dashed bg-muted/30 p-6 text-center">
                <div className="flex size-12 items-center justify-center rounded-lg bg-background text-muted-foreground">
                  <FileText />
                </div>
                <div>
                  <p className="font-medium">Nenhum contrato cadastrado</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Use o formulário ao lado para criar o primeiro contrato.
                  </p>
                </div>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nome</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Prazo</TableHead>
                    <TableHead>Equipe</TableHead>
                    <TableHead>Funcionários</TableHead>
                    <TableHead>Serviços</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {contracts.map((contract) => (
                    <TableRow key={contract.id}>
                      <TableCell>
                        <div className="flex flex-col">
                          <span className="font-medium">{contract.name}</span>
                          <span className="text-xs text-muted-foreground">
                            {contract.startDate || "Sem início"} até{" "}
                            {contract.expectedEndDate || "sem previsão"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{contract.client}</TableCell>
                      <TableCell>
                        <Badge variant="secondary">
                          {statusLabelByValue[contract.status]}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {contract.workingDaysDeadline || "-"} dias úteis
                      </TableCell>
                      <TableCell>{contract.team}</TableCell>
                      <TableCell>{contract.employeeCount}</TableCell>
                      <TableCell>{contract.services.length}</TableCell>
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
              {isEditing ? "Editar contrato" : "Novo contrato"}
            </CardTitle>
            <CardDescription>
              Informe os dados principais e os serviços do contrato.
            </CardDescription>
            {isEditing && (
              <CardAction>
                <Button type="button" variant="ghost" size="sm" onClick={resetForm}>
                  <X data-icon="inline-start" />
                  Cancelar
                </Button>
              </CardAction>
            )}
          </CardHeader>

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
                    onChange={(event) =>
                      updateField("client", event.target.value)
                    }
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="contract-start-date">
                      Data início
                    </FieldLabel>
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
                        updateField(
                          "status",
                          event.target.value as ContractStatus
                        )
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
                    <FieldLabel htmlFor="contract-working-days">
                      Prazo útil
                    </FieldLabel>
                    <Input
                      id="contract-working-days"
                      type="number"
                      min="0"
                      value={formData.workingDaysDeadline}
                      onChange={(event) =>
                        updateField(
                          "workingDaysDeadline",
                          Number(event.target.value)
                        )
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="contract-employee-count">
                      Funcionários
                    </FieldLabel>
                    <Input
                      id="contract-employee-count"
                      type="number"
                      min="1"
                      value={formData.employeeCount}
                      onChange={(event) =>
                        updateField("employeeCount", Number(event.target.value))
                      }
                      required
                    />
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

                <Field>
                  <FieldLabel htmlFor="contract-updated-reference">
                    Data de atualização
                  </FieldLabel>
                  <Input
                    id="contract-updated-reference"
                    type="date"
                    value={formData.updatedReferenceDate}
                    onChange={(event) =>
                      updateField("updatedReferenceDate", event.target.value)
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="contract-observations">
                    Observações
                  </FieldLabel>
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
                        <p className="text-sm font-medium">
                          Serviço {index + 1}
                        </p>
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

                      <div className="grid gap-4 sm:grid-cols-[120px_1fr]">
                        <Field>
                          <FieldLabel htmlFor={`service-${service.id}-code`}>
                            Item
                          </FieldLabel>
                          <Input
                            id={`service-${service.id}-code`}
                            value={service.code}
                            onChange={(event) =>
                              updateServiceField(
                                service.id,
                                "code",
                                event.target.value
                              )
                            }
                            placeholder="Item 1"
                          />
                        </Field>
                        <Field>
                          <FieldLabel htmlFor={`service-${service.id}-name`}>
                            Nome
                          </FieldLabel>
                          <Input
                            id={`service-${service.id}-name`}
                            value={service.name}
                            onChange={(event) =>
                              updateServiceField(
                                service.id,
                                "name",
                                event.target.value
                              )
                            }
                            required
                          />
                        </Field>
                      </div>

                      <Field>
                        <FieldLabel
                          htmlFor={`service-${service.id}-description`}
                        >
                          Descrição
                        </FieldLabel>
                        <textarea
                          id={`service-${service.id}-description`}
                          className="min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                          value={service.description}
                          onChange={(event) =>
                            updateServiceField(
                              service.id,
                              "description",
                              event.target.value
                            )
                          }
                          placeholder="Detalhe contratual ou observação do item"
                        />
                      </Field>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor={`service-${service.id}-unit`}>
                            Unidade
                          </FieldLabel>
                          <select
                            id={`service-${service.id}-unit`}
                            className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                            value={service.unit}
                            onChange={(event) =>
                              updateServiceField(
                                service.id,
                                "unit",
                                event.target.value
                              )
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
                          <FieldLabel
                            htmlFor={`service-${service.id}-quantity`}
                          >
                            Quantidade total
                          </FieldLabel>
                          <Input
                            id={`service-${service.id}-quantity`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.totalQuantity}
                            onChange={(event) =>
                              updateServiceField(
                                service.id,
                                "totalQuantity",
                                Number(event.target.value)
                              )
                            }
                            required
                          />
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor={`service-${service.id}-value`}>
                            Valor contratado
                          </FieldLabel>
                          <Input
                            id={`service-${service.id}-value`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.contractValue}
                            onChange={(event) =>
                              updateServiceField(
                                service.id,
                                "contractValue",
                                Number(event.target.value)
                              )
                            }
                            required
                          />
                        </Field>
                        <Field>
                          <FieldLabel
                            htmlFor={`service-${service.id}-monthly-goal`}
                          >
                            Meta mensal
                          </FieldLabel>
                          <Input
                            id={`service-${service.id}-monthly-goal`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.monthlyGoal}
                            onChange={(event) =>
                              updateServiceField(
                                service.id,
                                "monthlyGoal",
                                Number(event.target.value)
                              )
                            }
                          />
                        </Field>
                      </div>

                      <div className="grid gap-4 sm:grid-cols-2">
                        <Field>
                          <FieldLabel htmlFor={`service-${service.id}-goal`}>
                            Meta diária
                          </FieldLabel>
                          <Input
                            id={`service-${service.id}-goal`}
                            type="number"
                            min="0"
                            step="0.01"
                            value={service.dailyGoal}
                            onChange={(event) =>
                              updateServiceField(
                                service.id,
                                "dailyGoal",
                                Number(event.target.value)
                              )
                            }
                            required
                          />
                        </Field>
                        <div className="rounded-lg border bg-background p-3 text-sm">
                          <p className="text-xs text-muted-foreground">
                            Valor unitário calculado
                          </p>
                          <p className="mt-1 font-semibold">
                            {currencyFormatter.format(getServiceUnitValue(service))}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </FieldSet>
            </CardContent>

            <CardFooter className="justify-end gap-2">
              <Button type="button" variant="outline" onClick={resetForm}>
                Limpar
              </Button>
              <Button type="submit">
                <Save data-icon="inline-start" />
                {isEditing ? "Salvar alterações" : "Criar contrato"}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>

      {contracts.length > 0 && (
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Serviços por contrato</CardTitle>
            <CardDescription>
              Visualização simples dos serviços cadastrados em cada contrato.
            </CardDescription>
          </CardHeader>
          <CardContent className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {contracts.map((contract) => (
              <div key={contract.id} className="rounded-lg border p-4">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-medium">{contract.name}</p>
                    <p className="text-xs text-muted-foreground">
                      {contract.client}
                    </p>
                  </div>
                  <Badge variant="outline">
                    {statusLabelByValue[contract.status]}
                  </Badge>
                </div>
                <div className="mt-4 flex flex-col gap-3">
                  {contract.services.map((service) => (
                    <div
                      key={service.id}
                      className="rounded-lg bg-muted/40 p-3 text-sm"
                    >
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{service.name}</p>
                        <span className="text-xs text-muted-foreground">
                          {service.unit}
                        </span>
                      </div>
                      <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                        <span>Total: {service.totalQuantity}</span>
                        <span>{currencyFormatter.format(service.contractValue)}</span>
                        <span>Meta: {service.dailyGoal}</span>
                      </div>
                      <div className="mt-2 grid grid-cols-2 gap-2 text-xs text-muted-foreground">
                        <span>Mensal: {service.monthlyGoal}</span>
                        <span>
                          Unit.: {currencyFormatter.format(getServiceUnitValue(service))}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      )}
    </div>
  )
}
