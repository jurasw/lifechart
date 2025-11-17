import { StrictMode, useEffect } from 'react'
import { createRoot } from 'react-dom/client'
import { GoogleOAuthProvider } from '@react-oauth/google'
import 'react-day-picker/dist/style.css'
import './index.css'
import App from './App.tsx'
import { useAuthStore } from './store/authStore'

const GOOGLE_CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID || '893235604028-pd4gv7fd15an7b9g3n0dqs4cet6ofqou.apps.googleusercontent.com'

function AppWithAuth() {
  const { accessToken, fetchUser, setAccessToken } = useAuthStore()

  useEffect(() => {
    const { accessToken, user, isAuthenticated } = useAuthStore.getState()
    const storedToken = localStorage.getItem('access_token')
    
    // If we have a persisted user and token, restore the state
    if (user && accessToken && isAuthenticated) {
      console.log('Restoring user from persisted state:', user.email)
      useAuthStore.setState({ loading: false })
      return
    }
    
    // If we have a token but no user, fetch the user
    if ((accessToken || storedToken) && !user) {
      const token = accessToken || storedToken
      if (token) {
        setAccessToken(token)
        useAuthStore.getState().fetchUser()
      }
    } else if (!accessToken && !storedToken) {
      useAuthStore.setState({ loading: false })
    }
  }, [])

  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      const apiUrl = import.meta.env.VITE_API_URL || 'http://localhost:3000'
      const frontendUrl = window.location.origin
      
      if (event.origin !== apiUrl && event.origin !== frontendUrl) {
        console.warn('Ignoring message from unauthorized origin:', event.origin)
        return
      }
      
      if (event.data && event.data.type === 'GOOGLE_AUTH_SUCCESS') {
        console.log('Received Google auth success:', event.data)
        const { token, user } = event.data
        
        if (token && user) {
          setAccessToken(token)
          useAuthStore.setState({ 
            user, 
            isAuthenticated: true, 
            loading: false,
            accessToken: token 
          })
          console.log('User logged in successfully:', user.email)
        } else {
          console.error('Missing token or user in auth success message')
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
    <GoogleOAuthProvider clientId={GOOGLE_CLIENT_ID}>
      <AppWithAuth />
    </GoogleOAuthProvider>
  </StrictMode>,
)
