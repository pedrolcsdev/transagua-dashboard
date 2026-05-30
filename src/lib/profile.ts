export type UserProfile = "leader" | "manager" | "director" | "logistics"

export type ProfileOption = {
  value: UserProfile
  label: "Líder" | "Gestor" | "Diretor" | "Logística"
}

export const PROFILE_STORAGE_KEY = "transagua:profile"
export const DEFAULT_PROFILE: UserProfile = "manager"

export const profileOptions: ProfileOption[] = [
  { value: "leader", label: "Líder" },
  { value: "manager", label: "Gestor" },
  { value: "director", label: "Diretor" },
  { value: "logistics", label: "Logística" },
]

export function getProfileLabel(profile: UserProfile) {
  return (
    profileOptions.find((option) => option.value === profile)?.label ?? "Gestor"
  )
}

export function isUserProfile(value: string | null): value is UserProfile {
  return (
    value === "leader" ||
    value === "manager" ||
    value === "director" ||
    value === "logistics"
  )
}

export function getStoredProfile() {
  const storedProfile = localStorage.getItem(PROFILE_STORAGE_KEY)

  return isUserProfile(storedProfile) ? storedProfile : DEFAULT_PROFILE
}
