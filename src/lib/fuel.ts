import { createId } from "@/lib/contracts"

export type FuelType = "gasolina" | "diesel"

export type FuelEntry = {
  id: string
  contractId: string
  date: string
  station: string
  fuelType: FuelType
  literPrice: number
  liters: number
  equipment: string
  driver: string
  plateOrTag: string
  outstandingBalance: number
  observations: string
  createdAt: string
  updatedAt: string
}

export type FuelEntryFormData = Omit<FuelEntry, "id" | "createdAt" | "updatedAt">

export const FUEL_STORAGE_KEY = "transagua:fuel-entries"

export const fuelTypeOptions: Array<{
  value: FuelType
  label: string
}> = [
  { value: "gasolina", label: "Gasolina" },
  { value: "diesel", label: "Diesel" },
]

export function getFuelEntryTotal(entry: Pick<FuelEntry, "liters" | "literPrice">) {
  return (Number(entry.liters) || 0) * (Number(entry.literPrice) || 0)
}

export function createEmptyFuelEntryForm(contractId = ""): FuelEntryFormData {
  return {
    contractId,
    date: new Date().toISOString().slice(0, 10),
    station: "",
    fuelType: "gasolina",
    literPrice: 0,
    liters: 0,
    equipment: "",
    driver: "",
    plateOrTag: "",
    outstandingBalance: 0,
    observations: "",
  }
}

export function loadFuelEntries(): FuelEntry[] {
  const storedEntries = localStorage.getItem(FUEL_STORAGE_KEY)

  if (!storedEntries) {
    return []
  }

  try {
    const parsedEntries = JSON.parse(storedEntries)

    if (!Array.isArray(parsedEntries)) {
      return []
    }

    return parsedEntries.map((entry) => ({
      id: entry.id ?? createId(),
      contractId: entry.contractId ?? "",
      date: entry.date ?? "",
      station: entry.station ?? "",
      fuelType: entry.fuelType === "diesel" ? "diesel" : "gasolina",
      literPrice: Number(entry.literPrice) || 0,
      liters: Number(entry.liters) || 0,
      equipment: entry.equipment ?? "",
      driver: entry.driver ?? "",
      plateOrTag: entry.plateOrTag ?? "",
      outstandingBalance: Number(entry.outstandingBalance) || 0,
      observations: entry.observations ?? "",
      createdAt: entry.createdAt ?? new Date().toISOString(),
      updatedAt: entry.updatedAt ?? new Date().toISOString(),
    }))
  } catch {
    return []
  }
}

export function saveFuelEntries(entries: FuelEntry[]) {
  localStorage.setItem(FUEL_STORAGE_KEY, JSON.stringify(entries))
}

