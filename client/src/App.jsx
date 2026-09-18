import { useEffect, useState } from 'react'

function App() {
  const [health, setHealth] = useState(null)

  useEffect(() => {
    fetch('/api/health')
      .then((res) => res.json())
      .then(setHealth)
  }, [])

  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-blue-600">Job Application Assistant</h1>
      {health ? (
        <p className="mt-4 text-green-600">
          Backend says: {health.status}, DB time: {health.dbTime}
        </p>
      ) : (
        <p className="mt-4 text-gray-500">Checking backend...</p>
      )}
    </div>
  )
}

export default App
