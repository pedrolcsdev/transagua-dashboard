import type { UserProfile } from "@/lib/profile"

export type AppCapability =
  | "dashboard.view"
  | "contracts.view"
  | "contracts.manage"
  | "daily-execution.view"
  | "daily-execution.manage"
  | "review.view"
  | "review.manage"
  | "reports.view"
  | "requests.view"
  | "requests.create"
  | "requests.update-status"

export const capabilitiesByProfile: Record<UserProfile, AppCapability[]> = {
  director: [
    "dashboard.view",
    "contracts.view",
    "contracts.manage",
    "reports.view",
    "requests.view",
  ],
  manager: [
    "dashboard.view",
    "contracts.view",
    "review.view",
    "review.manage",
    "reports.view",
    "requests.view",
  ],
  leader: [
    "daily-execution.view",
    "daily-execution.manage",
    "requests.view",
    "requests.create",
  ],
  logistics: ["requests.view", "requests.update-status"],
}

export function hasCapability(
  profile: UserProfile,
  capability: AppCapability
) {
  return capabilitiesByProfile[profile].includes(capability)
}
