export type UserProfile = "leader" | "manager" | "director" | "logistics"

export type ProfileOption = {
  value: UserProfile
  label: "Líder" | "Gestor" | "Coordenador" | "Logística"
}

export type AppUser = {
  id: string
  name: string
  profile: UserProfile
}

export const USER_STORAGE_KEY = "transagua:user"
export const PROFILE_STORAGE_KEY = "transagua:profile"
export const DEFAULT_USER_ID = "manager-ana"
export const DEFAULT_PROFILE: UserProfile = "manager"

export const appUsers: AppUser[] = [
  { id: "coordinator-carlos", name: "Carlos Almeida", profile: "director" },
  { id: "manager-ana", name: "Ana Beatriz", profile: "manager" },
  { id: "manager-roberto", name: "Roberto Lima", profile: "manager" },
  { id: "leader-marina", name: "Marina Costa", profile: "leader" },
  { id: "leader-paulo", name: "Paulo Santos", profile: "leader" },
  { id: "leader-julia", name: "Julia Rocha", profile: "leader" },
  { id: "logistics-bruno", name: "Bruno Freitas", profile: "logistics" },
]

export const profileOptions: ProfileOption[] = [
  { value: "leader", label: "Líder" },
  { value: "manager", label: "Gestor" },
  { value: "director", label: "Coordenador" },
  { value: "logistics", label: "Logística" },
]

export function getProfileLabel(profile: UserProfile) {
  return (
    profileOptions.find((option) => option.value === profile)?.label ?? "Gestor"
  )
}

export function getUsersByProfile(profile: UserProfile) {
  return appUsers.filter((user) => user.profile === profile)
}

export function getUserById(userId: string | null) {
  return appUsers.find((user) => user.id === userId)
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

export function getStoredUser() {
  const storedUserId = localStorage.getItem(USER_STORAGE_KEY)
  const storedUser = getUserById(storedUserId)

  return storedUser ?? getUserById(DEFAULT_USER_ID) ?? appUsers[0]
}
