import { useMemo, useState } from "react"
import { Database, FlaskConical, RotateCcw, Sparkles } from "lucide-react"
import { useNavigate } from "react-router-dom"

import { MetricCard } from "@/components/MetricCard"
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
import type { AppUser } from "@/lib/profile"
import {
  clearOperationalTestData,
  createOperationalTestData,
  getOperationalTestDataPreview,
  type TestDataSummary,
} from "@/lib/test-data"

type TestesProps = {
  currentUser: AppUser
}

function SummaryGrid({ summary }: { summary: TestDataSummary }) {
  return (
    <section className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
      <MetricCard
        title="Contratos"
        description="Obras ficticias"
        value={summary.contracts}
        icon={Database}
      />
      <MetricCard
        title="Lancamentos"
        description="Diarios de campo"
        value={summary.executions}
      />
      <MetricCard
        title="Solicitacoes"
        description="Fluxo lider-logistica"
        value={summary.requests}
      />
      <MetricCard
        title="Logistica"
        description="Abastecimentos"
        value={summary.fuelEntries}
      />
      <MetricCard
        title="Observacoes"
        description="Justificativas reais"
        value={summary.observations}
      />
      <MetricCard
        title="Atualizacoes"
        description="Historico logistico"
        value={summary.logisticsUpdates}
      />
    </section>
  )
}

export function Testes({ currentUser }: TestesProps) {
  const navigate = useNavigate()
  const preview = useMemo(() => getOperationalTestDataPreview(), [])
  const [lastSummary, setLastSummary] = useState<TestDataSummary | null>(null)
  const [feedback, setFeedback] = useState("")

  if (currentUser.profile !== "director") {
    return (
      <Card className="rounded-lg">
        <CardHeader>
          <CardTitle>Testes</CardTitle>
          <CardDescription>
            Apenas o Coordenador pode gerar massa de dados ficticia.
          </CardDescription>
        </CardHeader>
      </Card>
    )
  }

  function seedData() {
    const summary = createOperationalTestData()

    setLastSummary(summary)
    setFeedback(
      "Dados ficticios criados. Dashboard, contratos, lancamentos, revisao, relatorios e solicitacoes ja podem ser navegados com a simulacao."
    )
  }

  function clearData() {
    const shouldClear = window.confirm(
      "Isso vai limpar os dados salvos da simulacao local. Deseja continuar?"
    )

    if (!shouldClear) {
      return
    }

    const summary = clearOperationalTestData()

    setLastSummary(summary)
    setFeedback("Dados da simulacao removidos.")
  }

  const activeSummary = lastSummary ?? preview

  return (
    <div className="flex flex-col gap-6">
      <section className="grid gap-4 lg:grid-cols-[1fr_auto] lg:items-end">
        <div>
          <p className="text-sm font-medium text-muted-foreground">
            Ambiente de simulacao
          </p>
          <h2 className="text-2xl font-semibold text-[var(--text-primary)]">Testes</h2>
          <p className="mt-2 max-w-3xl text-sm leading-6 text-muted-foreground">
            Gere uma massa operacional completa para ver a plataforma como se ja
            estivesse em uso: contratos, produtividade diaria, efetivo,
            observacoes, revisoes, solicitacoes e movimentacoes de logistica.
          </p>
        </div>

        <Badge className="w-fit border-[var(--border-color)] bg-[var(--accent-soft)] text-[var(--accent-color)]">
          Coordenador
        </Badge>
      </section>

      <SummaryGrid summary={activeSummary} />

      <Card className="rounded-lg border-[var(--border-color)] shadow-[0_12px_36px_rgba(12,55,56,0.06)]">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FlaskConical className="size-5 text-[var(--accent-color)]" />
            Massa de dados ficticia
          </CardTitle>
          <CardDescription>
            A geracao substitui os dados locais atuais pelos dados de simulacao.
          </CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-lg border bg-muted/20 p-4">
            <h3 className="text-sm font-semibold">O que sera criado</h3>
            <div className="mt-3 grid gap-2 text-sm text-muted-foreground">
              <p>Contratos ativos e pausados com gestores, lideres, equipes e servicos.</p>
              <p>Lancamentos dos lideres com metas atingidas, atrasos e efetivo divergente.</p>
              <p>Observacoes de campo, motivos de desvio e revisoes do gestor com historico.</p>
              <p>Solicitacoes com pendencias, atendimento logistico e conclusoes.</p>
              <p>Registros de abastecimento para simular movimentacao de logistica.</p>
            </div>
          </div>

          <div className="rounded-lg border bg-[var(--card-bg)] p-4">
            <h3 className="text-sm font-semibold">Depois de gerar</h3>
            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <Button type="button" variant="outline" onClick={() => navigate("/dashboard")}>
                Abrir dashboard
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/contratos")}>
                Ver contratos
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/relatorios")}>
                Conferir relatorios
              </Button>
              <Button type="button" variant="outline" onClick={() => navigate("/solicitacoes")}>
                Ver solicitacoes
              </Button>
            </div>
          </div>
        </CardContent>

        {feedback && (
          <CardContent className="pt-0">
            <div className="rounded-lg border bg-muted/30 px-3 py-2 text-sm text-muted-foreground">
              {feedback}
            </div>
          </CardContent>
        )}

        <CardFooter className="justify-end gap-2">
          <Button type="button" variant="outline" onClick={clearData}>
            <RotateCcw data-icon="inline-start" />
            Limpar simulacao
          </Button>
          <Button type="button" onClick={seedData}>
            <Sparkles data-icon="inline-start" />
            Criar dados ficticios
          </Button>
        </CardFooter>
      </Card>
    </div>
  )
}
