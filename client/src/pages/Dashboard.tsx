import { useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import ApplicationForm from '../components/ApplicationForm'
import StatusSelect from '../components/StatusSelect'
import { apiRequest } from '../api'
import { useAuth } from '../context/useAuth'
import type { Application } from '../types'

function Dashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Application | 'new' | null>(null)

  useEffect(() => {
    apiRequest<Application[]>('/api/applications')
      .then(setApplications)
      .catch((err: unknown) => {
        setError(err instanceof Error ? err.message : 'Something went wrong')
      })
      .finally(() => setLoading(false))
  }, [])

  function upsertByUpdatedAt(current: Application[], application: Application): Application[] {
    const exists = current.some((a) => a.id === application.id)
    const next = exists
      ? current.map((a) => (a.id === application.id ? application : a))
      : [application, ...current]
    return next.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }

  function handleSaved(application: Application) {
    setApplications((current) => upsertByUpdatedAt(current, application))
    setEditing(null)
  }

  function handleStatusChange(application: Application) {
    setApplications((current) => upsertByUpdatedAt(current, application))
  }

  async function handleDelete(application: Application) {
    if (!window.confirm(`Delete "${application.title}" at ${application.company}?`)) {
      return
    }
    try {
      await apiRequest(`/api/applications/${application.id}`, { method: 'DELETE' })
      setApplications((current) => current.filter((a) => a.id !== application.id))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete application')
    }
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <div className="p-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold">{user ? `Hi, ${user.firstName}` : 'Dashboard'}</h1>
          <button
            type="button"
            onClick={() => setEditing('new')}
            className="rounded-lg bg-linear-to-br from-cyan-500 to-teal-600 px-4 py-2 font-semibold text-white hover:opacity-90"
          >
            Add application
          </button>
        </div>

        {error && (
          <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
        )}

        {loading ? (
          <p className="mt-6 text-slate-500">Loading applications...</p>
        ) : error ? null : applications.length === 0 ? (
          <p className="mt-6 text-slate-500">
            No applications yet. Add your first one to get started.
          </p>
        ) : (
          <table className="mt-6 w-full border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-slate-200 text-slate-500">
                <th className="py-2 pr-4 font-medium">Title</th>
                <th className="py-2 pr-4 font-medium">Company</th>
                <th className="py-2 pr-4 font-medium">Status</th>
                <th className="py-2 pr-4 font-medium">Applied on</th>
                <th className="py-2 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {applications.map((application) => (
                <tr key={application.id} className="border-b border-slate-100">
                  <td className="py-3 pr-4">{application.title}</td>
                  <td className="py-3 pr-4">{application.company}</td>
                  <td className="py-3 pr-4">
                    <StatusSelect application={application} onChange={handleStatusChange} />
                  </td>
                  <td className="py-3 pr-4">{application.appliedOn ?? '—'}</td>
                  <td className="py-3">
                    <button
                      type="button"
                      onClick={() => setEditing(application)}
                      className="mr-3 font-medium text-cyan-600 hover:underline"
                    >
                      Edit
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(application)}
                      className="font-medium text-red-600 hover:underline"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {editing && (
        <Modal
          title={editing === 'new' ? 'Add application' : 'Edit application'}
          onClose={() => setEditing(null)}
        >
          <ApplicationForm
            initial={editing === 'new' ? undefined : editing}
            onSaved={handleSaved}
          />
        </Modal>
      )}
    </div>
  )
}

export default Dashboard
