import { createContext } from 'react'
import type { User, SignupFields } from '../types'

export interface AuthContextValue {
  user: User | null
  loading: boolean
  signup: (fields: SignupFields) => Promise<void>
  login: (identifier: string, password: string) => Promise<void>
  logout: () => Promise<void>
}

export const AuthContext = createContext<AuthContextValue | null>(null)
