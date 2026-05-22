import { NavLink } from "react-router-dom"
import { Droplets } from "lucide-react"

import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { navigationByProfile } from "@/lib/navigation"
import { getProfileLabel, type UserProfile } from "@/lib/profile"

type SidebarProps = {
  profile: UserProfile
  onNavigate?: () => void
}

export function Sidebar({ profile, onNavigate }: SidebarProps) {
  const navigation = navigationByProfile[profile]

  return (
    <div className="flex h-full min-h-svh flex-col px-4 py-5 text-white">
      <div className="flex items-center gap-3 px-2">
        <div className="flex size-10 items-center justify-center rounded-lg bg-[#8ee8dc] text-[#073234] shadow-[0_8px_22px_rgba(142,232,220,0.22)]">
          <Droplets />
        </div>
        <div>
          <p className="text-base font-semibold leading-tight">Transágua</p>
          <p className="text-xs text-[#a9c9ca]">Saneamento e infraestrutura</p>
        </div>
      </div>

      <Separator className="my-5 bg-white/10" />

      <div className="rounded-lg border border-white/10 bg-white/5 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
        <p className="text-xs uppercase text-[#a9c9ca]">Perfil ativo</p>
        <p className="mt-1 text-sm font-semibold">{getProfileLabel(profile)}</p>
      </div>

      <nav className="mt-5 flex flex-col gap-1" aria-label="Navegação principal">
        {navigation.map((item) => {
          const Icon = item.icon

          return (
            <NavLink
              key={item.path}
              to={item.path}
              onClick={onNavigate}
              className={({ isActive }) =>
                cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium text-[#d8eeee] transition hover:bg-white/10 hover:text-white focus-visible:ring-2 focus-visible:ring-[#8ee8dc]",
                  isActive &&
                    "bg-[#eafffb] text-[#073234] shadow-sm hover:bg-[#eafffb] hover:text-[#073234]"
                )
              }
            >
              <Icon />
              <span>{item.label}</span>
            </NavLink>
          )
        })}
      </nav>

      <div className="mt-auto rounded-lg border border-white/10 bg-[#0f4243] p-3 text-xs leading-5 text-[#b7d4d5]">
        Centro operacional com dados persistidos neste navegador.
      </div>
    </div>
  )
}
