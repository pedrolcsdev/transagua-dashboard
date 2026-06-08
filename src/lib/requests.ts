import { createId } from "@/lib/contracts"
import { normalizeDateForInput } from "@/lib/dates"
import type { AppUser, UserProfile } from "@/lib/profile"

export type RequestStatus = "pendente" | "em-atendimento" | "atendido"

export type RequestHistoryEntry = {
  id: string
  action: string
  fromStatus?: RequestStatus
  toStatus: RequestStatus
  note: string
  changedByProfile: UserProfile
  changedByUserId?: string
  changedAt: string
}

export type OperationalRequest = {
  id: string
  title: string
  description: string
  contractId: string
  date: string
  status: RequestStatus
  createdByProfile: UserProfile
  createdByUserId?: string
  history: RequestHistoryEntry[]
  createdAt: string
  updatedAt: string
}

export type OperationalRequestFormData = Pick<
  OperationalRequest,
  "title" | "description" | "contractId" | "date"
>

export const REQUESTS_STORAGE_KEY = "transagua:operational-requests"

export const requestStatusOptions: Array<{
  value: RequestStatus
  label: string
}> = [
  { value: "pendente", label: "Pendente" },
  { value: "em-atendimento", label: "Em atendimento" },
  { value: "atendido", label: "Atendido" },
]

export function createEmptyOperationalRequestForm(
  contractId = ""
): OperationalRequestFormData {
  return {
    title: "",
    description: "",
    contractId,
    date: new Date().toISOString().slice(0, 10),
  }
}

export function loadOperationalRequests(): OperationalRequest[] {
  const storedRequests = localStorage.getItem(REQUESTS_STORAGE_KEY)

  if (!storedRequests) {
    return []
  }

  try {
    const parsedRequests = JSON.parse(storedRequests)

    if (!Array.isArray(parsedRequests)) {
      return []
    }

    return parsedRequests.map((request) => {
      const requestRecord = request as Record<string, unknown>
      const history = Array.isArray(requestRecord.history) ? requestRecord.history : []

      return {
      id: request.id ?? createId(),
      title: request.title ?? "",
      description: request.description ?? "",
      contractId: request.contractId ?? "",
      date: normalizeDateForInput(request.date),
      status:
        request.status === "em-atendimento" || request.status === "atendido"
          ? request.status
          : "pendente",
      createdByProfile:
        request.createdByProfile === "director" ||
        request.createdByProfile === "manager" ||
        request.createdByProfile === "logistics" ||
        request.createdByProfile === "leader"
          ? request.createdByProfile
          : "leader",
      createdByUserId:
        typeof request.createdByUserId === "string"
          ? request.createdByUserId
          : undefined,
      history: history.map((entry) => {
            const historyRecord = entry as Record<string, unknown>

            return {
            id:
              typeof historyRecord.id === "string" && historyRecord.id.length > 0
                ? historyRecord.id
                : createId(),
            action:
              typeof historyRecord.action === "string"
                ? historyRecord.action
                : "Atualização",
            fromStatus:
              historyRecord.fromStatus === "pendente" ||
              historyRecord.fromStatus === "em-atendimento" ||
              historyRecord.fromStatus === "atendido"
                ? historyRecord.fromStatus
                : undefined,
            toStatus:
              historyRecord.toStatus === "em-atendimento" ||
              historyRecord.toStatus === "atendido"
                ? historyRecord.toStatus
                : "pendente",
            note:
              typeof historyRecord.note === "string" ? historyRecord.note : "",
            changedByProfile:
              historyRecord.changedByProfile === "director" ||
              historyRecord.changedByProfile === "manager" ||
              historyRecord.changedByProfile === "logistics" ||
              historyRecord.changedByProfile === "leader"
                ? historyRecord.changedByProfile
                : "leader",
            changedByUserId:
              typeof historyRecord.changedByUserId === "string"
                ? historyRecord.changedByUserId
                : undefined,
            changedAt:
              typeof historyRecord.changedAt === "string"
                ? historyRecord.changedAt
                : new Date().toISOString(),
          }
        }),
      createdAt: request.createdAt ?? new Date().toISOString(),
      updatedAt: request.updatedAt ?? new Date().toISOString(),
      }
    })
  } catch {
    return []
  }
}

export function saveOperationalRequests(requests: OperationalRequest[]) {
  localStorage.setItem(REQUESTS_STORAGE_KEY, JSON.stringify(requests))
}

export function createOperationalRequest(
  formData: OperationalRequestFormData,
  currentUser: AppUser
): OperationalRequest {
  const now = new Date().toISOString()

  return {
    id: createId(),
    title: formData.title.trim(),
    description: formData.description.trim(),
    contractId: formData.contractId,
    date: formData.date,
    status: "pendente",
    createdByProfile: currentUser.profile,
    createdByUserId: currentUser.id,
    history: [
      {
        id: createId(),
        action: "Solicitação criada",
        toStatus: "pendente",
        note: "",
        changedByProfile: currentUser.profile,
        changedByUserId: currentUser.id,
        changedAt: now,
      },
    ],
    createdAt: now,
    updatedAt: now,
  }
}
