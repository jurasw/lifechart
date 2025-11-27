import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Edit2, Trash2, TrendingUp, TrendingDown } from "lucide-react"
import type { Investment } from "@/types/investment"
import type { Currency } from "@/hooks/useCurrency"
import { formatCurrency, isPolishAsset } from "@/utils/currencyUtils"
import { convertCurrency } from "@/services/exchangeRates"
import type { ExchangeRates } from "@/services/exchangeRates"

interface InvestmentCardProps {
  investment: Investment
  currency: Currency
  exchangeRates: ExchangeRates | null
  viewMode?: "grid" | "list"
  onEdit: () => void
  onDelete: () => void
}

export const InvestmentCard = ({ investment, currency, exchangeRates, viewMode = "grid", onEdit, onDelete }: InvestmentCardProps) => {
  const convert = (amount: number, fromCurrency: string = "USD") => {
    if (!exchangeRates) return amount
    return convertCurrency(amount, fromCurrency as any, currency, exchangeRates)
  }

  const purchaseCurrency = investment.purchaseCurrency || "PLN"
  const hasCurrentPrice = !!investment.currentPrice && investment.currentPrice > 0
  const purchasePrice = investment.purchasePrice || 0
  const volume = investment.volume || 0
  
  const profit = investment.profit ?? 0
  const profitPercent = investment.profitPercent ?? 0
  
  const totalCostInPurchaseCurrency = volume * purchasePrice
  const totalValueInPurchaseCurrency = hasCurrentPrice && investment.currentPrice ? totalCostInPurchaseCurrency + profit : totalCostInPurchaseCurrency
  
  const purchasePriceConverted = convert(purchasePrice, purchaseCurrency)
  const currentPriceConverted = hasCurrentPrice && investment.currentPrice ? convert(investment.currentPrice, purchaseCurrency === "PLN" && isPolishAsset(investment) ? "PLN" : "USD") : purchasePriceConverted
  const totalValue = convert(totalValueInPurchaseCurrency, purchaseCurrency)
  const totalCost = convert(totalCostInPurchaseCurrency, purchaseCurrency)
  const profitConverted = convert(profit, purchaseCurrency)

  const isProfit = profitConverted >= 0

  if (viewMode === "list") {
    return (
      <Card className="border-foreground/30">
        <CardContent className="p-3">
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 sm:gap-3 min-w-0 flex-1">
              <div className="min-w-0 flex-shrink-0">
                <h3 className="font-semibold text-sm">{investment.symbol}</h3>
                <p className="text-xs text-muted-foreground truncate">{investment.name}</p>
              </div>
              <span className="inline-block px-2 py-0.5 text-[10px] bg-accent/50 rounded border border-foreground/20 text-muted-foreground flex-shrink-0">
                {investment.type}
              </span>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 flex-shrink-0 flex-wrap">
              <div className="text-right hidden md:block w-24">
                <div className="text-xs text-muted-foreground">Volume</div>
                <div className="text-sm font-medium">{investment.volume.toLocaleString("pl-PL", { maximumFractionDigits: 8, minimumFractionDigits: 0 })}</div>
              </div>
              <div className="text-right w-24 sm:w-28 md:w-36">
                <div className="text-xs text-muted-foreground">Current Value</div>
                <div className="text-sm font-semibold">{formatCurrency(totalValue, currency)}</div>
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
                      {formatCurrency(Math.abs(profitConverted), currency)} ({profitPercent >= 0 ? "+" : ""}
                      {profitPercent.toFixed(2)}%)
                    </span>
                  </div>
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onEdit}
                    className="h-7 w-7 flex-shrink-0"
                  >
                    <Edit2 className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={onDelete}
                    className="h-7 w-7 text-destructive hover:text-destructive flex-shrink-0"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-foreground/30">
      <CardContent className="p-4">
        <div className="flex items-start justify-between mb-3">
          <div>
            <h3 className="font-semibold text-sm">{investment.symbol}</h3>
            <p className="text-xs text-muted-foreground">{investment.name}</p>
            <span className="inline-block mt-1 px-2 py-0.5 text-[10px] bg-accent/50 rounded border border-foreground/20 text-muted-foreground">
              {investment.type}
            </span>
          </div>
          <div className="flex gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-7 w-7"
            >
              <Edit2 className="h-3.5 w-3.5" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-7 w-7 text-destructive hover:text-destructive"
            >
              <Trash2 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </div>

        <div className="space-y-2 text-xs">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Volume:</span>
            <span>{investment.volume.toLocaleString("pl-PL")}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Purchase Price:</span>
            <span>{formatCurrency(purchasePriceConverted, currency)}</span>
          </div>
          {investment.currentPrice && (
            <div className="flex justify-between">
              <span className="text-muted-foreground">Current Price:</span>
              <span>{formatCurrency(currentPriceConverted, currency)}</span>
            </div>
          )}
          <div className="flex justify-between">
            <span className="text-muted-foreground">Total Cost:</span>
            <span>{formatCurrency(totalCost, currency)}</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Current Value:</span>
            <span className="font-semibold">
              {hasCurrentPrice ? formatCurrency(totalValue, currency) : "N/A"}
            </span>
          </div>
          <div className="flex justify-between items-center pt-2 border-t border-border">
            <span className="text-muted-foreground">Profit/Loss:</span>
            {hasCurrentPrice ? (
              <div className="flex items-center gap-1">
                {isProfit ? (
                  <TrendingUp className="h-3 w-3 text-green-500" />
                ) : (
                  <TrendingDown className="h-3 w-3 text-red-500" />
                )}
                <span className={isProfit ? "text-green-500" : "text-red-500"}>
                  {formatCurrency(Math.abs(profitConverted), currency)} ({profitPercent >= 0 ? "+" : ""}
                  {profitPercent.toFixed(2)}%)
                </span>
              </div>
            ) : (
              <span className="text-muted-foreground text-xs">N/A</span>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

