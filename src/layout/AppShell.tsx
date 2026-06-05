import { Outlet, useLocation } from "react-router-dom"
import { useState } from "react"

import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import {
  Sheet,
  SheetContent,
  SheetTitle,
} from "@/components/ui/sheet"
import { getPageTitle } from "@/lib/navigation"
import type { AppUser, UserProfile } from "@/lib/profile"

type AppShellProps = {
  user: AppUser
  profile: UserProfile
  onUserChange: (user: AppUser) => void
}

export function AppShell({ user, profile, onUserChange }: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  return (
    <div className="min-h-svh bg-[#eef5f5] text-[#172426]">
      <div className="flex min-h-svh">
        <aside className="hidden w-72 shrink-0 border-r border-white/10 bg-[#0c3738] lg:sticky lg:top-0 lg:block lg:h-svh">
          <Sidebar profile={profile} />
        </aside>

        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
          <SheetContent
            side="left"
            className="w-[19rem] border-r-0 bg-[#0c3738] p-0 text-white"
          >
            <SheetTitle className="sr-only">Navegação principal</SheetTitle>
            <Sidebar
              profile={profile}
              onNavigate={() => setMobileMenuOpen(false)}
            />
          </SheetContent>
        </Sheet>

        <div className="flex min-w-0 flex-1 flex-col">
          <Header
            pageTitle={pageTitle}
            user={user}
            onMenuClick={() => setMobileMenuOpen(true)}
            onUserChange={onUserChange}
          />

          <main className="flex-1 p-4 sm:p-6 lg:p-8">
            <div className="mx-auto w-full max-w-[1500px]">
              <Outlet />
            </div>
          </main>
        </div>
      </div>
    </div>
  )
}
