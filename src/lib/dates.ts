const inputDatePattern = /^(\d{4})-(\d{2})-(\d{2})$/
const isoDateTimePattern = /^(\d{4})-(\d{2})-(\d{2})T/
const usDatePattern = /^(0?[1-9]|1[0-2])\/(0?[1-9]|[12]\d|3[01])\/(\d{4})$/
const brDatePattern = /^(0?[1-9]|[12]\d|3[01])\/(0?[1-9]|1[0-2])\/(\d{4})$/

export function normalizeDateForInput(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }

  const trimmedValue = value.trim()

  if (inputDatePattern.test(trimmedValue)) {
    return trimmedValue
  }

  const isoMatch = trimmedValue.match(isoDateTimePattern)
  if (isoMatch) {
    return trimmedValue.slice(0, 10)
  }

  const usMatch = trimmedValue.match(usDatePattern)
  if (usMatch) {
    const [, month, day, year] = usMatch
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  const brMatch = trimmedValue.match(brDatePattern)
  if (brMatch) {
    const [, day, month, year] = brMatch
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`
  }

  return trimmedValue
}

export function formatDateBR(value: unknown, fallback = "-") {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback
  }

  const trimmedValue = value.trim()

  const inputMatch = trimmedValue.match(inputDatePattern)
  if (inputMatch) {
    const [, year, month, day] = inputMatch
    return `${day}/${month}/${year}`
  }

  const isoMatch = trimmedValue.match(isoDateTimePattern)
  if (isoMatch) {
    const [, year, month, day] = isoMatch
    return `${day}/${month}/${year}`
  }

  const usMatch = trimmedValue.match(usDatePattern)
  if (usMatch) {
    const [, month, day, year] = usMatch
    return `${day.padStart(2, "0")}/${month.padStart(2, "0")}/${year}`
  }

  return trimmedValue
}

export function maskDateInputValue(value: unknown) {
  if (typeof value !== "string") {
    return ""
  }

  const digits = value.replace(/\D/g, "").slice(0, 8)

  if (digits.length <= 2) {
    return digits
  }

  if (digits.length <= 4) {
    return `${digits.slice(0, 2)}/${digits.slice(2)}`
  }

  return `${digits.slice(0, 2)}/${digits.slice(2, 4)}/${digits.slice(4)}`
}

export function formatDateTimeBR(value: unknown, fallback = "-") {
  if (typeof value !== "string" || value.trim().length === 0) {
    return fallback
  }

  const trimmedValue = value.trim()
  const date = formatDateBR(trimmedValue, fallback)
  const time = trimmedValue.includes("T") ? trimmedValue.slice(11, 16) : ""

  return time ? `${date} ${time}` : date
}
