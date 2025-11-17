import { useState, useMemo, useEffect, useRef } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Select } from "@/components/ui/select"
import type { Investment } from "@/types/investment"
import type { Currency } from "@/hooks/useCurrency"
import { formatCurrency, isPolishAsset } from "@/utils/currencyUtils"
import { convertCurrency } from "@/services/exchangeRates"
import type { ExchangeRates } from "@/services/exchangeRates"
import { fetchMultipleHistoricalPrices } from "@/services/historicalPriceApi"
import type { HistoricalPricePoint } from "@/services/historicalPriceApi"
import { format, subMonths, subWeeks } from "date-fns"

type Period = "1w" | "1m" | "3m" | "6m" | "1y" | "all"
type Granulation = "daily" | "weekly" | "monthly"

interface InvestmentTimelineChartProps {
  investments: Investment[]
  currency: Currency
  exchangeRates: ExchangeRates | null
}

export const InvestmentTimelineChart = ({
  investments,
  currency,
  exchangeRates,
}: InvestmentTimelineChartProps) => {
  const [period, setPeriod] = useState<Period>("all")
  const [granulation, setGranulation] = useState<Granulation>("monthly")
  const [historicalData, setHistoricalData] = useState<Map<string, HistoricalPricePoint[]>>(new Map())
  const [isLoading, setIsLoading] = useState(false)
  const [hoveredPoint, setHoveredPoint] = useState<{ date: Date; value: number; x: number; y: number } | null>(null)
  const svgRef = useRef<SVGSVGElement>(null)
  const cacheRef = useRef<Map<string, { data: HistoricalPricePoint[]; timestamp: number; period: Period; granulation: Granulation }>>(new Map())

  const convert = (amount: number, fromCurrency: string = "USD") => {
    if (!exchangeRates) return amount
    return convertCurrency(amount, fromCurrency as any, currency, exchangeRates)
  }

  const earliestPurchaseDateRef = useRef<number | null>(null)
  if (investments.length > 0) {
    const earliestPurchase = Math.min(...investments.map((inv) => inv.purchaseDate))
    if (earliestPurchaseDateRef.current !== earliestPurchase) {
      earliestPurchaseDateRef.current = earliestPurchase
    }
  } else {
    earliestPurchaseDateRef.current = null
  }

  const dateRange = useMemo(() => {
    const now = new Date()
    now.setHours(0, 0, 0, 0)
    let startDate: Date

    switch (period) {
      case "1w":
        startDate = subWeeks(now, 1)
        break
      case "1m":
        startDate = subMonths(now, 1)
        break
      case "3m":
        startDate = subMonths(now, 3)
        break
      case "6m":
        startDate = subMonths(now, 6)
        break
      case "1y":
        startDate = subMonths(now, 12)
        break
      case "all":
        if (investments.length === 0) {
          startDate = subMonths(now, 1)
        } else {
          const earliestPurchase = earliestPurchaseDateRef.current || Math.min(...investments.map((inv) => inv.purchaseDate))
          startDate = new Date(earliestPurchase)
          startDate.setHours(0, 0, 0, 0)
        }
        break
    }

    startDate.setHours(0, 0, 0, 0)

    return { startDate, endDate: now }
  }, [period, investments.length, earliestPurchaseDateRef.current])

  const abortControllerRef = useRef<AbortController | null>(null)
  const isLoadingRef = useRef(false)
  const lastRequestKeyRef = useRef<string>("")

  useEffect(() => {
    const requestKey = `${investments.length}-${period}-${granulation}-${dateRange.startDate.getTime()}-${dateRange.endDate.getTime()}`
    
    if (lastRequestKeyRef.current === requestKey && isLoadingRef.current) {
      return
    }

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal
    lastRequestKeyRef.current = requestKey

    const loadHistoricalData = async () => {
      if (investments.length === 0) {
        setHistoricalData(new Map())
        setIsLoading(false)
        isLoadingRef.current = false
        return
      }

      const symbols = investments.map((inv) => ({
        symbol: inv.symbol,
        type: inv.type,
      }))

      const uniqueSymbols = Array.from(new Map(symbols.map(s => [s.symbol.toUpperCase(), s])).values())
      const CACHE_DURATION = 5 * 60 * 1000
      
      const data = new Map<string, HistoricalPricePoint[]>()
      const symbolsToFetch: typeof uniqueSymbols = []
      
      for (const { symbol, type } of uniqueSymbols) {
        const cacheKey = `${symbol}-${period}-${granulation}`
        const cached = cacheRef.current.get(cacheKey)
        const cacheAge = cached ? Date.now() - cached.timestamp : Infinity
        
        if (cached && cacheAge < CACHE_DURATION && cached.period === period && cached.granulation === granulation) {
          data.set(symbol.toUpperCase(), cached.data)
        } else {
          symbolsToFetch.push({ symbol, type })
        }
      }

      if (symbolsToFetch.length === 0) {
        setHistoricalData(data)
        setIsLoading(false)
        isLoadingRef.current = false
        return
      }

      setIsLoading(true)
      isLoadingRef.current = true
      
      try {
        const batchSize = 3
        
        for (let i = 0; i < symbolsToFetch.length; i += batchSize) {
          if (signal.aborted) break
          
          const batch = symbolsToFetch.slice(i, i + batchSize)
          const batchPromises = batch.map(({ symbol, type }) => 
            fetchMultipleHistoricalPrices(
              [{ symbol, type }],
              dateRange.startDate,
              dateRange.endDate,
              granulation,
              signal
            )
          )
          
          const batchResults = await Promise.all(batchPromises)
          
          batchResults.forEach((resultMap, batchIndex) => {
            resultMap.forEach((points, symbol) => {
              data.set(symbol, points)
              const { symbol: originalSymbol } = batch[batchIndex]
              cacheRef.current.set(`${originalSymbol}-${period}-${granulation}`, {
                data: points,
                timestamp: Date.now(),
                period,
                granulation,
              })
            })
          })
        }

        if (!signal.aborted) {
          setHistoricalData(data)
        }
      } catch (error: unknown) {
        if (error instanceof Error && error.message !== "Request aborted") {
          console.error("Error loading historical data:", error)
        }
      } finally {
        if (!signal.aborted) {
          setIsLoading(false)
          isLoadingRef.current = false
        }
      }
    }

    const timeoutId = setTimeout(() => {
      loadHistoricalData()
    }, 300)

    return () => {
      clearTimeout(timeoutId)
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      isLoadingRef.current = false
    }
  }, [investments.length, period, granulation, dateRange.startDate.getTime(), dateRange.endDate.getTime()])

  const currentValueData = useMemo(() => {
    if (investments.length === 0) return null

    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    let totalValue = 0
    investments.forEach((investment) => {
      const purchaseDate = new Date(investment.purchaseDate)
      purchaseDate.setHours(0, 0, 0, 0)
      if (today >= purchaseDate) {
        const isPolishStock = investment.symbol.includes(".WA") || investment.symbol.includes(".PL")
        const purchaseCurrency = investment.purchaseCurrency || "USD"
        let priceInPurchaseCurrency = investment.purchasePrice
        if (investment.currentPrice) {
          if (isPolishStock && purchaseCurrency === "PLN") {
            priceInPurchaseCurrency = investment.currentPrice
          } else if (exchangeRates && purchaseCurrency !== "USD") {
            priceInPurchaseCurrency = convertCurrency(
              investment.currentPrice,
              "USD",
              purchaseCurrency as any,
              exchangeRates
            )
          } else {
            priceInPurchaseCurrency = investment.currentPrice
          }
        }
        totalValue += investment.volume * convert(priceInPurchaseCurrency, purchaseCurrency)
      }
    })
    
    if (totalValue > 0) {
      return { date: today, value: totalValue }
    }
    return null
  }, [investments, currency, exchangeRates, convert])

  const chartData = useMemo(() => {
    if (investments.length === 0) return currentValueData ? [currentValueData] : []

    const dataPoints: { date: Date; value: number }[] = []
    const { startDate, endDate } = dateRange

    if (historicalData.size === 0) {
      if (currentValueData) {
        return [currentValueData]
      }
      return []
    }

    const allDates = new Set<number>()
    
    historicalData.forEach((pricePoints) => {
      pricePoints.forEach((point) => {
        const pointDate = new Date(point.date)
        pointDate.setHours(0, 0, 0, 0)
        if (pointDate >= startDate && pointDate <= endDate) {
          allDates.add(pointDate.getTime())
        }
      })
    })
    
    investments.forEach((investment) => {
      const purchaseDate = new Date(investment.purchaseDate)
      purchaseDate.setHours(0, 0, 0, 0)
      if (purchaseDate >= startDate && purchaseDate <= endDate) {
        allDates.add(purchaseDate.getTime())
      }
    })
    
    if (allDates.size === 0 && currentValueData) {
      allDates.add(currentValueData.date.getTime())
    }

    const sortedDates = Array.from(allDates).sort((a, b) => a - b)

    if (sortedDates.length === 0) {
      if (currentValueData) {
        return [currentValueData]
      }
      return []
    }

    const earliestPurchaseDate = investments.length > 0 
      ? new Date(Math.min(...investments.map(inv => inv.purchaseDate)))
      : null
    if (earliestPurchaseDate) {
      earliestPurchaseDate.setHours(0, 0, 0, 0)
    }

    sortedDates.forEach((timestamp) => {
      const date = new Date(timestamp)
      date.setHours(0, 0, 0, 0)

      if (date < startDate || date > endDate) {
        return
      }

      let totalValue = 0

      investments.forEach((investment) => {
        const purchaseDate = new Date(investment.purchaseDate)
        purchaseDate.setHours(0, 0, 0, 0)
        
        if (date >= purchaseDate) {
          const symbolData = historicalData.get(investment.symbol.toUpperCase())
          if (symbolData && symbolData.length > 0) {
            let pricePoint: HistoricalPricePoint | undefined
            
            for (let i = symbolData.length - 1; i >= 0; i--) {
              const point = symbolData[i]
              const pointDate = new Date(point.date)
              pointDate.setHours(0, 0, 0, 0)
              
              if (pointDate.getTime() <= date.getTime()) {
                pricePoint = point
                break
              }
            }

            if (pricePoint) {
              const isPolish = isPolishAsset(investment)
              const purchaseCurrency = investment.purchaseCurrency || "USD"
              let priceInPurchaseCurrency = pricePoint.price
              if (isPolish && purchaseCurrency === "PLN") {
                priceInPurchaseCurrency = pricePoint.price
              } else if (exchangeRates && purchaseCurrency !== "USD") {
                priceInPurchaseCurrency = convertCurrency(
                  pricePoint.price,
                  "USD",
                  purchaseCurrency as any,
                  exchangeRates
                )
              }
              totalValue += investment.volume * convert(priceInPurchaseCurrency, purchaseCurrency)
            } else {
              const purchaseCurrency = investment.purchaseCurrency || "USD"
              totalValue += investment.volume * convert(investment.purchasePrice, purchaseCurrency)
            }
          } else {
            const purchaseCurrency = investment.purchaseCurrency || "USD"
            totalValue += investment.volume * convert(investment.purchasePrice, purchaseCurrency)
          }
        }
      })

      if (totalValue > 0) {
        dataPoints.push({ date, value: totalValue })
      }
    })

    if (earliestPurchaseDate && dataPoints.length > 0 && earliestPurchaseDate >= startDate) {
      const firstPointDate = dataPoints[0].date
      firstPointDate.setHours(0, 0, 0, 0)
      
      if (earliestPurchaseDate.getTime() < firstPointDate.getTime()) {
        let initialValue = 0
        investments.forEach((investment) => {
          const purchaseDate = new Date(investment.purchaseDate)
          purchaseDate.setHours(0, 0, 0, 0)
          
          if (earliestPurchaseDate.getTime() === purchaseDate.getTime()) {
            const purchaseCurrency = investment.purchaseCurrency || "USD"
            initialValue += investment.volume * convert(investment.purchasePrice, purchaseCurrency)
          }
        })
        
        if (initialValue > 0) {
          dataPoints.unshift({ date: new Date(earliestPurchaseDate), value: initialValue })
        }
      }
    }

    if (currentValueData && dataPoints.length > 0) {
      const lastPoint = dataPoints[dataPoints.length - 1]
      const today = new Date()
      today.setHours(0, 0, 0, 0)
      if (lastPoint.date.getTime() !== today.getTime()) {
        dataPoints.push(currentValueData)
      } else {
        dataPoints[dataPoints.length - 1] = currentValueData
      }
    } else if (currentValueData && dataPoints.length === 0) {
      dataPoints.push(currentValueData)
    }

    return dataPoints.sort((a, b) => a.date.getTime() - b.date.getTime())
  }, [investments, historicalData, currency, exchangeRates, dateRange, convert, currentValueData])

  const maxValue = Math.max(...chartData.map((d) => d.value), 0)
  const minValue = Math.min(...chartData.map((d) => d.value), 0)
  const valueRange = maxValue - minValue || 1

  const isProfit = useMemo(() => {
    if (chartData.length < 2) return true
    const firstValue = chartData[0]?.value || 0
    const lastValue = chartData[chartData.length - 1]?.value || 0
    return lastValue >= firstValue
  }, [chartData])

  const chartWidth = 400
  const chartHeight = 200
  const padding = 40

  const getX = (index: number) => {
    return padding + (index / (chartData.length - 1 || 1)) * (chartWidth - padding * 2)
  }

  const getY = (value: number) => {
    return padding + chartHeight - padding - ((value - minValue) / valueRange) * (chartHeight - padding * 2)
  }

  const createSmoothPath = (points: { date: Date; value: number }[]): string => {
    if (points.length === 0) return ""
    if (points.length === 1) {
      const x = getX(0)
      const y = getY(points[0].value)
      return `M ${x} ${y}`
    }

    let path = `M ${getX(0)} ${getY(points[0].value)}`

    for (let i = 0; i < points.length - 1; i++) {
      const x0 = getX(i)
      const y0 = getY(points[i].value)
      const x1 = getX(i + 1)
      const y1 = getY(points[i + 1].value)

      const cp1x = x0 + (x1 - x0) / 2
      const cp1y = y0
      const cp2x = x0 + (x1 - x0) / 2
      const cp2y = y1

      path += ` C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${x1} ${y1}`
    }

    return path
  }

  const pathData = createSmoothPath(chartData)
  const bottomY = getY(minValue)
  const areaPathData = pathData + ` L ${getX(chartData.length - 1)} ${bottomY} L ${getX(0)} ${bottomY} Z`

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (!svgRef.current || chartData.length === 0) return

    const rect = svgRef.current.getBoundingClientRect()
    const x = e.clientX - rect.left
    const chartAreaWidth = chartWidth - padding * 2
    const relativeX = x - padding

    if (relativeX < 0 || relativeX > chartAreaWidth) {
      setHoveredPoint(null)
      return
    }

    const index = Math.round((relativeX / chartAreaWidth) * (chartData.length - 1))
    const point = chartData[Math.min(index, chartData.length - 1)]

    if (point) {
      setHoveredPoint({
        ...point,
        x: getX(chartData.indexOf(point)),
        y: getY(point.value),
      })
    }
  }

  const handleMouseLeave = () => {
    setHoveredPoint(null)
  }

  const visibleDateLabels = useMemo(() => {
    if (chartData.length === 0) return []
    const step = Math.max(1, Math.floor(chartData.length / 4))
    const labels: { date: Date; x: number }[] = []
    
    for (let i = 0; i < chartData.length; i += step) {
      labels.push({
        date: chartData[i].date,
        x: getX(i),
      })
    }
    
    if (chartData.length > 0 && labels[labels.length - 1]?.date.getTime() !== chartData[chartData.length - 1].date.getTime()) {
      labels.push({
        date: chartData[chartData.length - 1].date,
        x: getX(chartData.length - 1),
      })
    }
    
    return labels
  }, [chartData])

  return (
    <Card className="border-foreground/30">
      <CardContent className="p-4">
        <div className="mb-4">
          <h3 className="font-semibold text-sm mb-3">Portfolio Value Timeline</h3>
          <div className="flex gap-3">
            <div className="flex-1">
              <label htmlFor="period" className="text-xs text-muted-foreground mb-1 block">
                Period
              </label>
              <Select
                id="period"
                value={period}
                onChange={(e) => setPeriod(e.target.value as Period)}
                className="h-8 text-xs"
              >
                <option value="1w">1 Week</option>
                <option value="1m">1 Month</option>
                <option value="3m">3 Months</option>
                <option value="6m">6 Months</option>
                <option value="1y">1 Year</option>
                <option value="all">All Time</option>
              </Select>
            </div>
            <div className="flex-1">
              <label htmlFor="granulation" className="text-xs text-muted-foreground mb-1 block">
                Granulation
              </label>
              <Select
                id="granulation"
                value={granulation}
                onChange={(e) => setGranulation(e.target.value as Granulation)}
                className="h-8 text-xs"
              >
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
              </Select>
            </div>
          </div>
        </div>

        {isLoading ? (
          <div className="text-center py-8 text-sm text-muted-foreground">
            Loading historical data...
          </div>
        ) : chartData.length > 0 ? (
          <div className="space-y-2">
            <div className="flex items-center justify-center relative" style={{ height: `${chartHeight}px` }}>
              <svg
                ref={svgRef}
                width={chartWidth}
                height={chartHeight}
                className="overflow-visible cursor-crosshair"
                viewBox={`0 0 ${chartWidth} ${chartHeight}`}
                onMouseMove={handleMouseMove}
                onMouseLeave={handleMouseLeave}
              >
                <defs>
                  <linearGradient id="areaGradientProfit" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#22c55e" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#22c55e" stopOpacity="0.05" />
                  </linearGradient>
                  <linearGradient id="areaGradientLoss" x1="0%" y1="0%" x2="0%" y2="100%">
                    <stop offset="0%" stopColor="#ef4444" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#ef4444" stopOpacity="0.05" />
                  </linearGradient>
                </defs>
                <path
                  d={areaPathData}
                  fill={isProfit ? "url(#areaGradientProfit)" : "url(#areaGradientLoss)"}
                />
                <path
                  d={pathData}
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                  className={isProfit ? "text-green-500" : "text-red-500"}
                />
                {hoveredPoint && (
                  <>
                    <line
                      x1={hoveredPoint.x}
                      y1={padding}
                      x2={hoveredPoint.x}
                      y2={chartHeight - padding}
                      stroke={isProfit ? "#22c55e" : "#ef4444"}
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.5"
                    />
                    <circle
                      cx={hoveredPoint.x}
                      cy={hoveredPoint.y}
                      r="4"
                      fill={isProfit ? "#22c55e" : "#ef4444"}
                    />
                  </>
                )}
              </svg>
              {hoveredPoint && (
                <div
                  className="absolute bg-popover border border-border rounded-md shadow-lg p-2 text-xs pointer-events-none z-10"
                  style={{
                    left: `${hoveredPoint.x + 10}px`,
                    top: `${hoveredPoint.y - 40}px`,
                    transform: hoveredPoint.x > chartWidth - 150 ? 'translateX(-100%)' : 'none',
                  }}
                >
                  <div className="font-semibold">{formatCurrency(hoveredPoint.value, currency)}</div>
                  <div className="text-muted-foreground">{format(hoveredPoint.date, "MMM d, yyyy")}</div>
                </div>
              )}
            </div>
            <div className="flex items-center justify-between text-xs relative" style={{ height: '20px' }}>
              {visibleDateLabels.map((label, index) => (
                <span
                  key={index}
                  className="text-muted-foreground absolute"
                  style={{ left: `${label.x}px`, transform: 'translateX(-50%)' }}
                >
                  {format(label.date, "MMM d")}
                </span>
              ))}
            </div>
            <div className="flex items-center justify-between text-xs pt-2 border-t border-border">
              <span className="text-muted-foreground">Current Value</span>
              <span className="font-semibold">
                {formatCurrency(chartData[chartData.length - 1]?.value || 0, currency)}
              </span>
            </div>
          </div>
        ) : (
          <div className="text-center py-8 text-sm text-muted-foreground">
            No data available
          </div>
        )}
      </CardContent>
    </Card>
  )
}

