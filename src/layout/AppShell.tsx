import { Outlet, useLocation } from "react-router-dom"
import { useEffect, useState } from "react"

import { Header } from "@/components/Header"
import { Sidebar } from "@/components/Sidebar"
import { getPageTitle } from "@/lib/navigation"
import type { AppUser, UserProfile } from "@/lib/profile"
import { cn } from "@/lib/utils"

type AppShellProps = {
  user: AppUser
  profile: UserProfile
  onUserChange: (user: AppUser) => void
}

export function AppShell({ user, profile, onUserChange }: AppShellProps) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const location = useLocation()
  const pageTitle = getPageTitle(location.pathname)

  useEffect(() => {
    if (!isSidebarOpen) {
      return
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsSidebarOpen(false)
      }
    }

    document.addEventListener("keydown", handleKeyDown)
    return () => document.removeEventListener("keydown", handleKeyDown)
  }, [isSidebarOpen])

  return (
    <div className="min-h-svh bg-[#f6f8fb] text-[#172426]">
      <Header
        pageTitle={pageTitle}
        user={user}
        onMenuClick={() => setIsSidebarOpen(true)}
        onUserChange={onUserChange}
      />

      <div
        className={cn(
          "fixed inset-0 z-40 bg-[#111827]/45 opacity-0 backdrop-blur-[2px] transition-opacity duration-300 ease-out",
          isSidebarOpen
            ? "pointer-events-auto opacity-100"
            : "pointer-events-none"
        )}
        aria-hidden={!isSidebarOpen}
        onClick={() => setIsSidebarOpen(false)}
      />

      <aside
        className={cn(
          "fixed inset-y-0 left-0 z-50 w-[min(19rem,calc(100vw-2rem))] p-3 transition-transform duration-300 ease-out will-change-transform",
          isSidebarOpen
            ? "pointer-events-auto translate-x-0"
            : "pointer-events-none -translate-x-full"
        )}
        aria-hidden={!isSidebarOpen}
      >
        <Sidebar
          profile={profile}
          onNavigate={() => setIsSidebarOpen(false)}
          onClose={() => setIsSidebarOpen(false)}
        />
      </aside>

      <main className="flex-1 px-4 py-5 sm:px-6 lg:px-8 lg:py-7">
        <div className="mx-auto w-full max-w-[1480px]">
          <Outlet />
        </div>
      </main>
    </div>
  )
}
