import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react'

interface User {
  id: number
  email: string
  full_name?: string
}

interface AuthContextType {
  user: User | null
  login: (user: User) => void
  logout: () => Promise<void>
  isLoading: boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus()
  }, [])

  async function checkAuthStatus() {
    try {
      const base = (window as any).__API_BASE__ || ''
      const res = await fetch(`${base}/api/users/me`, { 
        credentials: 'include' 
      })
      
      if (res.ok) {
        const userData = await res.json()
        setUser(userData)
      } else {
        setUser(null)
      }
    } catch (error) {
      console.error('Error checking auth status:', error)
      setUser(null)
    } finally {
      setIsLoading(false)
    }
  }

  function login(userData: User) {
    setUser(userData)
  }

  async function logout() {
    try {
      const base = (window as any).__API_BASE__ || ''
      await fetch(`${base}/api/users/logout`, { 
        method: 'POST',
        credentials: 'include' 
      })
    } catch (error) {
      console.error('Error during logout:', error)
    } finally {
      setUser(null)
    }
  }

  return (
    <AuthContext.Provider value={{ user, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
