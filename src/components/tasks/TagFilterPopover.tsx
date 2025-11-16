import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Popover } from "@/components/ui/popover"
import { Filter, X } from "lucide-react"
import type { Task } from "@/types/task"

interface TagFilterPopoverProps {
  tasks: Task[]
  selectedTags: string[]
  selectedPeriod: "daily" | "monthly" | "yearly" | null
  onTagToggle: (tag: string) => void
  onPeriodChange: (period: "daily" | "monthly" | "yearly" | null) => void
  onClearFilters: () => void
}

export const TagFilterPopover = ({
  tasks,
  selectedTags,
  selectedPeriod,
  onTagToggle,
  onPeriodChange,
  onClearFilters,
}: TagFilterPopoverProps) => {
  const [isOpen, setIsOpen] = useState(false)

  const allTags = tasks.reduce((acc, task) => {
    if (task.tags) {
      task.tags.forEach((tag) => acc.add(tag))
    }
    return acc
  }, new Set<string>())

  if (allTags.size === 0) {
    return null
  }

  return (
    <Popover
      open={isOpen}
      onOpenChange={setIsOpen}
      trigger={
        <Button variant="outline" className="rounded-md" size="sm">
          <Filter className="h-4 w-4 mr-2" />
          Filters
          {(selectedTags.length > 0 || selectedPeriod) && (
            <span className="ml-2 px-1.5 py-0.5 text-xs bg-foreground text-background rounded">
              {selectedTags.length + (selectedPeriod ? 1 : 0)}
            </span>
          )}
        </Button>
      }
    >
      <div className="space-y-3">
        <div className="flex items-center justify-between gap-2">
          <h3 className="font-semibold text-xs sm:text-sm">Filters</h3>
          {(selectedTags.length > 0 || selectedPeriod) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onClearFilters()
                setIsOpen(false)
              }}
              className="h-6 text-xs text-muted-foreground hover:text-foreground"
            >
              Clear
            </Button>
          )}
        </div>
        <div className="space-y-2">
          <div>
            <h4 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5">Period</h4>
            <div className="flex gap-1.5">
              {(["daily", "monthly", "yearly"] as const).map((period) => {
                const isSelected = selectedPeriod === period
                return (
                  <button
                    key={period}
                    type="button"
                    onClick={() => onPeriodChange(isSelected ? null : period)}
                    className={`px-2 py-1 text-[10px] sm:text-xs rounded-md border transition-colors capitalize ${
                      isSelected
                        ? "bg-foreground text-background border-foreground"
                        : "bg-background text-foreground border-foreground/30 hover:border-foreground/50 hover:bg-accent"
                    }`}
                  >
                    {period}
                  </button>
                )
              })}
            </div>
          </div>
          {allTags.size > 0 && (
            <div>
              <h4 className="text-[10px] sm:text-xs font-medium text-muted-foreground mb-1.5">Tags</h4>
              <div className="flex flex-wrap gap-1.5 sm:gap-2 max-w-xs">
                {Array.from(allTags)
                  .sort()
                  .map((tag) => {
                    const isSelected = selectedTags.includes(tag)
                    return (
                      <button
                        key={tag}
                        type="button"
                        onClick={() => onTagToggle(tag)}
                        className={`inline-flex items-center gap-1 px-2 py-1 text-[10px] sm:text-xs rounded-md border transition-colors ${
                          isSelected
                            ? "bg-foreground text-background border-foreground"
                            : "bg-background text-foreground border-foreground/30 hover:border-foreground/50 hover:bg-accent"
                        }`}
                      >
                        {tag}
                        {isSelected && <X className="h-2.5 w-2.5 sm:h-3 sm:w-3" />}
                      </button>
                    )
                  })}
              </div>
            </div>
          )}
        </div>
      </div>
    </Popover>
  )
}

