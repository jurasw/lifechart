import type { AssetType } from "@/types/investment"

export interface HistoricalPricePoint {
  date: number
  price: number
}

const YAHOO_FINANCE_API = "https://query1.finance.yahoo.com/v8/finance/chart"

const getRangeForPeriod = (days: number): string => {
  if (days <= 7) return "5d"
  if (days <= 30) return "1mo"
  if (days <= 90) return "3mo"
  if (days <= 180) return "6mo"
  if (days <= 365) return "1y"
  return "2y"
}

const getIntervalForGranulation = (granulation: "daily" | "weekly" | "monthly"): string => {
  switch (granulation) {
    case "daily":
      return "1d"
    case "weekly":
      return "1wk"
    case "monthly":
      return "1mo"
  }
}

export const fetchHistoricalPrices = async (
  symbol: string,
  type: AssetType,
  startDate: Date,
  endDate: Date,
  granulation: "daily" | "weekly" | "monthly",
  signal?: AbortSignal
): Promise<HistoricalPricePoint[]> => {
  try {
    const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
    const range = getRangeForPeriod(daysDiff)
    const interval = getIntervalForGranulation(granulation)

    const actualSymbol = type === "crypto" && !symbol.includes("-") ? `${symbol}-USD` : symbol

    const url = `${YAHOO_FINANCE_API}/${actualSymbol}?interval=${interval}&range=${range}`
    
    const { fetchWithProxy } = await import("./priceApi")
    const data = await fetchWithProxy(url, 0, 0, signal)
    
    if (signal?.aborted) {
      return []
    }
    
    await new Promise(resolve => setTimeout(resolve, 500))

    if (data.chart?.result?.[0]) {
      const result = data.chart.result[0]
      const timestamps = result.timestamp || []
      const quotes = result.indicators?.quote?.[0] || {}
      const prices = quotes.close || quotes.open || []

      const historicalData: HistoricalPricePoint[] = []
      const startTimestamp = Math.floor(startDate.getTime() / 1000)
      const endTimestamp = Math.ceil(endDate.getTime() / 1000)

      for (let i = 0; i < timestamps.length; i++) {
        const timestamp = timestamps[i]
        const price = prices[i]

        if (price !== null && price !== undefined && price > 0) {
          if (timestamp >= startTimestamp && timestamp <= endTimestamp) {
            historicalData.push({
              date: timestamp * 1000,
              price: price,
            })
          }
        }
      }

      if (historicalData.length === 0 && prices.length > 0) {
        for (let i = 0; i < timestamps.length; i++) {
          const timestamp = timestamps[i]
          const price = prices[i]
          if (price !== null && price !== undefined && price > 0) {
            const pointDate = timestamp * 1000
            if (pointDate >= startDate.getTime() && pointDate <= endDate.getTime()) {
              historicalData.push({
                date: pointDate,
                price: price,
              })
            }
          }
        }
      }

      return historicalData.sort((a, b) => a.date - b.date)
    }

    return []
  } catch (error: any) {
    if (error.message === "Request aborted") {
      return []
    }
    return []
  }
}

export const fetchMultipleHistoricalPrices = async (
  symbols: { symbol: string; type: AssetType }[],
  startDate: Date,
  endDate: Date,
  granulation: "daily" | "weekly" | "monthly",
  signal?: AbortSignal
): Promise<Map<string, HistoricalPricePoint[]>> => {
  const priceMap = new Map<string, HistoricalPricePoint[]>()

  if (symbols.length === 0) {
    return priceMap
  }

  const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
  const range = getRangeForPeriod(daysDiff)
  const interval = getIntervalForGranulation(granulation)
  const startTimestamp = Math.floor(startDate.getTime() / 1000)
  const endTimestamp = Math.ceil(endDate.getTime() / 1000)

  const stocks = symbols.filter(s => s.type === "stock").map(s => s.symbol)
  const cryptos = symbols.filter(s => s.type === "crypto").map(s => s.symbol.includes("-") ? s.symbol : `${s.symbol}-USD`)

  try {
    if (stocks.length > 0) {
      const stocksSymbols = stocks.join(",")
      const url = `${YAHOO_FINANCE_API}/${stocksSymbols}?interval=${interval}&range=${range}`
      
      const { fetchWithProxy } = await import("./priceApi")
      const data = await fetchWithProxy(url, 0, 0, signal)
      
      if (signal?.aborted) {
        return priceMap
      }

      if (data.chart?.result) {
        data.chart.result.forEach((result: any, index: number) => {
          if (result) {
            const symbol = stocks[index].toUpperCase()
            const timestamps = result.timestamp || []
            const quotes = result.indicators?.quote?.[0] || {}
            const prices = quotes.close || quotes.open || []

            const historicalData: HistoricalPricePoint[] = []

            for (let i = 0; i < timestamps.length; i++) {
              const timestamp = timestamps[i]
              const price = prices[i]

              if (price !== null && price !== undefined && price > 0) {
                if (timestamp >= startTimestamp && timestamp <= endTimestamp) {
                  historicalData.push({
                    date: timestamp * 1000,
                    price: price,
                  })
                }
              }
            }

            if (historicalData.length === 0 && prices.length > 0) {
              for (let i = 0; i < timestamps.length; i++) {
                const timestamp = timestamps[i]
                const price = prices[i]
                if (price !== null && price !== undefined && price > 0) {
                  historicalData.push({
                    date: timestamp * 1000,
                    price: price,
                  })
                }
              }
            }

            if (historicalData.length > 0) {
              priceMap.set(symbol, historicalData.sort((a, b) => a.date - b.date))
            }
          }
        })
      }
    }

    if (cryptos.length > 0) {
      const cryptoSymbols = cryptos.join(",")
      const url = `${YAHOO_FINANCE_API}/${cryptoSymbols}?interval=${interval}&range=${range}`
      
      const { fetchWithProxy } = await import("./priceApi")
      const data = await fetchWithProxy(url, 0, 0, signal)
      
      if (signal?.aborted) {
        return priceMap
      }

      if (data.chart?.result) {
        data.chart.result.forEach((result: any, index: number) => {
          if (result) {
            const fullSymbol = cryptos[index]
            const symbol = fullSymbol.replace("-USD", "").toUpperCase()
            const timestamps = result.timestamp || []
            const quotes = result.indicators?.quote?.[0] || {}
            const prices = quotes.close || quotes.open || []

            const historicalData: HistoricalPricePoint[] = []

            for (let i = 0; i < timestamps.length; i++) {
              const timestamp = timestamps[i]
              const price = prices[i]

              if (price !== null && price !== undefined && price > 0) {
                if (timestamp >= startTimestamp && timestamp <= endTimestamp) {
                  historicalData.push({
                    date: timestamp * 1000,
                    price: price,
                  })
                }
              }
            }

            if (historicalData.length === 0 && prices.length > 0) {
              for (let i = 0; i < timestamps.length; i++) {
                const timestamp = timestamps[i]
                const price = prices[i]
                if (price !== null && price !== undefined && price > 0) {
                  historicalData.push({
                    date: timestamp * 1000,
                    price: price,
                  })
                }
              }
            }

            if (historicalData.length > 0) {
              priceMap.set(symbol, historicalData.sort((a, b) => a.date - b.date))
            }
          }
        })
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message !== "Request aborted") {
    }
  }

  return priceMap
}

