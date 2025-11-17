import { Button } from "@/components/ui/button"
import { useAuthStore } from "@/store/authStore"

export const LoginPage = () => {
  const login = useAuthStore((state) => state.login)

  return (
    <div className="h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-4xl font-bold">LifeChart</h1>
        <p className="text-muted-foreground text-lg">
          Track your daily habits, tasks, workouts, diet, and investments
        </p>
        <Button
          onClick={login}
          size="lg"
          className="mt-4"
        >
          Sign in with Google
        </Button>
      </div>
    </div>
  )
}

