import { useState } from "react"

export type Currency = "USD" | "EUR" | "PLN"

export const useCurrency = () => {
  const [currency, setCurrency] = useState<Currency>("PLN")

  return {
    currency,
    setCurrency,
  }
}

