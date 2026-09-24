import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext } from './authContext'
import { apiRequest } from '../api'
import type { User, SignupFields } from '../types'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest<User>('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function signup(fields: SignupFields) {
    const newUser = await apiRequest<User>('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(fields),
    })
    setUser(newUser)
  }

  async function login(identifier: string, password: string) {
    const loggedInUser = await apiRequest<User>('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ identifier, password }),
    })
    setUser(loggedInUser)
  }

  async function logout() {
    await apiRequest('/api/auth/logout', { method: 'POST' })
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, signup, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}
