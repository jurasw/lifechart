import { Link, useLocation } from "react-router-dom"
import { CheckSquare, Dumbbell, Apple, TrendingUp, Settings, LogOut, LogIn } from "lucide-react"
import { cn } from "@/lib/utils"
import { useAuthStore } from "@/store/authStore"

export const Sidebar = () => {
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

  return (
    <div className="w-64 bg-popover border-r border-border h-screen fixed left-0 top-0 flex flex-col">
      <div className="p-6 border-b border-border">
        <h1 className="text-lg font-semibold text-foreground">LifeChart</h1>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        {menuItems.map((item) => {
          const Icon = item.icon
          const isActive = location.pathname === item.path
          return (
            <Link
              key={item.path}
              to={item.path}
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
              onClick={logout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-colors text-muted-foreground hover:bg-accent/50 hover:text-foreground"
            >
              <LogOut className="h-4 w-4" />
              Logout
            </button>
            {user && (
              <div className="mt-3 pt-3 border-t border-border flex items-center gap-3">
                {user.picture && (
                  <img
                    src={user.picture}
                    alt={user.name}
                    className="w-10 h-10 rounded-full"
                  />
                )}
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-medium text-foreground truncate">{user.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{user.email}</p>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}

