import { useEffect, useState, type ReactNode } from 'react'
import { AuthContext } from './authContext'
import type { User, SignupFields } from '../types'

interface ErrorResponse {
  message?: string
}

async function apiRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const data = res.status === 204 ? null : ((await res.json()) as T | ErrorResponse)

  if (!res.ok) {
    throw new Error((data as ErrorResponse)?.message || 'Something went wrong')
  }
  return data as T
}

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
