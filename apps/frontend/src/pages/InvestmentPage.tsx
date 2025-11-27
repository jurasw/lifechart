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
import { fetchExchangeRates } from "@/services/exchangeRates"
import { convertCurrency } from "@/services/exchangeRates"
import { investmentsApi } from "@/services/investmentsApi"
import type { Investment } from "@/types/investment"
import type { ExchangeRates } from "@/services/exchangeRates"
import { isPolishAsset } from "@/utils/currencyUtils"

export const InvestmentPage = () => {
  const {
    investments,
    setInvestments,
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
  const [isLoading, setIsLoading] = useState(true)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [investmentToDelete, setInvestmentToDelete] = useState<string | null>(null)
  const [exchangeRates, setExchangeRates] = useState<ExchangeRates | null>(null)
  const [viewMode, setViewMode] = useState<"grid" | "list">("list")
  const [sortBy, setSortBy] = useState<"date" | "value">("date")
  const [isSortPopoverOpen, setIsSortPopoverOpen] = useState(false)


  useEffect(() => {
    const loadInvestments = async () => {
      setIsLoading(true)
      try {
        const data = await investmentsApi.getAll()
        setInvestments(data || [])
      } catch (error) {
        setInvestments([])
      } finally {
        setIsLoading(false)
      }
    }
    loadInvestments()
  }, [setInvestments])

  const editingInvestment =
    investments.find((inv) => inv.id === editingInvestmentId) || null

  const refreshPrices = useCallback(async () => {
    if (investments.length === 0) return

    setIsRefreshing(true)
    try {
      const data = await investmentsApi.getAll()
      setInvestments(data)
    } catch (error: unknown) {
    } finally {
      setIsRefreshing(false)
    }
  }, [investments.length, setInvestments])

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
    const loadExchangeRates = async () => {
      const rates = await fetchExchangeRates()
      setExchangeRates(rates)
    }
    if (currency) {
      loadExchangeRates()
    }
  }, [currency])


  const handleSubmit = async (investmentData: Omit<Investment, "id">) => {
    try {
      if (editingInvestmentId) {
        await investmentsApi.update(editingInvestmentId, investmentData)
        handleUpdate(editingInvestmentId, investmentData)
        setEditingInvestmentId(null)
      } else {
        const newInvestment = await investmentsApi.create(investmentData)
        handleAdd(newInvestment)
      }
      const data = await investmentsApi.getAll()
      setInvestments(data)
    } catch (error) {
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

  const handleConfirmDelete = async () => {
    if (investmentToDelete) {
      try {
        await investmentsApi.delete(investmentToDelete)
        handleDelete(investmentToDelete)
        const data = await investmentsApi.getAll()
        setInvestments(data)
      } catch (error) {
      }
      setInvestmentToDelete(null)
    }
    setShowDeleteConfirm(false)
  }

  return (
    <div className="h-full p-2 sm:p-4 md:p-6 lg:p-8 overflow-y-auto pt-16 lg:pt-3">
      <div className="max-w-7xl mx-auto">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6">
          <h1 className="text-xl sm:text-2xl font-bold">Investment Portfolio</h1>
          <div className="flex flex-wrap items-center gap-2 sm:gap-3">
            <div className="flex items-center gap-2">
              <label htmlFor="currency" className="text-xs sm:text-sm text-muted-foreground whitespace-nowrap">
                Currency:
              </label>
              <Select
                id="currency"
                value={currency}
                onChange={(e) => setCurrency(e.target.value as "USD" | "EUR" | "PLN")}
                className="w-20 h-9 text-xs sm:text-sm"
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
                <Button variant="outline" size="sm" className="h-9 text-xs sm:text-sm">
                  <ArrowUpDown className="h-4 w-4 sm:mr-2" />
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

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="flex flex-col items-center gap-4">
              <RefreshCw className="h-8 w-8 animate-spin text-muted-foreground" />
              <p className="text-muted-foreground">Loading investments...</p>
            </div>
          </div>
        ) : investments.length === 0 ? (
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
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-4 lg:gap-6">
            <div className="xl:col-span-2 space-y-4">
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
                        const isPolish = isPolishAsset(inv)
                        const purchaseCurrency = inv.purchaseCurrency || "USD"
                        let currentPriceInPurchaseCurrency = inv.purchasePrice
                        if (inv.currentPrice) {
                          if (isPolish && purchaseCurrency === "PLN") {
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

            <div className="xl:col-span-1 space-y-4">
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
