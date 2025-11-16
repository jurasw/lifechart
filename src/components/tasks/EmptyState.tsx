import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"

interface EmptyStateProps {
  onAddTask: () => void
}

export const EmptyState = ({ onAddTask }: EmptyStateProps) => {
  return (
    <div className="h-screen bg-background flex items-center justify-center">
      <Button
        onClick={onAddTask}
        className="rounded-full h-14 w-14 p-0 bg-white text-black hover:bg-white/90"
        size="icon"
      >
        <Plus className="h-6 w-6" />
      </Button>
    </div>
  )
}

