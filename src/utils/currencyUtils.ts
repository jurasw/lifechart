import type { Currency } from "@/hooks/useCurrency"

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  PLN: "zł",
}

export const formatCurrency = (amount: number, currency: Currency): string => {
  const symbol = currencySymbols[currency]
  const formatted = amount.toLocaleString("pl-PL", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })
  return `${symbol}${formatted}`
}

export const formatNumber = (value: number, decimals: number = 2): string => {
  return value.toLocaleString("pl-PL", {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })
}

