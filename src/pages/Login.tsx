import { useMemo, useState, type FormEvent } from "react"
import { ArrowRight, CheckCircle2, LockKeyhole, Mail, UserRound } from "lucide-react"

import { BrandLogo } from "@/components/BrandLogo"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  DEFAULT_USER_ID,
  appUsers,
  getProfileLabel,
  getUserById,
  type AppUser,
} from "@/lib/profile"

type LoginProps = {
  onLogin: (user: AppUser) => void
}

export function Login({ onLogin }: LoginProps) {
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [error, setError] = useState("")
  const defaultUser = useMemo(
    () => getUserById(DEFAULT_USER_ID) ?? appUsers[0],
    []
  )

  function submitLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    if (!email.trim() || !password.trim()) {
      setError("Informe email e senha para entrar na demonstração.")
      return
    }

    setError("")
    onLogin(defaultUser)
  }

  function quickLogin(user: AppUser) {
    setError("")
    onLogin(user)
  }

  return (
    <main className="min-h-svh overflow-hidden bg-[var(--bg-primary)] text-[var(--text-primary)]">
      <section className="mx-auto grid min-h-svh w-full max-w-[86rem] gap-8 px-4 py-5 sm:px-6 lg:grid-cols-[minmax(0,1fr)_27rem] lg:items-center lg:px-8">
        <div className="flex min-w-0 flex-col gap-8 py-8 lg:py-12">
          <BrandLogo className="h-12" />

          <div className="max-w-3xl">
            <Badge className="border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--accent-color)]">
              operação em tempo real
            </Badge>
            <h1 className="mt-5 max-w-3xl text-4xl font-semibold leading-[0.95] tracking-tight text-[var(--text-primary)] text-balance sm:text-5xl lg:text-6xl">
              Controle diário da obra, sem perder o ritmo da operação.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[var(--text-secondary)] text-pretty">
              Acesse contratos, lançamentos, revisão gerencial e solicitações
              em um painel único para líder, gestor, coordenação e logística.
            </p>
          </div>

          <div className="grid max-w-4xl gap-3 sm:grid-cols-3">
            {[
              ["Contratos", "prazo, meta e saldo físico"],
              ["Campo", "realizado diário e efetivo"],
              ["Logística", "entregas e pendências"],
            ].map(([title, description]) => (
              <div
                key={title}
                className="rounded-2xl border border-[var(--border-color)] bg-[var(--card-bg)]/80 p-4 shadow-[0_18px_38px_-32px_var(--shadow-color)] backdrop-blur"
              >
                <CheckCircle2
                  aria-hidden="true"
                  className="mb-4 text-[var(--accent-color)]"
                />
                <p className="font-semibold text-[var(--text-primary)]">{title}</p>
                <p className="mt-1 text-sm leading-6 text-[var(--text-secondary)]">
                  {description}
                </p>
              </div>
            ))}
          </div>
        </div>

        <Card className="rounded-[1.75rem] border-[var(--border-color)] bg-[var(--card-bg)] shadow-[0_28px_70px_-42px_var(--shadow-color)]">
          <CardHeader>
            <CardTitle className="text-2xl">Entrar no painel</CardTitle>
            <CardDescription>
              Use email e senha para entrar como gestor ou escolha um acesso rápido.
            </CardDescription>
          </CardHeader>

          <form onSubmit={submitLogin}>
            <CardContent>
              <FieldGroup>
                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="login-email">Email</FieldLabel>
                  <div className="relative">
                    <Mail
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <Input
                      id="login-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      spellCheck={false}
                      value={email}
                      onChange={(event) => {
                        setEmail(event.target.value)
                        setError("")
                      }}
                      placeholder="ana@transagua.com.br…"
                      className="h-11 pl-10"
                      aria-invalid={Boolean(error)}
                    />
                  </div>
                </Field>

                <Field data-invalid={Boolean(error)}>
                  <FieldLabel htmlFor="login-password">Senha</FieldLabel>
                  <div className="relative">
                    <LockKeyhole
                      aria-hidden="true"
                      className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    />
                    <Input
                      id="login-password"
                      name="password"
                      type="password"
                      autoComplete="current-password"
                      value={password}
                      onChange={(event) => {
                        setPassword(event.target.value)
                        setError("")
                      }}
                      placeholder="senha da demonstração…"
                      className="h-11 pl-10"
                      aria-invalid={Boolean(error)}
                    />
                  </div>
                  <FieldDescription>
                    Nesta versão demo, qualquer email e senha preenchidos entram
                    como Ana Beatriz.
                  </FieldDescription>
                  <FieldError aria-live="polite">{error}</FieldError>
                </Field>

                <Button type="submit" className="h-11 justify-between">
                  Entrar
                  <ArrowRight data-icon="inline-end" />
                </Button>

                <FieldSeparator>ou entrar rápido</FieldSeparator>

                <div className="grid gap-2">
                  {appUsers.map((user) => (
                    <Button
                      key={user.id}
                      type="button"
                      variant="outline"
                      className="h-auto justify-start gap-3 py-2.5 text-left"
                      onClick={() => quickLogin(user)}
                    >
                      <span className="flex size-9 items-center justify-center rounded-xl bg-[var(--accent-soft)] text-[var(--accent-color)]">
                        <UserRound aria-hidden="true" data-icon="inline-start" />
                      </span>
                      <span className="flex min-w-0 flex-col">
                        <span className="truncate font-medium">{user.name}</span>
                        <span className="text-xs text-[var(--text-secondary)]">
                          {getProfileLabel(user.profile)}
                        </span>
                      </span>
                    </Button>
                  ))}
                </div>
              </FieldGroup>
            </CardContent>

            <CardFooter className="justify-between gap-3 text-xs text-[var(--text-secondary)]">
              <span>Ambiente demonstrativo</span>
              <span translate="no">Transágua Dashboard</span>
            </CardFooter>
          </form>
        </Card>
      </section>
    </main>
  )
}
