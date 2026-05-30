import { useEffect, useMemo, useState } from "react"
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
} from "react-router-dom"

import { AppShell } from "@/layout/AppShell"
import { navigationByProfile } from "@/lib/navigation"
import {
  DEFAULT_PROFILE,
  getStoredProfile,
  PROFILE_STORAGE_KEY,
  type UserProfile,
} from "@/lib/profile"
import { Contratos } from "@/pages/Contratos"
import { Dashboard } from "@/pages/Dashboard"
import { LancamentoDiario } from "@/pages/LancamentoDiario"
import { Relatorios } from "@/pages/Relatorios"
import { Revisao } from "@/pages/Revisao"
import { Solicitacoes } from "@/pages/Solicitacoes"
import { Usuarios } from "@/pages/Usuarios"

function ShellRoutes() {
  const [profile, setProfile] = useState<UserProfile>(() => getStoredProfile())
  const navigate = useNavigate()
  const location = useLocation()

  const allowedPaths = useMemo(
    () => navigationByProfile[profile].map((item) => item.path),
    [profile]
  )

  useEffect(() => {
    localStorage.setItem(PROFILE_STORAGE_KEY, profile)
  }, [profile])

  useEffect(() => {
    if (!allowedPaths.includes(location.pathname)) {
      navigate(allowedPaths[0] ?? "/dashboard", { replace: true })
    }
  }, [allowedPaths, location.pathname, navigate])

  return (
    <Routes>
      <Route
        element={<AppShell profile={profile} onProfileChange={setProfile} />}
      >
        <Route
          index
          element={
            <Navigate
              to={navigationByProfile[profile][0]?.path ?? "/dashboard"}
              replace
            />
          }
        />
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/contratos" element={<Contratos profile={profile} />} />
        <Route path="/solicitacoes" element={<Solicitacoes profile={profile} />} />
        <Route path="/abastecimento" element={<Navigate to="/solicitacoes" replace />} />
        <Route
          path="/lancamento-diario"
          element={<LancamentoDiario profile={profile} />}
        />
        <Route path="/revisao" element={<Revisao profile={profile} />} />
        <Route path="/relatorios" element={<Relatorios />} />
        <Route path="/usuarios" element={<Usuarios />} />
        <Route
          path="*"
          element={
            <Navigate
              to={navigationByProfile[profile][0]?.path ?? "/dashboard"}
              replace
            />
          }
        />
      </Route>
    </Routes>
  )
}

function App() {
  useEffect(() => {
    if (!localStorage.getItem(PROFILE_STORAGE_KEY)) {
      localStorage.setItem(PROFILE_STORAGE_KEY, DEFAULT_PROFILE)
    }
  }, [])

  return (
    <BrowserRouter>
      <ShellRoutes />
    </BrowserRouter>
  )
}

export default App
