import type { Currency } from "@/hooks/useCurrency"

export interface ExchangeRates {
  USD: number
  EUR: number
  PLN: number
}

const EXCHANGE_RATE_API = "https://api.exchangerate-api.com/v4/latest/USD"

let cachedRates: ExchangeRates | null = null
let lastFetchTime: number = 0
const CACHE_DURATION = 60 * 60 * 1000

export const fetchExchangeRates = async (): Promise<ExchangeRates | null> => {
  const now = Date.now()
  
  if (cachedRates && now - lastFetchTime < CACHE_DURATION) {
    return cachedRates
  }

  try {
    const response = await fetch(EXCHANGE_RATE_API)
    const data = await response.json()
    
    if (data.rates) {
      cachedRates = {
        USD: 1,
        EUR: data.rates.EUR || 0.92,
        PLN: data.rates.PLN || 4.0,
      }
      lastFetchTime = now
      return cachedRates
    }
    return null
  } catch (error) {
    return cachedRates || {
      USD: 1,
      EUR: 0.92,
      PLN: 4.0,
    }
  }
}

export const convertCurrency = (
  amount: number,
  fromCurrency: Currency,
  toCurrency: Currency,
  rates: ExchangeRates
): number => {
  if (fromCurrency === toCurrency) return amount
  
  const amountInUSD = fromCurrency === "USD" 
    ? amount 
    : amount / rates[fromCurrency]
  
  return toCurrency === "USD"
    ? amountInUSD
    : amountInUSD * rates[toCurrency]
}

