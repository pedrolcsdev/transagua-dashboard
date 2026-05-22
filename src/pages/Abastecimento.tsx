import { useEffect, useMemo, useState, type FormEvent } from "react"
import { Fuel, Save, Trash2 } from "lucide-react"

import { MetricCard } from "@/components/MetricCard"
import { PageHeader } from "@/components/PageHeader"
import { EmptyState } from "@/components/StateViews"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field"
import { Input } from "@/components/ui/input"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { currencyFormatter, getFuelTotals, numberFormatter } from "@/lib/analytics"
import { createId, loadContracts } from "@/lib/contracts"
import {
  createEmptyFuelEntryForm,
  fuelTypeOptions,
  FUEL_STORAGE_KEY,
  getFuelEntryTotal,
  loadFuelEntries,
  saveFuelEntries,
  type FuelEntry,
  type FuelEntryFormData,
  type FuelType,
} from "@/lib/fuel"

export function Abastecimento() {
  const [contracts] = useState(() => loadContracts())
  const [entries, setEntries] = useState<FuelEntry[]>(() => loadFuelEntries())
  const firstContractId = contracts[0]?.id ?? ""
  const [formData, setFormData] = useState<FuelEntryFormData>(() =>
    createEmptyFuelEntryForm(firstContractId)
  )

  const totals = useMemo(() => getFuelTotals(entries), [entries])
  const totalToPay = useMemo(
    () =>
      entries.reduce(
        (total, entry) =>
          total + getFuelEntryTotal(entry) + (Number(entry.outstandingBalance) || 0),
        0
      ),
    [entries]
  )

  useEffect(() => {
    saveFuelEntries(entries)
  }, [entries])

  function updateField<K extends keyof FuelEntryFormData>(
    field: K,
    value: FuelEntryFormData[K]
  ) {
    setFormData((currentFormData) => ({
      ...currentFormData,
      [field]: value,
    }))
  }

  function submitFuelEntry(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()

    const now = new Date().toISOString()
    const entry: FuelEntry = {
      id: createId(),
      ...formData,
      station: formData.station.trim(),
      literPrice: Number(formData.literPrice) || 0,
      liters: Number(formData.liters) || 0,
      equipment: formData.equipment.trim(),
      driver: formData.driver.trim(),
      plateOrTag: formData.plateOrTag.trim(),
      outstandingBalance: Number(formData.outstandingBalance) || 0,
      observations: formData.observations.trim(),
      createdAt: now,
      updatedAt: now,
    }

    setEntries((currentEntries) => [entry, ...currentEntries])
    setFormData(createEmptyFuelEntryForm(formData.contractId))
  }

  function deleteEntry(entryId: string) {
    const shouldDelete = window.confirm("Excluir este abastecimento?")

    if (!shouldDelete) {
      return
    }

    setEntries((currentEntries) =>
      currentEntries.filter((entry) => entry.id !== entryId)
    )
  }

  function getContractName(contractId: string) {
    return contracts.find((contract) => contract.id === contractId)?.name ?? "-"
  }

  return (
    <div className="flex flex-col gap-6">
      <PageHeader
        eyebrow="Operação e frota"
        title="Abastecimento"
        description="Registre combustível por obra, equipamento, posto e dia para acompanhar custos operacionais."
      />

      <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          title="Custo total"
          description="Litros x preço por litro"
          value={currencyFormatter.format(totals.totalValue)}
          icon={Fuel}
        />
        <MetricCard
          title="Total a pagar"
          description="Custo mais saldo devedor"
          value={currencyFormatter.format(totalToPay)}
        />
        <MetricCard
          title="Gasolina"
          description={`${numberFormatter.format(totals.gasolineLiters)} litros`}
          value={currencyFormatter.format(totals.gasolineValue)}
        />
        <MetricCard
          title="Diesel"
          description={`${numberFormatter.format(totals.dieselLiters)} litros`}
          value={currencyFormatter.format(totals.dieselValue)}
        />
      </section>

      <div className="grid gap-6 xl:grid-cols-[420px_minmax(0,1fr)]">
        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Novo abastecimento</CardTitle>
            <CardDescription>
              Registros são salvos em {FUEL_STORAGE_KEY}.
            </CardDescription>
          </CardHeader>
          <form onSubmit={submitFuelEntry}>
            <CardContent className="flex flex-col gap-4">
              <FieldGroup>
                <Field>
                  <FieldLabel htmlFor="fuel-contract">Obra/contrato</FieldLabel>
                  <select
                    id="fuel-contract"
                    className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={formData.contractId}
                    onChange={(event) =>
                      updateField("contractId", event.target.value)
                    }
                    required
                  >
                    <option value="" disabled>
                      Selecione
                    </option>
                    {contracts.map((contract) => (
                      <option key={contract.id} value={contract.id}>
                        {contract.name} - {contract.client}
                      </option>
                    ))}
                  </select>
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="fuel-date">Data</FieldLabel>
                    <Input
                      id="fuel-date"
                      type="date"
                      value={formData.date}
                      onChange={(event) => updateField("date", event.target.value)}
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="fuel-type">Combustível</FieldLabel>
                    <select
                      id="fuel-type"
                      className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                      value={formData.fuelType}
                      onChange={(event) =>
                        updateField("fuelType", event.target.value as FuelType)
                      }
                    >
                      {fuelTypeOptions.map((option) => (
                        <option key={option.value} value={option.value}>
                          {option.label}
                        </option>
                      ))}
                    </select>
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="fuel-station">Posto</FieldLabel>
                  <Input
                    id="fuel-station"
                    value={formData.station}
                    onChange={(event) => updateField("station", event.target.value)}
                    placeholder="Posto Garcia"
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="fuel-liters">Litros</FieldLabel>
                    <Input
                      id="fuel-liters"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.liters}
                      onChange={(event) =>
                        updateField("liters", Number(event.target.value))
                      }
                      required
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="fuel-price">Preço/litro</FieldLabel>
                    <Input
                      id="fuel-price"
                      type="number"
                      min="0"
                      step="0.01"
                      value={formData.literPrice}
                      onChange={(event) =>
                        updateField("literPrice", Number(event.target.value))
                      }
                      required
                    />
                  </Field>
                </div>

                <div className="rounded-lg border bg-muted/20 p-3 text-sm">
                  <p className="text-xs text-muted-foreground">Valor calculado</p>
                  <p className="mt-1 text-lg font-semibold">
                    {currencyFormatter.format(getFuelEntryTotal(formData))}
                  </p>
                </div>

                <Field>
                  <FieldLabel htmlFor="fuel-equipment">Equipamento/veículo</FieldLabel>
                  <Input
                    id="fuel-equipment"
                    value={formData.equipment}
                    onChange={(event) =>
                      updateField("equipment", event.target.value)
                    }
                    placeholder="Retro 16, Fiat Mobi, escavadeira"
                    required
                  />
                </Field>

                <div className="grid gap-4 sm:grid-cols-2">
                  <Field>
                    <FieldLabel htmlFor="fuel-driver">Condutor</FieldLabel>
                    <Input
                      id="fuel-driver"
                      value={formData.driver}
                      onChange={(event) =>
                        updateField("driver", event.target.value)
                      }
                    />
                  </Field>
                  <Field>
                    <FieldLabel htmlFor="fuel-tag">Tag/placa</FieldLabel>
                    <Input
                      id="fuel-tag"
                      value={formData.plateOrTag}
                      onChange={(event) =>
                        updateField("plateOrTag", event.target.value)
                      }
                    />
                  </Field>
                </div>

                <Field>
                  <FieldLabel htmlFor="fuel-balance">Saldo devedor</FieldLabel>
                  <Input
                    id="fuel-balance"
                    type="number"
                    min="0"
                    step="0.01"
                    value={formData.outstandingBalance}
                    onChange={(event) =>
                      updateField("outstandingBalance", Number(event.target.value))
                    }
                  />
                </Field>

                <Field>
                  <FieldLabel htmlFor="fuel-observations">Observações</FieldLabel>
                  <textarea
                    id="fuel-observations"
                    className="min-h-20 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50"
                    value={formData.observations}
                    onChange={(event) =>
                      updateField("observations", event.target.value)
                    }
                  />
                </Field>
              </FieldGroup>
            </CardContent>
            <CardFooter className="justify-end">
              <Button type="submit" disabled={contracts.length === 0}>
                <Save data-icon="inline-start" />
                Salvar abastecimento
              </Button>
            </CardFooter>
          </form>
        </Card>

        <Card className="rounded-lg">
          <CardHeader>
            <CardTitle>Registros</CardTitle>
            <CardDescription>
              Total por dia, obra, combustível, equipamento e condutor.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {entries.length === 0 ? (
              <EmptyState
                icon={Fuel}
                title="Nenhum abastecimento lançado"
                description="Os custos de combustível aparecerão aqui após o primeiro registro."
              />
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Obra</TableHead>
                    <TableHead>Equipamento</TableHead>
                    <TableHead>Combustível</TableHead>
                    <TableHead>Litros</TableHead>
                    <TableHead>Valor</TableHead>
                    <TableHead>Condutor</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {entries.map((entry) => (
                    <TableRow key={entry.id}>
                      <TableCell>{entry.date}</TableCell>
                      <TableCell>{getContractName(entry.contractId)}</TableCell>
                      <TableCell>
                        <div className="flex flex-col">
                          <span>{entry.equipment}</span>
                          <span className="text-xs text-muted-foreground">
                            {entry.plateOrTag || "-"}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {
                          fuelTypeOptions.find(
                            (option) => option.value === entry.fuelType
                          )?.label
                        }
                      </TableCell>
                      <TableCell>{numberFormatter.format(entry.liters)}</TableCell>
                      <TableCell>
                        {currencyFormatter.format(getFuelEntryTotal(entry))}
                      </TableCell>
                      <TableCell>{entry.driver || "-"}</TableCell>
                      <TableCell>
                        <div className="flex justify-end">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon-sm"
                            onClick={() => deleteEntry(entry.id)}
                            aria-label="Excluir abastecimento"
                          >
                            <Trash2 />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

