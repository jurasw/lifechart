import { Link, useLocation } from "react-router-dom"
import { CheckSquare, Dumbbell, Apple, TrendingUp, Settings, LogOut, LogIn, X } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"

interface SidebarProps {
  isOpen: boolean
  onClose: () => void
}

export const Sidebar = ({ isOpen, onClose }: SidebarProps) => {
  const location = useLocation()
  const user = useAuthStore((state) => state.user)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const login = useAuthStore((state) => state.login)
  const logout = useAuthStore((state) => state.logout)
  
  const menuItems = [
    { path: "/tasks", label: "Tasks", icon: CheckSquare },
    { path: "/workout", label: "Workout", icon: Dumbbell },
    { path: "/diet", label: "Diet", icon: Apple },
    { path: "/investment", label: "Investment", icon: TrendingUp },
  ]

  const handleLinkClick = () => {
    onClose()
  }

  return (
    <>
      {isOpen && (
        <div
          className="lg:hidden fixed inset-0 bg-black/50 z-40"
          onClick={onClose}
        />
      )}
      
      <div className={cn(
        "w-64 bg-popover border-r border-border h-screen fixed left-0 top-0 flex flex-col z-50 transition-transform duration-300 pt-16",
        "lg:translate-x-0",
        isOpen ? "translate-x-0" : "-translate-x-full"
      )}>
        <div className="p-6 border-b border-border flex items-center justify-between">
          <h1 className="text-lg font-semibold text-foreground">LifeChart</h1>
          <button
            onClick={onClose}
            className="lg:hidden p-1 hover:bg-accent rounded-md transition-colors"
            aria-label="Close menu"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
              onClick={handleLinkClick}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                isActive
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {item.label}
            </Link>
          )
        })}
      </nav>
      <div className="p-4 border-t border-border space-y-1">
        {!isAuthenticated ? (
          <button
            onClick={login}
            className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground"
          >
            <LogIn className="h-4 w-4" />
            Login
          </button>
        ) : (
          <>
            <Link
              to="/settings"
              onClick={handleLinkClick}
              className={cn(
                "w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                location.pathname === "/settings"
                  ? "bg-accent text-accent-foreground"
                  : "text-muted-foreground hover:bg-accent/50 hover:text-foreground"
              )}
            >
              <Settings className="h-4 w-4" />
              Settings
            </Link>
            <button
              onClick={() => {
                logout()
                handleLinkClick()
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
          </>
        )}
      </div>
    </div>
    </>
  )
}

