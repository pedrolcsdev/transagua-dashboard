import type { LucideIcon } from "lucide-react"
import {
  BarChart3,
  ClipboardCheck,
  ClipboardList,
  FileText,
  FlaskConical,
  HardHat,
  PackageOpen,
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
  { label: "Solicitações", path: "/solicitacoes", icon: PackageOpen },
  { label: "Revisão", path: "/revisao", icon: ClipboardCheck },
  { label: "Relatórios", path: "/relatorios", icon: ClipboardList },
  { label: "Testes", path: "/testes", icon: FlaskConical },
]

const navigationByPath = Object.fromEntries(
  allNavigationItems.map((item) => [item.path, item])
) as Record<string, NavItem>

export const navigationByProfile: Record<UserProfile, NavItem[]> = {
  leader: [
    navigationByPath["/lancamento-diario"],
    navigationByPath["/solicitacoes"],
  ],
  manager: [
    navigationByPath["/dashboard"],
    navigationByPath["/contratos"],
    navigationByPath["/revisao"],
    navigationByPath["/relatorios"],
    navigationByPath["/solicitacoes"],
  ],
  director: [
    navigationByPath["/dashboard"],
    navigationByPath["/contratos"],
    navigationByPath["/relatorios"],
    navigationByPath["/solicitacoes"],
    navigationByPath["/testes"],
  ],
  logistics: [navigationByPath["/solicitacoes"]],
}

export function getPageTitle(pathname: string) {
  return (
    allNavigationItems.find((item) => item.path === pathname)?.label ??
    "Dashboard"
  )
}
