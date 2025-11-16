export interface SymbolSuggestion {
  symbol: string
  name: string
  type: "stock" | "crypto"
}

const polishStocks: Record<string, string> = {
  "PKO": "PKO Bank Polski",
  "CDR": "CD Projekt",
  "PKN": "PKN Orlen",
  "KGH": "KGHM Polska Miedź",
  "PZU": "PZU",
  "LPP": "LPP",
  "ALR": "Allegro",
  "CCC": "CCC",
  "DNP": "Dino Polska",
  "MBK": "mBank",
  "PEO": "Bank Pekao",
  "ING": "ING Bank Śląski",
  "PKO.WA": "PKO Bank Polski",
  "CDR.WA": "CD Projekt",
  "PKN.WA": "PKN Orlen",
  "KGH.WA": "KGHM Polska Miedź",
  "PZU.WA": "PZU",
  "LPP.WA": "LPP",
  "ALR.WA": "Allegro",
  "CCC.WA": "CCC",
  "DNP.WA": "Dino Polska",
  "MBK.WA": "mBank",
  "PEO.WA": "Bank Pekao",
  "ING.WA": "ING Bank Śląski",
}

export const searchSymbols = async (query: string, filterType?: "stock" | "crypto"): Promise<SymbolSuggestion[]> => {
  if (!query || query.length < 1) return []

  const queryUpper = query.toUpperCase()
  const suggestions: SymbolSuggestion[] = []

  if (filterType === "crypto") {
    const commonCryptos: Record<string, string> = {
      "BTC": "Bitcoin",
      "ETH": "Ethereum",
      "BNB": "Binance Coin",
      "SOL": "Solana",
      "ADA": "Cardano",
      "XRP": "Ripple",
      "DOT": "Polkadot",
      "DOGE": "Dogecoin",
      "AVAX": "Avalanche",
      "SHIB": "Shiba Inu",
      "MATIC": "Polygon",
      "LTC": "Litecoin",
      "UNI": "Uniswap",
      "LINK": "Chainlink",
      "ATOM": "Cosmos",
      "ETC": "Ethereum Classic",
      "XLM": "Stellar",
      "ALGO": "Algorand",
      "VET": "VeChain",
    }
    
    Object.keys(commonCryptos).forEach((key) => {
      if (key.includes(queryUpper) || queryUpper.includes(key) || commonCryptos[key].toUpperCase().includes(queryUpper)) {
        suggestions.push({
          symbol: key,
          name: commonCryptos[key],
          type: "crypto",
        })
      }
    })
  }

  if (filterType !== "crypto" && (queryUpper.includes(".WA") || queryUpper.includes(".PL"))) {
    const symbolBase = queryUpper.replace(/\.(WA|PL)$/, "")
    Object.keys(polishStocks).forEach((key) => {
      if (key.includes(symbolBase) || symbolBase.includes(key.replace(".WA", ""))) {
        const symbol = key.includes(".WA") ? key : `${key}.WA`
        suggestions.push({
          symbol: symbol,
          name: polishStocks[key] || symbol,
          type: "stock",
        })
      }
    })
  }

  if (filterType !== "crypto" && suggestions.length === 0) {
    Object.keys(polishStocks).forEach((key) => {
      const name = polishStocks[key].toUpperCase()
      const symbolBase = key.replace(".WA", "").toUpperCase()
      if (
        symbolBase.includes(queryUpper) ||
        name.includes(queryUpper) ||
        queryUpper.includes(symbolBase)
      ) {
        const symbol = key.includes(".WA") ? key : `${key}.WA`
        suggestions.push({
          symbol: symbol,
          name: polishStocks[key] || symbol,
          type: "stock",
        })
      }
    })
  }

  try {
    const encodedQuery = encodeURIComponent(query)
    const proxyUrl = `https://api.allorigins.win/get?url=${encodeURIComponent(
      `https://query1.finance.yahoo.com/v1/finance/search?q=${encodedQuery}&lang=en-US&region=US&quotesCount=20&newsCount=0`
    )}`
    
    const response = await fetch(proxyUrl)
    const proxyData = await response.json()
    const data = JSON.parse(proxyData.contents)
    
    if (data.quotes && Array.isArray(data.quotes)) {
      data.quotes.forEach((quote: any) => {
        const symbol = quote.symbol || quote.ticker || ""
        const name = quote.shortname || quote.longname || quote.name || ""
        const quoteType = quote.quoteType || ""
        
        if (symbol && name) {
          const isCrypto = quoteType === "CRYPTOCURRENCY"
          const isStock = quoteType === "EQUITY" || quoteType === "ETF" || quoteType === "INDEX"
          
          if (filterType === "crypto" && isCrypto) {
            const existingIndex = suggestions.findIndex((s) => s.symbol === symbol)
            if (existingIndex === -1) {
              suggestions.push({
                symbol: symbol,
                name: name,
                type: "crypto",
              })
            }
          } else if (filterType !== "crypto" && isStock) {
            const existingIndex = suggestions.findIndex((s) => s.symbol === symbol)
            if (existingIndex === -1) {
              suggestions.push({
                symbol: symbol,
                name: name,
                type: "stock",
              })
            }
          } else if (!filterType && (isCrypto || isStock)) {
            const existingIndex = suggestions.findIndex((s) => s.symbol === symbol)
            if (existingIndex === -1) {
              suggestions.push({
                symbol: symbol,
                name: name,
                type: isCrypto ? "crypto" : "stock",
              })
            }
          }
        }
      })
    }
  } catch (error) {
    console.error("Error searching symbols:", error)
  }
  
  if (filterType !== "crypto" && suggestions.length === 0 && query.includes(".")) {
    const symbolUpper = query.toUpperCase()
    const exchangeMap: Record<string, string> = {
      ".WA": "Warsaw Stock Exchange",
      ".PL": "Warsaw Stock Exchange",
      ".DE": "XETRA",
      ".L": "London Stock Exchange",
      ".PA": "Paris Stock Exchange",
      ".AS": "Amsterdam Stock Exchange",
      ".MI": "Milan Stock Exchange",
      ".BR": "Brussels Stock Exchange",
      ".LS": "Lisbon Stock Exchange",
      ".MC": "Madrid Stock Exchange",
      ".VI": "Vienna Stock Exchange",
      ".SW": "Swiss Exchange",
      ".ST": "Stockholm Stock Exchange",
      ".OL": "Oslo Stock Exchange",
      ".HE": "Helsinki Stock Exchange",
      ".CO": "Copenhagen Stock Exchange",
      ".IC": "Iceland Stock Exchange",
      ".IR": "Irish Stock Exchange",
      ".AT": "Athens Stock Exchange",
    }
    
    const postfix = symbolUpper.substring(symbolUpper.lastIndexOf("."))
    const exchangeName = exchangeMap[postfix] || "Stock Exchange"
    
    suggestions.push({
      symbol: symbolUpper,
      name: `${symbolUpper} (${exchangeName})`,
      type: "stock",
    })
  }
  
  return suggestions.slice(0, 15)
}

