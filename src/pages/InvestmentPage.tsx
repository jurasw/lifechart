import { useState, useEffect, useRef, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Select } from "@/components/ui/select"
import { Popover } from "@/components/ui/popover"
import { Plus, RefreshCw, Grid3x3, List, ArrowUpDown } from "lucide-react"
import { useInvestments } from "@/hooks/useInvestments"
import { useCurrency } from "@/hooks/useCurrency"
import { AddInvestmentDialog } from "@/components/investments/AddInvestmentDialog"
import { InvestmentCard } from "@/components/investments/InvestmentCard"
import { GroupedInvestmentCard } from "@/components/investments/GroupedInvestmentCard"
import { InvestmentChart } from "@/components/investments/InvestmentChart"
import { InvestmentTimelineChart } from "@/components/investments/InvestmentTimelineChart"
import { ConfirmDialog } from "@/components/ConfirmDialog"
import { fetchMultiplePrices } from "@/services/priceApi"
import { fetchExchangeRates } from "@/services/exchangeRates"
import { convertCurrency } from "@/services/exchangeRates"
import type { Investment } from "@/types/investment"
import type { ExchangeRates } from "@/services/exchangeRates"

export const InvestmentPage = () => {
  const {
    investments,
    editingInvestmentId,
    setEditingInvestmentId,
    handleAdd,
    handleUpdate,
    handleDelete,
    handleUpdatePrices,
  } = useInvestments()

  const { currency, setCurrency } = useCurrency()

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [sortBy, setSortBy] = useState<"date" | "value">("date")
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false)

  const abortControllerRef = useRef<AbortController | null>(null)
  const refreshTimeoutRef = useRef<number | null>(null)

  const editingInvestment =
    investments.find((inv) => inv.id === editingInvestmentId) || null

  const refreshPrices = useCallback(async () => {
    if (investments.length === 0) return

    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    abortControllerRef.current = new AbortController()
    const signal = abortControllerRef.current.signal

    setIsRefreshing(true)
    try {
      const symbols = investments.map((inv) => ({
        symbol: inv.symbol,
        type: inv.type,
      }))

      const priceMap = await fetchMultiplePrices(symbols, signal)

      if (signal.aborted) {
        return
      }

      const updates = investments
        .map((inv) => {
          const priceData = priceMap.get(inv.symbol)
          if (priceData) {
            return {
              id: inv.id,
              currentPrice: priceData.price,
              lastUpdated: priceData.timestamp,
            }
          }
          return null
        })
        .filter((update): update is { id: string; currentPrice: number; lastUpdated: number } => update !== null)

      handleUpdatePrices(updates)
    } catch (error: unknown) {
      if (error instanceof Error && error.message !== "Request aborted") {
        console.error("Error refreshing prices:", error)
      }
    } finally {
      if (!signal.aborted) {
        setIsRefreshing(false)
      }
    }
  }, [investments, handleUpdatePrices])

  useEffect(() => {
    const loadExchangeRates = async () => {
      const rates = await fetchExchangeRates()
      setExchangeRates(rates)
    }
    loadExchangeRates()
  }, [])

  const investmentsRef = useRef(investments)
  investmentsRef.current = investments

  useEffect(() => {
    if (refreshTimeoutRef.current) {
      clearTimeout(refreshTimeoutRef.current)
    }

    const needsRefresh = investmentsRef.current.some(
      (inv) => !inv.lastUpdated || Date.now() - inv.lastUpdated > 5 * 60 * 1000
    )

    if (needsRefresh && investmentsRef.current.length > 0) {
      refreshTimeoutRef.current = window.setTimeout(() => {
        refreshPrices()
      }, 1000)
    }

    return () => {
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [investments.length, refreshPrices])

  useEffect(() => {
    const loadExchangeRates = async () => {
      const rates = await fetchExchangeRates()
      setExchangeRates(rates)
    }
    if (currency) {
      loadExchangeRates()
    }
  }, [currency])

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort()
      }
      if (refreshTimeoutRef.current) {
        clearTimeout(refreshTimeoutRef.current)
      }
    }
  }, [])

  const handleSubmit = (investmentData: Omit<Investment, "id">) => {
    if (editingInvestmentId) {
      handleUpdate(editingInvestmentId, investmentData)
      setEditingInvestmentId(null)
    } else {
      handleAdd(investmentData)
    }
  }

  const handleEdit = (investment: Investment) => {
    setEditingInvestmentId(investment.id)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (id: string) => {
    setInvestmentToDelete(id)
    setShowDeleteConfirm(true)
  }

  const handleConfirmDelete = () => {
    if (investmentToDelete) {
      handleDelete(investmentToDelete)
      setInvestmentToDelete(null)
    }
    setShowDeleteConfirm(false)
  }

  return (
    <div className="h-full p-3 sm:p-4 md:p-6 lg:p-8 overflow-y-auto">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Investment Portfolio</h1>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="currency" className="text-sm text-muted-foreground">
                Currency:
              </label>
              <Select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "USD" | "EUR" | "PLN")}
                className="w-20 h-9"
              >
                <option value="USD">USD</option>
                <option value="EUR">EUR</option>
                <option value="PLN">PLN</option>
              </Select>
            </div>
            <div className="flex items-center gap-1 border border-border rounded-md p-1">
              <Button
                variant={viewMode === "grid" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("grid")}
                className="h-7 w-7 p-0"
              >
                <Grid3x3 className="h-4 w-4" />
              </Button>
              <Button
                variant={viewMode === "list" ? "default" : "ghost"}
                size="sm"
                onClick={() => setViewMode("list")}
                className="h-7 w-7 p-0"
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
            <Popover
              open={isSortPopoverOpen}
              onOpenChange={setIsSortPopoverOpen}
              trigger={
                <Button variant="outline" size="sm" className="h-9">
                  <ArrowUpDown className="h-4 w-4 mr-2" />
                  <span className="hidden sm:inline">Sort</span>
                </Button>
              }
            >
              <div className="p-2 space-y-1 min-w-[160px]">
                <button
                  onClick={() => {
                    setSortBy("date")
                    setIsSortPopoverOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent ${
                    sortBy === "date" ? "bg-accent" : ""
                  }`}
                >
                  Sort by Date
                </button>
                <button
                  onClick={() => {
                    setSortBy("value")
                    setIsSortPopoverOpen(false)
                  }}
                  className={`w-full text-left px-3 py-2 text-sm rounded-md hover:bg-accent ${
                    sortBy === "value" ? "bg-accent" : ""
                  }`}
                >
                  Sort by Value
                </button>
              </div>
            </Popover>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={refreshPrices}
                disabled={isRefreshing || investments.length === 0}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${isRefreshing ? "animate-spin" : ""}`} />
                <span className="hidden sm:inline">Refresh Prices</span>
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  setEditingInvestmentId(null)
                  setIsDialogOpen(true)
                }}
              >
                <Plus className="h-4 w-4 mr-2" />
                <span className="hidden sm:inline">Add Investment</span>
              </Button>
            </div>
          </div>
        </div>

        {investments.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground mb-4">No investments yet</p>
            <Button
              onClick={() => {
                setEditingInvestmentId(null)
                setIsDialogOpen(true)
              }}
            >
              <Plus className="h-4 w-4 mr-2" />
              Add Your First Investment
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-4">
              {(() => {
                const grouped = investments.reduce((acc, inv) => {
                  const key = inv.symbol.toUpperCase()
                  if (!acc[key]) {
                    acc[key] = []
                  }
                  acc[key].push(inv)
                  return acc
                }, {} as Record<string, typeof investments>)

                let groupedArray = Object.values(grouped)

                const convert = (amount: number, fromCurrency: "USD" | "EUR" | "PLN" = "USD") => {
                  if (!exchangeRates) return amount
                  return convertCurrency(amount, fromCurrency, currency, exchangeRates)
                }

                if (sortBy === "date") {
                  groupedArray = groupedArray.sort((a, b) => {
                    const aDate = Math.min(...a.map(inv => inv.purchaseDate))
                    const bDate = Math.min(...b.map(inv => inv.purchaseDate))
                    return bDate - aDate
                  })
                } else if (sortBy === "value") {
                  groupedArray = groupedArray.sort((a, b) => {
                    const getTotalValue = (group: typeof investments) => {
                      return group.reduce((sum, inv) => {
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
                              purchaseCurrency as "USD" | "EUR" | "PLN",
                              exchangeRates
                            )
                          } else {
                            currentPriceInPurchaseCurrency = inv.currentPrice
                          }
                        }
                        return sum + inv.volume * convert(currentPriceInPurchaseCurrency, purchaseCurrency as "USD" | "EUR" | "PLN")
                      }, 0)
                    }
                    return getTotalValue(b) - getTotalValue(a)
                  })
                }

                return viewMode === "grid" ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {groupedArray.map((group) =>
                      group.length === 1 ? (
                        <InvestmentCard
                          key={group[0].id}
                          investment={group[0]}
                          currency={currency}
                          exchangeRates={exchangeRates}
                          viewMode="grid"
                          onEdit={() => handleEdit(group[0])}
                          onDelete={() => handleDeleteClick(group[0].id)}
                        />
                      ) : (
                        <GroupedInvestmentCard
                          key={group[0].symbol}
                          investments={group}
                          currency={currency}
                          exchangeRates={exchangeRates}
                          viewMode="grid"
                          onEdit={handleEdit}
                          onDelete={handleDeleteClick}
                        />
                      )
                    )}
                  </div>
                ) : (
                  <div className="space-y-2">
                    {groupedArray.map((group) =>
                      group.length === 1 ? (
                        <InvestmentCard
                          key={group[0].id}
                          investment={group[0]}
                          currency={currency}
                          exchangeRates={exchangeRates}
                          viewMode="list"
                          onEdit={() => handleEdit(group[0])}
                          onDelete={() => handleDeleteClick(group[0].id)}
                        />
                      ) : (
                        <GroupedInvestmentCard
                          key={group[0].symbol}
                          investments={group}
                          currency={currency}
                          exchangeRates={exchangeRates}
                          viewMode="list"
                          onEdit={handleEdit}
                          onDelete={handleDeleteClick}
                        />
                      )
                    )}
                  </div>
                )
              })()}
            </div>

            <div className="lg:col-span-1 space-y-4">
              <InvestmentTimelineChart
                investments={investments}
                currency={currency}
                exchangeRates={exchangeRates}
              />
              <InvestmentChart investments={investments} currency={currency} exchangeRates={exchangeRates} />
            </div>
          </div>
        )}
      </div>

      <AddInvestmentDialog
        open={isDialogOpen}
        onOpenChange={(open) => {
          setIsDialogOpen(open)
          if (!open) {
            setEditingInvestmentId(null)
          }
        }}
        onSubmit={handleSubmit}
        editingInvestment={editingInvestment}
      />

      <ConfirmDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        title="Delete Investment"
        description="Are you sure you want to delete this investment? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirmDelete}
      />
    </div>
  )
}
