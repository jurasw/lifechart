import type { PriceData, AssetType } from "@/types/investment"

const YAHOO_FINANCE_API = "https://query1.finance.yahoo.com/v8/finance/chart"

const PROXIES = [
  "https://api.allorigins.win/get?url=",
  "https://corsproxy.io/?",
  "https://api.codetabs.com/v1/proxy?quest=",
]

let lastRequestTime = 0
const MIN_REQUEST_INTERVAL = 1000
const MAX_RETRIES = 3

const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

export const fetchWithProxy = async (
  url: string,
  proxyIndex: number = 0,
  retryCount: number = 0,
  signal?: AbortSignal
): Promise<any> => {
  if (retryCount >= MAX_RETRIES) {
    throw new Error("Max retries reached")
  }

  if (proxyIndex >= PROXIES.length) {
    if (retryCount < MAX_RETRIES) {
      await delay(2000 * (retryCount + 1))
      return fetchWithProxy(url, 0, retryCount + 1, signal)
    }
    throw new Error("All proxies failed")
  }

  const proxy = PROXIES[proxyIndex]
  const proxyUrl = proxy + encodeURIComponent(url)
  
  const now = Date.now()
  const timeSinceLastRequest = now - lastRequestTime
  if (timeSinceLastRequest < MIN_REQUEST_INTERVAL) {
    await delay(MIN_REQUEST_INTERVAL - timeSinceLastRequest)
  }
  lastRequestTime = Date.now()

  try {
    const response = await fetch(proxyUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      },
      signal,
    })

    if (signal?.aborted) {
      throw new Error("Request aborted")
    }

    if (response.status === 429) {
      await delay(2000 * (retryCount + 1))
      return fetchWithProxy(url, (proxyIndex + 1) % PROXIES.length, retryCount, signal)
    }

    if (!response.ok) {
      if (proxyIndex < PROXIES.length - 1) {
        return fetchWithProxy(url, proxyIndex + 1, retryCount, signal)
      }
      if (retryCount < MAX_RETRIES) {
        await delay(2000 * (retryCount + 1))
        return fetchWithProxy(url, 0, retryCount + 1, signal)
      }
      throw new Error(`HTTP error! status: ${response.status}`)
    }

    if (proxy.includes("allorigins.win")) {
      const proxyData = await response.json()
      return JSON.parse(proxyData.contents)
    } else {
      return await response.json()
    }
  } catch (error: any) {
    if (error.name === "AbortError" || signal?.aborted) {
      throw new Error("Request aborted")
    }
    if (proxyIndex < PROXIES.length - 1) {
      return fetchWithProxy(url, proxyIndex + 1, retryCount, signal)
    }
    if (retryCount < MAX_RETRIES) {
      await delay(2000 * (retryCount + 1))
      return fetchWithProxy(url, 0, retryCount + 1, signal)
    }
    throw error
  }
}

export const fetchStockPrice = async (symbol: string, signal?: AbortSignal): Promise<PriceData | null> => {
  try {
    const url = `${YAHOO_FINANCE_API}/${symbol}?interval=1d&range=1d`
    const data = await fetchWithProxy(url, 0, 0, signal)
    
    if (data.chart?.result?.[0]?.meta) {
      const meta = data.chart.result[0].meta
      const previousClose = meta.previousClose || meta.regularMarketPrice
      const currentPrice = meta.regularMarketPrice || meta.regularMarketPreviousClose
      const change = currentPrice - previousClose
      const changePercent = previousClose ? (change / previousClose) * 100 : 0

      return {
        symbol: symbol.toUpperCase(),
        price: currentPrice,
        change,
        changePercent,
        timestamp: Date.now(),
      }
    }
    return null
  } catch (error: any) {
    if (error.message === "Request aborted") {
      return null
    }
    console.error(`Error fetching price for ${symbol}:`, error)
    return null
  }
}

