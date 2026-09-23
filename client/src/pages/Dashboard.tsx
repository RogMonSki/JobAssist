import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import { useAuth } from '../context/useAuth'

interface HealthResponse {
  status: string
  dbTime: string
}

function Dashboard() {
  const { user } = useAuth()
  const [health, setHealth] = useState<HealthResponse | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Backend responded with status ${res.status}`)
        }
        return res.json() as Promise<HealthResponse>
      })
      .then(setHealth)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      })
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <div className="p-8">
        <h1 className="text-3xl font-bold">
          {user ? `Hi, ${user.firstName}` : 'Dashboard'}
        </h1>
        {error ? (
          <p className="mt-4 text-red-600">Error: {error}</p>
        ) : health ? (
          <p className="mt-4 text-green-600">
            Backend says: {health.status}, DB time: {health.dbTime}
          </p>
        ) : (
          <p className="mt-4 text-gray-500">Checking backend...</p>
        )}
      </div>
    </div>
  )
}

export default Dashboard
