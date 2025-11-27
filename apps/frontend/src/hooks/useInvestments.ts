import { useState, useCallback, useRef } from "react"
import type { Investment } from "@/types/investment"

export const useInvestments = () => {
  const [investments, setInvestments] = useState<Investment[]>([])
  const [editingInvestmentId, setEditingInvestmentId] = useState<string | null>(null)
  const investmentsRef = useRef(investments)
  investmentsRef.current = investments

  const handleAdd = (investment: Omit<Investment, "id">) => {
    const newInvestment: Investment = {
      ...investment,
      id: Date.now().toString(),
    }
    setInvestments([...investmentsRef.current, newInvestment])
  }

  const handleUpdate = (id: string, investment: Partial<Investment>) => {
    setInvestments(
      investmentsRef.current.map((inv) =>
        inv.id === id ? { ...inv, ...investment } : inv
      )
    )
  }

  const handleDelete = (id: string) => {
    setInvestments(investmentsRef.current.filter((inv) => inv.id !== id))
  }

  const handleUpdatePrices = useCallback((updates: { id: string; currentPrice: number; lastUpdated: number }[]) => {
    setInvestments(
      investmentsRef.current.map((inv) => {
        const update = updates.find((u) => u.id === inv.id)
        return update
          ? { ...inv, currentPrice: update.currentPrice, lastUpdated: update.lastUpdated }
          : inv
      })
    )
  }, [])

  return {
    investments,
    setInvestments,
    editingInvestmentId,
    setEditingInvestmentId,
    handleAdd,
    handleUpdate,
    handleDelete,
    handleUpdatePrices,
  }
}

