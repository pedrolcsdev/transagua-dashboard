import { useEffect, useMemo, useState, type FormEvent } from "react"
import { ClipboardList, PackageOpen, Save } from "lucide-react"

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
import { createId, loadContracts } from "@/lib/contracts"
import { hasCapability } from "@/lib/permissions"
import type { UserProfile } from "@/lib/profile"
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
  profile: UserProfile
}

export function Solicitacoes({ profile }: SolicitacoesProps) {
  const [contracts] = useState(() => loadContracts())
  const [requests, setRequests] = useState<OperationalRequest[]>(() =>
    loadOperationalRequests()
  )
  const firstContractId = contracts[0]?.id ?? ""
  const [formData, setFormData] = useState<OperationalRequestFormData>(() =>
    createEmptyOperationalRequestForm(firstContractId)
  )
  const [statusDrafts, setStatusDrafts] = useState<Record<string, RequestStatus>>({})
  const [statusNotes, setStatusNotes] = useState<Record<string, string>>({})
  const [feedback, setFeedback] = useState("")

  const canCreateRequests = hasCapability(profile, "requests.create")
  const canUpdateStatus = hasCapability(profile, "requests.update-status")

  const pendingCount = useMemo(
    () => requests.filter((request) => request.status === "pendente").length,
    [requests]
  )
  const inProgressCount = useMemo(
    () =>
      requests.filter((request) => request.status === "em-atendimento").length,
    [requests]
  )
  const attendedCount = useMemo(
    () => requests.filter((request) => request.status === "atendido").length,
    [requests]
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

  function submitRequest(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!canCreateRequests) {
      return
    }

    const nextRequest = createOperationalRequest(formData, profile)

    setRequests((currentRequests) => [nextRequest, ...currentRequests])
    setFormData(createEmptyOperationalRequestForm(formData.contractId))
    setFeedback("Solicitação criada com sucesso.")
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
          value={requests.length}
          icon={ClipboardList}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>
              {canCreateRequests ? "Nova solicitação" : "Painel do perfil"}
            </CardTitle>
            <CardDescription>
              {canCreateRequests
                ? "O Líder registra a necessidade da obra."
                : canUpdateStatus
                  ? "A Logística acompanha solicitações e atualiza status."
                  : "Diretor e Gestor acompanham o fluxo em modo leitura."}
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
                      {contracts.map((contract) => (
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
                <Button type="submit" disabled={contracts.length === 0}>
                  <Save data-icon="inline-start" />
                  Salvar solicitação
                </Button>
              </CardFooter>
            </form>
          ) : (
            <CardContent className="flex flex-col gap-4">
              <div className="rounded-lg border bg-muted/20 p-4 text-sm text-muted-foreground">
                {canUpdateStatus
                  ? "Atualize o andamento das solicitações recebidas e mantenha o histórico sempre rastreável."
                  : "Use esta área para acompanhar solicitações abertas, em atendimento e concluídas."}
              </div>

              {feedback && (
                <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
                  {feedback}
                </div>
              )}
            </CardContent>
          )}
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Solicitações operacionais</CardTitle>
            <CardDescription>
              Materiais, equipamentos e recursos solicitados pela obra.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {requests.length === 0 ? (
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
                    <TableHead>Histórico</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
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
                            </div>
                          ))}
                        </div>
                      </TableCell>
                      <TableCell className="align-top">
                        {canUpdateStatus ? (
                          <div className="flex min-w-72 flex-col gap-2">
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
                          </div>
                        ) : (
                          <div className="text-right text-sm text-muted-foreground">
                            Somente leitura
                          </div>
                        )}
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
