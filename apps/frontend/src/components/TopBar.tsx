import { Menu, User } from "lucide-react"
import { useAuthStore } from "@/store/authStore"
import { cn } from "@/lib/utils"

interface TopBarProps {
  onMenuClick: () => void
}

export const TopBar = ({ onMenuClick }: TopBarProps) => {
  const user = useAuthStore((state) => state.user)

  return (
    <div className="h-16 bg-popover border-b border-border flex items-center justify-between px-4 fixed top-0 left-0 right-0 z-40 lg:left-64">
      <div className="flex-1" />
      <div className="flex items-center gap-3">
        {user && (
          <div className="flex items-center gap-2">
            {user.picture ? (
              <img
                src={user.picture}
                alt={user.name}
                className="w-8 h-8 rounded-full"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-accent flex items-center justify-center">
                <User className="h-4 w-4 text-muted-foreground" />
              </div>
            )}
            <span className="hidden sm:inline text-sm font-medium text-foreground">
              {user.name}
            </span>
          </div>
        )}
        <button
          onClick={onMenuClick}
          className="p-2 bg-accent hover:bg-accent/80 border border-border rounded-md transition-colors"
          aria-label="Toggle menu"
        >
          <Menu className="h-5 w-5 text-foreground" />
        </button>
      </div>
    </div>
  )
}

