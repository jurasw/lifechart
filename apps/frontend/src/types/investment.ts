export type AssetType = "stock" | "crypto" | "bond"
export type Currency = "USD" | "EUR" | "PLN"

export interface Investment {
  id: string
  symbol: string
  name: string
  type: AssetType
  volume: number
  purchaseDate: number
  purchasePrice: number
  purchaseCurrency: Currency
  currentPrice?: number
  lastUpdated?: number
  profit?: number
  profitPercent?: number
}

export interface PriceData {
  symbol: string
  price: number
  change: number
  changePercent: number
  timestamp: number
}

