import type { Currency } from "@/hooks/useCurrency"
import type { Investment } from "@/types/investment"

const currencySymbols: Record<Currency, string> = {
  USD: "$",
  EUR: "€",
  PLN: "zł",
}

export const isPolishAsset = (investment: Investment): boolean => {
  const symbol = investment.symbol.toUpperCase()
  return (
    symbol.includes(".WA") ||
    symbol.includes(".PL") ||
    (investment.type === "bond" && symbol.startsWith("PL")) ||
    (investment.type === "bond" && (symbol.startsWith("OS") || symbol.startsWith("EDO")))
  )
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

