import { useEffect, useMemo, useState, type FormEvent } from "react"
import { ClipboardList, Edit3, PackageOpen, Save, X } from "lucide-react"

import { MetricCard } from "@/components/MetricCard"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/StateViews"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
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
import { createId, getContractsForUser, loadContracts } from "@/lib/contracts"
import { hasCapability } from "@/lib/permissions"
import { getProfileLabel, getUserById, type AppUser } from "@/lib/profile"
import {
  createEmptyOperationalRequestForm,
  createOperationalRequest,
  loadOperationalRequests,
  requestStatusOptions,
  saveOperationalRequests,
  type OperationalRequest,
  type OperationalRequestFormData,
  type RequestStatus,
} from "@/lib/requests"

const statusClassNameByValue: Record<RequestStatus, string> = {
  pendente: "border-amber-200 bg-amber-50 text-amber-800",
  "em-atendimento": "border-sky-200 bg-sky-50 text-sky-800",
  atendido: "border-emerald-200 bg-emerald-50 text-emerald-800",
}

const statusLabelByValue = Object.fromEntries(
  requestStatusOptions.map((option) => [option.value, option.label])
) as Record<RequestStatus, string>

type SolicitacoesProps = {
  currentUser: AppUser
}

export function Solicitacoes({ currentUser }: SolicitacoesProps) {
  const [contracts] = useState(() => loadContracts())
  const [requests, setRequests] = useState<OperationalRequest[]>(() =>
    loadOperationalRequests()
  )
  const profile = currentUser.profile
  const visibleContracts = useMemo(
    () => getContractsForUser(contracts, currentUser),
    [contracts, currentUser]
  )
  const visibleContractIds = useMemo(
    () => new Set(visibleContracts.map((contract) => contract.id)),
    [visibleContracts]
  )
  const visibleRequests = useMemo(
    () =>
      requests.filter((request) => visibleContractIds.has(request.contractId)),
    [requests, visibleContractIds]
  )
  const firstContractId = visibleContracts[0]?.id ?? ""
  const [formData, setFormData] = useState<OperationalRequestFormData>(() =>
    createEmptyOperationalRequestForm(firstContractId)
  )
  const [editFormData, setEditFormData] =
    useState<OperationalRequestFormData>(() =>
      createEmptyOperationalRequestForm(firstContractId)
    )
  const [editingRequestId, setEditingRequestId] = useState<string | null>(null)
  const [editNote, setEditNote] = useState("")
  const [editError, setEditError] = useState("")
  const [statusDrafts, setStatusDrafts] = useState<Record<string, RequestStatus>>({})
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState("")

  const canCreateRequests = hasCapability(profile, "requests.create")
  const canEditRequests = hasCapability(profile, "requests.edit")
  const canUpdateStatus = hasCapability(profile, "requests.update-status")
  const editingRequest = requests.find((request) => request.id === editingRequestId)
  const showSidebarCard = canCreateRequests || Boolean(editingRequest)

  const pendingCount = useMemo(
    () =>
      visibleRequests.filter((request) => request.status === "pendente").length,
    [visibleRequests]
  )
  const inProgressCount = useMemo(
    () =>
      visibleRequests.filter((request) => request.status === "em-atendimento")
        .length,
    [visibleRequests]
  )
  const attendedCount = useMemo(
    () =>
      visibleRequests.filter((request) => request.status === "atendido").length,
    [visibleRequests]
  )

  useEffect(() => {
    saveOperationalRequests(requests)
  }, [requests])

  function updateField<K extends keyof OperationalRequestFormData>(
    field: K,
    value: OperationalRequestFormData[K]
  ) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))
  }

  function updateEditField<K extends keyof OperationalRequestFormData>(
    field: K,
    value: OperationalRequestFormData[K]
  ) {
    setEditFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))
    setEditError("")
  }

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canCreateRequests) {
      return
    }

    const nextRequest = createOperationalRequest(formData, currentUser)

    setRequests((currentRequests) => [nextRequest, ...currentRequests])
    setFormData(createEmptyOperationalRequestForm(formData.contractId))
    setFeedback("Solicitação criada com sucesso.")
  }

  function startEditingRequest(request: OperationalRequest) {
    if (!canEditRequests) {
      return
    }

    setEditingRequestId(request.id)
    setEditFormData({
      title: request.title,
      description: request.description,
      contractId: request.contractId,
      date: request.date,
    })
    setEditNote("")
    setEditError("")
    setFeedback("")
  }

  function cancelEditingRequest() {
    setEditingRequestId(null)
    setEditFormData(createEmptyOperationalRequestForm(firstContractId))
    setEditNote("")
    setEditError("")
  }

  function submitRequestEdit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canEditRequests || !editingRequest) {
      return
    }

    const normalizedNote = editNote.trim()

    if (normalizedNote.length === 0) {
      setEditError("Informe a observação da edição antes de salvar.")
      return
    }

    const now = new Date().toISOString()

    setRequests((currentRequests) =>
      currentRequests.map((request) =>
        request.id === editingRequest.id
          ? {
              ...request,
              title: editFormData.title.trim(),
              description: editFormData.description.trim(),
              contractId: editFormData.contractId,
              date: editFormData.date,
              updatedAt: now,
              history: [
                ...request.history,
                {
                  id: createId(),
                  action: "Solicitação editada",
                  toStatus: request.status,
                  note: normalizedNote,
                  changedByProfile: profile,
                  changedByUserId: currentUser.id,
                  changedAt: now,
                },
              ],
            }
          : request
      )
    )
    cancelEditingRequest()
    setFeedback("Solicitação editada com histórico.")
  }

  function updateRequestStatus(requestId: string) {
    if (!canUpdateStatus) {
      return
    }

    const request = requests.find((item) => item.id === requestId)
    const nextStatus = statusDrafts[requestId]

    if (!request || !nextStatus || nextStatus === request.status) {
      return
    }

    const now = new Date().toISOString()

    setRequests((currentRequests) =>
      currentRequests.map((item) =>
        item.id === requestId
          ? {
              ...item,
              status: nextStatus,
              updatedAt: now,
              history: [
                ...item.history,
                {
                  id: createId(),
                  action: "Status atualizado",
                  fromStatus: item.status,
                  toStatus: nextStatus,
                  note: (statusNotes[requestId] ?? "").trim(),
                  changedByProfile: profile,
                  changedByUserId: currentUser.id,
                  changedAt: now,
                },
              ],
            }
          : item
      )
    )
    setStatusNotes((current) => ({
      ...current,
      [requestId]: "",
    }))
    setFeedback("Status da solicitação atualizado.")
  }

  function getContractName(contractId: string) {
    return contracts.find((contract) => contract.id === contractId)?.name ?? "-"
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Fluxo operacional"
        title="Solicitações"
        description="Conecte o Líder à Logística para materiais, equipamentos e demandas da obra com histórico completo de atendimento."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Pendentes"
          description="Aguardando atendimento"
          value={pendingCount}
          icon={PackageOpen}
          tone={pendingCount > 0 ? "warning" : "default"}
        />
        <MetricCard
          title="Em atendimento"
          description="Demandas em curso"
          value={inProgressCount}
        />
        <MetricCard
          title="Atendidas"
          description="Solicitações concluídas"
          value={attendedCount}
        />
        <MetricCard
          title="Total"
          description="Registros persistidos"
          value={visibleRequests.length}
          icon={ClipboardList}
        />
      </section>

      <div
        className={
          showSidebarCard
            ? "grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]"
            : "grid gap-6"
        }
      >
        {showSidebarCard ? (
          <Card className="rounded-lg">
            <CardHeader>
              <CardTitle>
                {canCreateRequests ? "Nova solicitação" : "Editar solicitação"}
              </CardTitle>
              <CardDescription>
                {canCreateRequests
                  ? "O Líder registra a necessidade da obra."
                  : "Revise a solicitação selecionada e registre a observação da edição."}
              </CardDescription>
            </CardHeader>

            {canCreateRequests ? (
            <form onSubmit={submitRequest}>
              <CardContent className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="request-title">Título</FieldLabel>
                    <Input
                      id="request-title"
                      value={formData.title}
                      onChange={(event) => updateField("title", event.target.value)}
                      placeholder="Combustível, tubos, bombas..."
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="request-contract">Contrato</FieldLabel>
                    <select
                      id="request-contract"
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={formData.contractId}
                      onChange={(event) =>
                        updateField("contractId", event.target.value)
                      }
                      required
                    >
                      <option value="" disabled>
                        Selecione
                      </option>
                      {visibleContracts.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.name} - {contract.client}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="request-date">Data</FieldLabel>
                    <Input
                      id="request-date"
                      type="date"
                      value={formData.date}
                      onChange={(event) => updateField("date", event.target.value)}
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="request-description">Descrição</FieldLabel>
                    <textarea
                      id="request-description"
                      className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={formData.description}
                      onChange={(event) =>
                        updateField("description", event.target.value)
                      }
                      placeholder="Detalhe a necessidade da obra"
                      required
                    />
                  </Field>
                </FieldGroup>

                {feedback && (
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {feedback}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end">
                <Button type="submit" disabled={visibleContracts.length === 0}>
                  <Save data-icon="inline-start" />
                  Salvar solicitação
                </Button>
              </CardFooter>
            </form>
          ) : editingRequest ? (
            <form onSubmit={submitRequestEdit}>
              <CardContent className="flex flex-col gap-4">
                <FieldGroup>
                  <Field>
                    <FieldLabel htmlFor="edit-request-title">Título</FieldLabel>
                    <Input
                      id="edit-request-title"
                      value={editFormData.title}
                      onChange={(event) =>
                        updateEditField("title", event.target.value)
                      }
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-request-contract">Contrato</FieldLabel>
                    <select
                      id="edit-request-contract"
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={editFormData.contractId}
                      onChange={(event) =>
                        updateEditField("contractId", event.target.value)
                      }
                      required
                    >
                      {visibleContracts.map((contract) => (
                        <option key={contract.id} value={contract.id}>
                          {contract.name} - {contract.client}
                        </option>
                      ))}
                    </select>
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-request-date">Data</FieldLabel>
                    <Input
                      id="edit-request-date"
                      type="date"
                      value={editFormData.date}
                      onChange={(event) =>
                        updateEditField("date", event.target.value)
                      }
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-request-description">
                      Descrição
                    </FieldLabel>
                    <textarea
                      id="edit-request-description"
                      className="min-h-24 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={editFormData.description}
                      onChange={(event) =>
                        updateEditField("description", event.target.value)
                      }
                      required
                    />
                  </Field>

                  <Field>
                    <FieldLabel htmlFor="edit-request-note">
                      Observação da edição
                    </FieldLabel>
                    <textarea
                      id="edit-request-note"
                      className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={editNote}
                      onChange={(event) => {
                        setEditNote(event.target.value)
                        setEditError("")
                      }}
                      placeholder="Ex.: adicionado cimento porque não foi solicitado pelo Líder"
                    />
                  </Field>
                </FieldGroup>

                {editError && (
                  <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                    {editError}
                  </div>
                )}

                {feedback && (
                  <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                    {feedback}
                  </div>
                )}
              </CardContent>
              <CardFooter className="justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={cancelEditingRequest}
                >
                  <X data-icon="inline-start" />
                  Cancelar
                </Button>
                <Button type="submit">
                  <Save data-icon="inline-start" />
                  Salvar edição
                </Button>
              </CardFooter>
            </form>
          ) : null}
          </Card>
        ) : null}

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Solicitações operacionais</CardTitle>
            <CardDescription>
              Materiais, equipamentos e recursos solicitados pela obra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {visibleRequests.length === 0 ? (
              <EmptyState
                icon={PackageOpen}
                title="Nenhuma solicitação registrada"
                description="As demandas entre Líder e Logística aparecerão aqui."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Título</TableHead>
                    <TableHead>Contrato</TableHead>
                    <TableHead>Data</TableHead>
                    <TableHead>Status</TableHead>
                    {!canUpdateStatus && <TableHead>Histórico</TableHead>}
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="align-top">
                        <div className="flex flex-col">
                          <span className="font-medium">{request.title}</span>
                          <span className="max-w-xs text-xs text-muted-foreground">
                            {request.description}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>{getContractName(request.contractId)}</TableCell>
                      <TableCell>{request.date}</TableCell>
                      <TableCell>
                        <Badge
                          variant="outline"
                          className={statusClassNameByValue[request.status]}
                        >
                          {statusLabelByValue[request.status]}
                        </Badge>
                      </TableCell>
                      {!canUpdateStatus && (
                        <TableCell className="max-w-sm align-top">
                          <div className="flex flex-col gap-2 text-xs text-muted-foreground">
                            {request.history.map((entry) => (
                              <div
                                key={entry.id}
                                className="rounded-lg border bg-muted/20 p-2"
                              >
                                <p className="font-medium text-foreground">
                                  {entry.action}
                                </p>
                                <p>
                                  {entry.fromStatus
                                    ? `${statusLabelByValue[entry.fromStatus]} -> `
                                    : ""}
                                  {statusLabelByValue[entry.toStatus]}
                                </p>
                                {entry.note && <p>Nota: {entry.note}</p>}
                                <p>
                                  {getUserById(entry.changedByUserId ?? "")?.name ??
                                    getProfileLabel(entry.changedByProfile)}
                                </p>
                              </div>
                            ))}
                          </div>
                        </TableCell>
                      )}
                      <TableCell className="align-top">
                        <div className="flex min-w-72 flex-col gap-2">
                          {canEditRequests && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => startEditingRequest(request)}
                            >
                              <Edit3 data-icon="inline-start" />
                              Editar
                            </Button>
                          )}

                          {canUpdateStatus ? (
                            <>
                            <select
                              className="h-8 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                              value={statusDrafts[request.id] ?? request.status}
                              onChange={(event) =>
                                setStatusDrafts((current) => ({
                                  ...current,
                                  [request.id]: event.target.value as RequestStatus,
                                }))
                              }
                            >
                              {requestStatusOptions.map((option) => (
                                <option key={option.value} value={option.value}>
                                  {option.label}
                                </option>
                              ))}
                            </select>
                            <Input
                              value={statusNotes[request.id] ?? ""}
                              onChange={(event) =>
                                setStatusNotes((current) => ({
                                  ...current,
                                  [request.id]: event.target.value,
                                }))
                              }
                              placeholder="Observação da Logística"
                            />
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => updateRequestStatus(request.id)}
                            >
                              Atualizar status
                            </Button>
                            </>
                          ) : !canEditRequests ? (
                            <div className="text-right text-sm text-muted-foreground">
                            Somente leitura
                            </div>
                          ) : null}
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
