import { useState } from 'react'
import { apiRequest } from '../api'
import { STATUSES, type Application } from '../types'

interface StatusSelectProps {
  application: Application
  onChange: (updated: Application) => void
}

function StatusSelect({ application, onChange }: StatusSelectProps) {
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleChange(event: React.ChangeEvent<HTMLSelectElement>) {
    const status = event.target.value
    setSaving(true)
    setError(null)
    try {
      const updated = await apiRequest<Application>(`/api/applications/${application.id}`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      onChange(updated)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update status')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div>
      <select
        value={application.status}
        onChange={handleChange}
        disabled={saving}
        className="rounded-lg border border-slate-300 px-2 py-1 text-sm capitalize focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:opacity-60"
      >
        {STATUSES.map((status) => (
          <option key={status} value={status} className="capitalize">
            {status}
          </option>
        ))}
      </select>
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default StatusSelect
