import { useLocalStorage } from "./useLocalStorage"

export type Currency = "USD" | "EUR" | "PLN"

export const useCurrency = () => {
  const [currency, setCurrency] = useLocalStorage<Currency>("currency", "USD")

  return {
    currency,
    setCurrency,
  }
}

