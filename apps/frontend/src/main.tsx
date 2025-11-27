import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { GoogleOAuthProvider } from '@react-oauth/google'
import 'react-day-picker/dist/style.css'
import './index.css'
import App from './App.tsx'
import { useAuthStore } from './store/authStore'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
})

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '893235604028-pd4gv7fd15an7b9g3n0dqs4cet6ofqou.apps.googleusercontent.com'

function AppWithAuth() {
  const { accessToken, fetchUser, setAccessToken } = useAuthStore()

  useEffect(() => {
    const { accessToken, user, isAuthenticated } = useAuthStore.getState()
    
    if (user && accessToken && isAuthenticated) {
      useAuthStore.setState({ loading: false })
      return
    }
    
    if (accessToken && !user) {
      useAuthStore.getState().fetchUser()
    } else if (!accessToken) {
      useAuthStore.setState({ loading: false })
    }
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const frontendUrl = window.location.origin
      
      if (event.origin !== apiUrl && event.origin !== frontendUrl) {
        return
      }
      
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        const { token, user } = event.data
        
        if (token && user) {
          setAccessToken(token)
          useAuthStore.setState({ 
            user, 
            isAuthenticated: true, 
            loading: false,
            accessToken: token 
          })
        }
      }
    }

    window.addEventListener('message', handleMessage)
    return () => window.removeEventListener('message', handleMessage)
  }, [setAccessToken])

  return <App />
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
        <AppWithAuth />
      </GoogleOAuthProvider>
    </QueryClientProvider>
  </StrictMode>,
)
