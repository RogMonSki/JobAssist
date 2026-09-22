import { useEffect, useState } from 'react'
import { AuthContext } from './authContext.js'

async function apiRequest(path, options = {}) {
  const res = await fetch(path, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json' },
    ...options,
  })

  const data = res.status === 204 ? null : await res.json()

  if (!res.ok) {
    throw new Error(data?.message || 'Something went wrong')
  }
  return data
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    apiRequest('/api/auth/me')
      .then(setUser)
      .catch(() => setUser(null))
      .finally(() => setLoading(false))
  }, [])

  async function signup(fields) {
    const newUser = await apiRequest('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify(fields),
    })
    setUser(newUser)
  }

  async function login(identifier, password) {
    const loggedInUser = await apiRequest('/api/auth/login', {
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
