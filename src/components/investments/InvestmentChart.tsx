import { useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import type { Investment } from "@/types/investment"
import type { Currency } from "@/hooks/useCurrency"
import { formatCurrency } from "@/utils/currencyUtils"
import { convertCurrency } from "@/services/exchangeRates"
import type { ExchangeRates } from "@/services/exchangeRates"

interface InvestmentChartProps {
  investments: Investment[]
  currency: Currency
  exchangeRates: ExchangeRates | null
}

export const InvestmentChart = ({ investments, currency, exchangeRates }: InvestmentChartProps) => {
  const chartData = useMemo(() => {
    const convert = (amount: number, fromCurrency: string = "USD") => {
      if (!exchangeRates) return amount
      return convertCurrency(amount, fromCurrency as any, currency, exchangeRates)
    }

    const totalCost = investments.reduce((sum, inv) => {
      const purchaseCurrency = inv.purchaseCurrency || "USD"
      return sum + inv.volume * convert(inv.purchasePrice, purchaseCurrency)
    }, 0)

    const totalValue = investments.reduce((sum, inv) => {
      const isPolishStock = inv.symbol.includes(".WA") || inv.symbol.includes(".PL")
      const purchaseCurrency = inv.purchaseCurrency || "USD"
      let currentPriceInPurchaseCurrency = inv.purchasePrice
      if (inv.currentPrice) {
        if (isPolishStock && purchaseCurrency === "PLN") {
          currentPriceInPurchaseCurrency = inv.currentPrice
        } else if (exchangeRates && purchaseCurrency !== "USD") {
          currentPriceInPurchaseCurrency = convertCurrency(
            inv.currentPrice,
            "USD",
            purchaseCurrency as any,
            exchangeRates
          )
        } else {
          currentPriceInPurchaseCurrency = inv.currentPrice
        }
      }
      return sum + inv.volume * convert(currentPriceInPurchaseCurrency, purchaseCurrency)
    }, 0)

    const profit = totalValue - totalCost
    const profitPercent = totalCost > 0 ? (profit / totalCost) * 100 : 0

    const byType = investments.reduce(
      (acc, inv) => {
        const isPolishStock = inv.symbol.includes(".WA") || inv.symbol.includes(".PL")
        const purchaseCurrency = inv.purchaseCurrency || "USD"
        let currentPriceInPurchaseCurrency = inv.purchasePrice
        if (inv.currentPrice) {
          if (isPolishStock && purchaseCurrency === "PLN") {
            currentPriceInPurchaseCurrency = inv.currentPrice
          } else if (exchangeRates && purchaseCurrency !== "USD") {
            currentPriceInPurchaseCurrency = convertCurrency(
              inv.currentPrice,
              "USD",
              purchaseCurrency as any,
              exchangeRates
            )
          } else {
            currentPriceInPurchaseCurrency = inv.currentPrice
          }
        }
        const value = inv.volume * convert(currentPriceInPurchaseCurrency, purchaseCurrency)
        if (!acc[inv.type]) {
          acc[inv.type] = 0
        }
        acc[inv.type] += value
        return acc
      },
      {} as Record<string, number>
    )

    return {
      totalCost,
      totalValue,
      profit,
      profitPercent,
      byType,
    }
  }, [investments, currency, exchangeRates])

  const maxValue = Math.max(chartData.totalCost, chartData.totalValue)

  return (
    <Card className="border-foreground/30">
      <CardContent className="p-4">
        <h3 className="font-semibold text-sm mb-4">Portfolio Overview</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Total Cost</span>
              <span>{formatCurrency(chartData.totalCost, currency)}</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className="h-full bg-foreground/30 rounded-full"
                style={{ width: `${(chartData.totalCost / maxValue) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-muted-foreground">Current Value</span>
              <span className="font-semibold">{formatCurrency(chartData.totalValue, currency)}</span>
            </div>
            <div className="w-full bg-muted h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full ${
                  chartData.profit >= 0 ? "bg-green-500" : "bg-red-500"
                }`}
                style={{ width: `${(chartData.totalValue / maxValue) * 100}%` }}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-border">
            <div className="flex justify-between items-center">
              <span className="text-xs text-muted-foreground">Total Profit/Loss</span>
              <span
                className={`text-sm font-semibold ${
                  chartData.profit >= 0 ? "text-green-500" : "text-red-500"
                }`}
              >
                {chartData.profit >= 0 ? "+" : ""}
                {formatCurrency(chartData.profit, currency)} ({chartData.profitPercent >= 0 ? "+" : ""}
                {chartData.profitPercent.toFixed(2)}%)
              </span>
            </div>
          </div>

          <div className="pt-2 border-t border-border space-y-2">
            <div className="text-xs text-muted-foreground mb-2">By Type</div>
            {Object.entries(chartData.byType).map(([type, value]) => (
              <div key={type} className="flex justify-between text-xs">
                <span className="capitalize">{type}</span>
                <span>{formatCurrency(value, currency)}</span>
              </div>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

