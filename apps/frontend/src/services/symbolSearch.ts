export interface SymbolSuggestion {
  symbol: string
  name: string
  type: "stock" | "crypto" | "bond"
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

const polishBonds: Record<string, string> = {
  "PL0000110673": "Obligacja Skarbowa 2-letnia",
  "PL0000110681": "Obligacja Skarbowa 3-letnia",
  "PL0000110699": "Obligacja Skarbowa 4-letnia",
  "PL0000110707": "Obligacja Skarbowa 5-letnia",
  "PL0000110715": "Obligacja Skarbowa 6-letnia",
  "PL0000110723": "Obligacja Skarbowa 7-letnia",
  "PL0000110731": "Obligacja Skarbowa 8-letnia",
  "PL0000110749": "Obligacja Skarbowa 9-letnia",
  "PL0000110756": "Obligacja Skarbowa 10-letnia",
  "OS0202": "Obligacja Skarbowa 2-letnia",
  "OS0302": "Obligacja Skarbowa 3-letnia",
  "OS0402": "Obligacja Skarbowa 4-letnia",
  "OS0502": "Obligacja Skarbowa 5-letnia",
  "OS0602": "Obligacja Skarbowa 6-letnia",
  "OS0702": "Obligacja Skarbowa 7-letnia",
  "OS0802": "Obligacja Skarbowa 8-letnia",
  "OS0902": "Obligacja Skarbowa 9-letnia",
  "OS1002": "Obligacja Skarbowa 10-letnia",
  "EDO0225": "Obligacja Skarbowa EDO 2025",
  "EDO0325": "Obligacja Skarbowa EDO 2025",
  "EDO0425": "Obligacja Skarbowa EDO 2025",
  "EDO0525": "Obligacja Skarbowa EDO 2025",
  "EDO0625": "Obligacja Skarbowa EDO 2025",
  "EDO0725": "Obligacja Skarbowa EDO 2025",
  "EDO0825": "Obligacja Skarbowa EDO 2025",
  "EDO0925": "Obligacja Skarbowa EDO 2025",
  "EDO1025": "Obligacja Skarbowa EDO 2025",
}

export const searchSymbols = async (query: string, filterType?: "stock" | "crypto" | "bond"): Promise<SymbolSuggestion[]> => {
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

  if (filterType === "bond") {
    Object.keys(polishBonds).forEach((key) => {
      const name = polishBonds[key].toUpperCase()
      if (
        key.includes(queryUpper) ||
        name.includes(queryUpper) ||
        queryUpper.includes(key)
      ) {
        suggestions.push({
          symbol: key,
          name: polishBonds[key],
          type: "bond",
        })
      }
    })
  }

  if (filterType !== "crypto" && filterType !== "bond" && (queryUpper.includes(".WA") || queryUpper.includes(".PL"))) {
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

  if (filterType !== "crypto" && filterType !== "bond" && suggestions.length === 0) {
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
          const isBond = quoteType === "BOND" || quoteType === "GOVERNMENT_BOND"
          
          if (filterType === "crypto" && isCrypto) {
            const existingIndex = suggestions.findIndex((s) => s.symbol === symbol)
            if (existingIndex === -1) {
              suggestions.push({
                symbol: symbol,
                name: name,
                type: "crypto",
              })
            }
          } else if (filterType === "bond" && isBond) {
            const existingIndex = suggestions.findIndex((s) => s.symbol === symbol)
            if (existingIndex === -1) {
              suggestions.push({
                symbol: symbol,
                name: name,
                type: "bond",
              })
            }
          } else if (filterType !== "crypto" && filterType !== "bond" && isStock) {
            const existingIndex = suggestions.findIndex((s) => s.symbol === symbol)
            if (existingIndex === -1) {
              suggestions.push({
                symbol: symbol,
                name: name,
                type: "stock",
              })
            }
          } else if (!filterType && (isCrypto || isStock || isBond)) {
            const existingIndex = suggestions.findIndex((s) => s.symbol === symbol)
            if (existingIndex === -1) {
              let assetType: "stock" | "crypto" | "bond" = "stock"
              if (isCrypto) assetType = "crypto"
              else if (isBond) assetType = "bond"
              suggestions.push({
                symbol: symbol,
                name: name,
                type: assetType,
              })
            }
          }
        }
      })
    }
  } catch (error) {
  }
  
  if (filterType !== "crypto" && filterType !== "bond" && suggestions.length === 0 && query.includes(".")) {
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

