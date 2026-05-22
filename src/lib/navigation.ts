import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileText,
  Fuel,
  HardHat,
  Users,
} from "lucide-react"

import type { UserProfile } from "@/lib/profile"

export type NavItem = {
  label: string
  path: string
  icon: LucideIcon
}

export const allNavigationItems: NavItem[] = [
  { label: "Dashboard", path: "/dashboard", icon: BarChart3 },
  { label: "Contratos", path: "/contratos", icon: FileText },
  { label: "Lançamento Diário", path: "/lancamento-diario", icon: HardHat },
  { label: "Abastecimento", path: "/abastecimento", icon: Fuel },
  { label: "Revisão", path: "/revisao", icon: ClipboardCheck },
  { label: "Relatórios", path: "/relatorios", icon: ClipboardList },
  { label: "Usuários", path: "/usuarios", icon: Users },
]

const navigationByPath = Object.fromEntries(
  allNavigationItems.map((item) => [item.path, item])
) as Record<string, NavItem>

export const navigationByProfile: Record<UserProfile, NavItem[]> = {
  leader: [
    navigationByPath["/dashboard"],
    navigationByPath["/lancamento-diario"],
    navigationByPath["/abastecimento"],
    navigationByPath["/revisao"],
  ],
  manager: allNavigationItems,
  director: [
    navigationByPath["/dashboard"],
    navigationByPath["/relatorios"],
    navigationByPath["/abastecimento"],
    navigationByPath["/revisao"],
  ],
}

export function getPageTitle(pathname: string) {
  return (
    allNavigationItems.find((item) => item.path === pathname)?.label ??
    "Dashboard"
  )
}
