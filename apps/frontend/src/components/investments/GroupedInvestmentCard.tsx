import { useState, useMemo } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, TrendingUp, TrendingDown, ChevronDown, ChevronUp } from "lucide-react"
import type { Investment } from "@/types/investment"
import type { Currency } from "@/hooks/useCurrency"
import { formatCurrency, isPolishAsset } from "@/utils/currencyUtils"
import { convertCurrency } from "@/services/exchangeRates"
import type { ExchangeRates } from "@/services/exchangeRates"
import { format } from "date-fns"

interface GroupedInvestmentCardProps {
  investments: Investment[]
  currency: Currency
  exchangeRates: ExchangeRates | null
  viewMode?: "grid" | "list"
  onEdit: (investment: Investment) => void
  onDelete: (id: string) => void
}

export const GroupedInvestmentCard = ({
  investments,
  currency,
  exchangeRates,
  viewMode = "list",
  onEdit,
  onDelete,
}: GroupedInvestmentCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false)

  const convert = (amount: number, fromCurrency: string = "USD") => {
    if (!exchangeRates) return amount
    return convertCurrency(amount, fromCurrency as any, currency, exchangeRates)
  }

  const firstInvestment = investments[0]
  const isPolish = isPolishAsset(firstInvestment)

  const aggregatedData = useMemo(() => {
    let totalVolume = 0
    let totalCost = 0
    let totalValue = 0
    let totalProfit = 0
    let weightedPurchasePrice = 0
    let weightedCurrentPrice = 0
    let totalCostForPercent = 0
    let totalProfitForPercent = 0

    investments.forEach((investment) => {
      const purchaseCurrency = investment.purchaseCurrency || "PLN"
      const hasCurrentPrice = !!investment.currentPrice && investment.currentPrice > 0
      const profit = investment.profit ?? 0
      const volume = investment.volume || 0
      const purchasePrice = investment.purchasePrice || 0
      
      const costInPurchaseCurrency = volume * purchasePrice
      const valueInPurchaseCurrency = hasCurrentPrice ? costInPurchaseCurrency + profit : costInPurchaseCurrency

      totalVolume += volume
      totalCost += convert(costInPurchaseCurrency, purchaseCurrency)
      if (hasCurrentPrice) {
        totalValue += convert(valueInPurchaseCurrency, purchaseCurrency)
        totalProfit += convert(profit, purchaseCurrency)
        totalCostForPercent += convert(costInPurchaseCurrency, purchaseCurrency)
        totalProfitForPercent += convert(profit, purchaseCurrency)
      } else {
        totalValue += convert(costInPurchaseCurrency, purchaseCurrency)
      }
      
      if (volume > 0) {
        const purchasePriceConverted = convert(purchasePrice, purchaseCurrency)
        const currentPriceConverted = hasCurrentPrice && investment.currentPrice ? convert(investment.currentPrice, purchaseCurrency === "PLN" && isPolish ? "PLN" : "USD") : purchasePriceConverted
        weightedPurchasePrice += purchasePriceConverted * volume
        if (hasCurrentPrice) {
          weightedCurrentPrice += currentPriceConverted * volume
        }
      }
    })

    const avgPurchasePrice = totalVolume > 0 ? weightedPurchasePrice / totalVolume : 0
    const currentPrice = totalVolume > 0 ? weightedCurrentPrice / totalVolume : (investments[0]?.currentPrice ? convert(investments[0].currentPrice, investments[0].purchaseCurrency || "USD") : 0)
    
    const profitPercent = totalCostForPercent > 0 ? (totalProfitForPercent / totalCostForPercent) * 100 : 0

    return {
      totalVolume,
      totalCost,
      totalValue,
      totalProfit,
      profitPercent,
      avgPurchasePrice,
      currentPrice,
    }
  }, [investments, currency, exchangeRates, isPolish, convert])

  const individualPurchases = useMemo(() => {
    return investments.map((investment) => {
      const purchaseCurrency = investment.purchaseCurrency || "PLN"
      
      const hasCurrentPrice = !!investment.currentPrice && investment.currentPrice > 0
      const profit = investment.profit ?? 0
      const profitPercent = investment.profitPercent ?? 0
      const volume = investment.volume || 0
      const purchasePrice = investment.purchasePrice || 0

      const costInPurchaseCurrency = volume * purchasePrice
      const valueInPurchaseCurrency = hasCurrentPrice ? costInPurchaseCurrency + profit : costInPurchaseCurrency

      const costConverted = convert(costInPurchaseCurrency, purchaseCurrency)
      const profitConverted = convert(profit, purchaseCurrency)

      const currentPriceInPurchaseCurrency = hasCurrentPrice && investment.currentPrice ? investment.currentPrice : purchasePrice
      
      return {
        investment,
        purchaseDate: new Date(investment.purchaseDate),
        volume,
        purchasePrice: convert(purchasePrice, purchaseCurrency),
        currentPrice: hasCurrentPrice ? convert(currentPriceInPurchaseCurrency, purchaseCurrency === "PLN" && isPolish ? "PLN" : "USD") : convert(purchasePrice, purchaseCurrency),
        cost: costConverted,
        value: convert(valueInPurchaseCurrency, purchaseCurrency),
        profit: profitConverted,
        profitPercent,
      }
    })
  }, [investments, currency, exchangeRates, isPolish, convert])

  const isProfit = aggregatedData.totalProfit >= 0

  if (viewMode === "list") {
    return (
      <Card className="border-foreground/30">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="min-w-0 flex-shrink-0">
                <h3 className="font-semibold text-sm">
                  {firstInvestment.symbol}
                  {investments.length > 1 && (
                    <span className="text-xs text-muted-foreground ml-1">
                      ({investments.length})
                    </span>
                  )}
                </h3>
                <p className="text-xs text-muted-foreground truncate">{firstInvestment.name}</p>
              </div>
              <span className="inline-block px-2 py-0.5 text-[10px] bg-accent/50 rounded border border-foreground/20 text-muted-foreground flex-shrink-0">
                {firstInvestment.type}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 flex-wrap">
              <div className="text-right hidden md:block w-24">
                <div className="text-xs text-muted-foreground">Volume</div>
                <div className="text-sm font-medium">
                  {aggregatedData.totalVolume > 0 
                    ? aggregatedData.totalVolume.toLocaleString("pl-PL", { maximumFractionDigits: 8, minimumFractionDigits: 0 })
                    : "0"}
                </div>
              </div>
              <div className="text-right w-24 sm:w-28 md:w-36">
                <div className="text-xs text-muted-foreground">Current Value</div>
                <div className="text-sm font-semibold">{formatCurrency(aggregatedData.totalValue, currency)}</div>
              </div>
              <div className="text-right flex items-center gap-2 min-w-0">
                <div className="w-28 sm:w-36 md:w-44 min-w-0">
                  <div className="text-xs text-muted-foreground">Profit/Loss</div>
                  <div className={`text-sm font-semibold flex items-center justify-end gap-1 ${isProfit ? "text-green-500" : "text-red-500"}`}>
                    {isProfit ? (
                      <TrendingUp className="h-3 w-3 flex-shrink-0" />
                    ) : (
                      <TrendingDown className="h-3 w-3 flex-shrink-0" />
                    )}
                    <span className="truncate">
                      {formatCurrency(Math.abs(aggregatedData.totalProfit), currency)} ({aggregatedData.profitPercent >= 0 ? "+" : ""}
                      {aggregatedData.profitPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => setIsExpanded(!isExpanded)}
                  className="h-7 w-7 flex-shrink-0"
                >
                  {isExpanded ? (
                    <ChevronUp className="h-4 w-4" />
                  ) : (
                    <ChevronDown className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>
          </div>

          {isExpanded && (
            <div className="mt-4 pt-4 border-t border-border space-y-3">
              <div className="overflow-x-auto -mx-3 px-3">
                <div className="min-w-[700px] space-y-2">
                  <div className="grid grid-cols-[90px_96px_112px_144px_112px_112px_176px_56px] gap-2 text-xs text-muted-foreground pb-2 border-b border-border items-center">
                    <div>Date</div>
                    <div className="text-right">Volume</div>
                    <div className="text-right">Purchase</div>
                    <div className="text-right">Current</div>
                    <div className="text-right hidden md:block">Cost</div>
                    <div className="text-right hidden md:block">Value</div>
                    <div className="text-right">Profit/Loss</div>
                    <div className="text-right"></div>
                  </div>
                  {individualPurchases.map((purchase) => (
                    <div
                      key={purchase.investment.id}
                      className="grid grid-cols-[90px_96px_112px_144px_112px_112px_176px_56px] gap-2 items-center text-xs"
                    >
                      <div className="text-[10px]">{format(purchase.purchaseDate, "MMM d, yyyy")}</div>
                      <div className="text-right text-[10px]">{purchase.volume > 0 ? purchase.volume.toLocaleString("pl-PL", { maximumFractionDigits: 8 }) : "0"}</div>
                      <div className="text-right text-[10px]">{formatCurrency(purchase.purchasePrice, currency)}</div>
                      <div className="text-right text-[10px]">{formatCurrency(purchase.currentPrice, currency)}</div>
                      <div className="text-right hidden md:block text-[10px]">{formatCurrency(purchase.cost, currency)}</div>
                      <div className="text-right hidden md:block text-[10px]">{formatCurrency(purchase.value, currency)}</div>
                      <div className={`text-right ${purchase.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                        <div className="font-semibold text-[10px]">
                          {formatCurrency(Math.abs(purchase.profit), currency)}
                        </div>
                        <div className="text-[9px]">
                          ({purchase.profitPercent >= 0 ? "+" : ""}{purchase.profitPercent.toFixed(2)}%)
                        </div>
                      </div>
                      <div className="flex items-center justify-end gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onEdit(purchase.investment)}
                          className="h-6 w-6"
                        >
                          <Edit2 className="h-3 w-3" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => onDelete(purchase.investment.id)}
                          className="h-6 w-6 text-destructive hover:text-destructive"
                        >
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-foreground/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">
              {firstInvestment.symbol}
              {investments.length > 1 && (
                <span className="text-xs text-muted-foreground ml-1">
                  ({investments.length})
                </span>
              )}
            </h3>
            <p className="text-xs text-muted-foreground">{firstInvestment.name}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-accent/50 rounded border border-foreground/20 text-muted-foreground">
              {firstInvestment.type}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsExpanded(!isExpanded)}
            className="h-7 w-7 flex-shrink-0"
          >
            {isExpanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </Button>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Volume:</span>
            <span>
              {aggregatedData.totalVolume > 0 
                ? aggregatedData.totalVolume.toLocaleString(undefined, { maximumFractionDigits: 8, minimumFractionDigits: 0 })
                : "0"}
            </span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Avg Purchase Price:</span>
            <span>{formatCurrency(aggregatedData.avgPurchasePrice, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Price:</span>
            <span>{formatCurrency(aggregatedData.currentPrice, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Cost:</span>
            <span>{formatCurrency(aggregatedData.totalCost, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Value:</span>
            <span className="font-semibold">{formatCurrency(aggregatedData.totalValue, currency)}</span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-muted-foreground">Total Profit/Loss:</span>
            <div className="flex items-center gap-1">
              {isProfit ? (
                <TrendingUp className="h-3 w-3 text-green-500" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-500" />
              )}
              <span className={isProfit ? "text-green-500" : "text-red-500"}>
                {formatCurrency(Math.abs(aggregatedData.totalProfit), currency)} ({aggregatedData.profitPercent >= 0 ? "+" : ""}
                {aggregatedData.profitPercent.toFixed(2)}%)
              </span>
            </div>
          </div>
        </div>

        {isExpanded && (
          <div className="mt-4 pt-4 border-t border-border space-y-3">
            <div className="text-xs font-semibold text-muted-foreground mb-2">Individual Purchases:</div>
            {individualPurchases.map((purchase) => (
              <div
                key={purchase.investment.id}
                className="text-xs space-y-1 p-2 bg-accent/20 rounded border border-border"
              >
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Date:</span>
                  <span>{format(purchase.purchaseDate, "MMM d, yyyy")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Volume:</span>
                  <span>{purchase.volume.toLocaleString("pl-PL")}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Purchase Price:</span>
                  <span>{formatCurrency(purchase.purchasePrice, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Current Price:</span>
                  <span>{formatCurrency(purchase.currentPrice, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Cost:</span>
                  <span>{formatCurrency(purchase.cost, currency)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Value:</span>
                  <span>{formatCurrency(purchase.value, currency)}</span>
                </div>
                <div className="flex justify-between items-center pt-1 border-t border-border">
                  <span className="text-muted-foreground">Profit/Loss:</span>
                  <div className="flex items-center gap-1">
                    {purchase.profit >= 0 ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    )}
                    <span className={`font-semibold ${purchase.profit >= 0 ? "text-green-500" : "text-red-500"}`}>
                      {formatCurrency(Math.abs(purchase.profit), currency)} ({purchase.profitPercent >= 0 ? "+" : ""}
                      {purchase.profitPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="flex justify-end gap-1 pt-1">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onEdit(purchase.investment)}
                    className="h-6 w-6"
                  >
                    <Edit2 className="h-3 w-3" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => onDelete(purchase.investment.id)}
                    className="h-6 w-6 text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  )
}