export const fetchCryptoPrice = async (symbol: string, signal?: AbortSignal): Promise<PriceData | null> => {
  try {
    const cryptoSymbol = symbol.includes("-") ? symbol : `${symbol}-USD`
    const url = `${YAHOO_FINANCE_API}/${cryptoSymbol}?interval=1d&range=1d`
    const data = await fetchWithProxy(url, 0, 0, signal)
    
    if (data.chart?.result?.[0]?.meta) {
      const meta = data.chart.result[0].meta
      const previousClose = meta.previousClose || meta.regularMarketPrice
      const currentPrice = meta.regularMarketPrice || meta.regularMarketPreviousClose
      const change = currentPrice - previousClose
      const changePercent = previousClose ? (change / previousClose) * 100 : 0

      return {
        symbol: symbol.toUpperCase(),
        price: currentPrice,
        change,
        changePercent,
        timestamp: Date.now(),
      }
    }
    return null
  } catch (error: any) {
    if (error.message === "Request aborted") {
      return null
    }
    console.error(`Error fetching crypto price for ${symbol}:`, error)
    return null
  }
}

export const fetchBondPrice = async (symbol: string, signal?: AbortSignal): Promise<PriceData | null> => {
  return fetchStockPrice(symbol, signal)
}

export const fetchPrice = async (symbol: string, type: AssetType, signal?: AbortSignal): Promise<PriceData | null> => {
  if (type === "crypto") {
    return fetchCryptoPrice(symbol, signal)
  }
  if (type === "bond") {
    return fetchBondPrice(symbol, signal)
  }
  return fetchStockPrice(symbol, signal)
}

export const fetchMultiplePrices = async (
  symbols: { symbol: string; type: AssetType }[],
  signal?: AbortSignal
): Promise<Map<string, PriceData>> => {
  const priceMap = new Map<string, PriceData>()
  
  if (symbols.length === 0) {
    return priceMap
  }

  const stocks = symbols.filter(s => s.type === "stock" || s.type === "bond").map(s => s.symbol)
  const cryptos = symbols.filter(s => s.type === "crypto").map(s => s.symbol.includes("-") ? s.symbol : `${s.symbol}-USD`)

  try {
    if (stocks.length > 0) {
      const stocksSymbols = stocks.join(",")
      const url = `${YAHOO_FINANCE_API}/${stocksSymbols}?interval=1d&range=1d`
      const data = await fetchWithProxy(url, 0, 0, signal)
      
      if (signal?.aborted) {
        return priceMap
      }

      if (data.chart?.result) {
        data.chart.result.forEach((result: any, index: number) => {
          if (result.meta) {
            const meta = result.meta
            const symbol = stocks[index].toUpperCase()
            const previousClose = meta.previousClose || meta.regularMarketPrice
            const currentPrice = meta.regularMarketPrice || meta.regularMarketPreviousClose
            const change = currentPrice - previousClose
            const changePercent = previousClose ? (change / previousClose) * 100 : 0

            priceMap.set(symbol, {
              symbol,
              price: currentPrice,
              change,
              changePercent,
              timestamp: Date.now(),
            })
          }
        })
      }
    }

    if (cryptos.length > 0) {
      const cryptoSymbols = cryptos.join(",")
      const url = `${YAHOO_FINANCE_API}/${cryptoSymbols}?interval=1d&range=1d`
      const data = await fetchWithProxy(url, 0, 0, signal)
      
      if (signal?.aborted) {
        return priceMap
      }

      if (data.chart?.result) {
        data.chart.result.forEach((result: any, index: number) => {
          if (result.meta) {
            const meta = result.meta
            const fullSymbol = cryptos[index]
            const symbol = fullSymbol.replace("-USD", "").toUpperCase()
            const previousClose = meta.previousClose || meta.regularMarketPrice
            const currentPrice = meta.regularMarketPrice || meta.regularMarketPreviousClose
            const change = currentPrice - previousClose
            const changePercent = previousClose ? (change / previousClose) * 100 : 0

            priceMap.set(symbol, {
              symbol,
              price: currentPrice,
              change,
              changePercent,
              timestamp: Date.now(),
            })
          }
        })
      }
    }
  } catch (error: unknown) {
    if (error instanceof Error && error.message !== "Request aborted") {
      console.error("Error fetching bulk prices:", error)
    }
  }
  
  return priceMap
}

