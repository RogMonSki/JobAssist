import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar.jsx'

function Dashboard() {
  const [health, setHealth] = useState(null)
  const [error, setError] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`Backend responded with status ${res.status}`)
        }
        return res.json()
      })
      .then(setHealth)
      .catch((err) => setError(err.message))
  }, [])

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      
      <div className="p-8">
        <h1 className="text-3xl font-bold">Dashboard</h1>
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
