import { Fragment, useEffect, useState } from 'react'
import Navbar from '../components/Navbar'
import Modal from '../components/Modal'
import ApplicationForm from '../components/ApplicationForm'
import StatusSelect from '../components/StatusSelect'
import JobDescriptionPanel from '../components/JobDescriptionPanel'
import { apiRequest } from '../api'
import { useAuth } from '../context/useAuth'
import type { Application } from '../types'

function Dashboard() {
  const { user } = useAuth()
  const [applications, setApplications] = useState<Application[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editing, setEditing] = useState<Application | 'new' | null>(null)
  const [expandedId, setExpandedId] = useState<number | null>(null)

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

  function handleApplicationUpdated(application: Application) {
    setApplications((current) => upsertByUpdatedAt(current, application))
  }

  async function handleDelete(application: Application) {
    if (!window.confirm(`Delete "${application.title}" at ${application.company}?`)) {
      return
    }
    try {
      await apiRequest(`/api/applications/${application.id}`, { method: 'DELETE' })
      setApplications((current) => current.filter((a) => a.id !== application.id))
      setExpandedId((current) => (current === application.id ? null : current))
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

        <div className="mt-6 rounded-xl bg-linear-to-br from-cyan-500 to-teal-600 p-6 text-white shadow-sm">
          {loading ? (
            <p>Loading applications...</p>
          ) : error ? null : applications.length === 0 ? (
            <p>No applications yet. Add your first one to get started.</p>
          ) : (
            <table className="w-full border-collapse text-left text-sm">
              <thead>
                <tr className="border-b border-white/30">
                  <th className="w-8 py-2 pr-2">
                    <span className="sr-only">Details</span>
                  </th>
                  <th className="py-2 pr-4 font-medium">Title</th>
                  <th className="py-2 pr-4 font-medium">Company</th>
                  <th className="py-2 pr-4 font-medium">Recruiter</th>
                  <th className="py-2 pr-4 font-medium">Source Website</th>
                  <th className="py-2 pr-4 font-medium">Status</th>
                  <th className="py-2 pr-4 font-medium">Applied on</th>
                  <th className="py-2 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody>
                {applications.map((application) => {
                  const expanded = expandedId === application.id
                  return (
                    <Fragment key={application.id}>
                      <tr className="border-b border-white/20">
                        <td className="py-3 pr-2">
                          <button
                            type="button"
                            onClick={() => setExpandedId(expanded ? null : application.id)}
                            aria-expanded={expanded}
                            aria-label={`${expanded ? 'Hide' : 'Show'} job description for ${application.title}`}
                            className="w-6 font-medium text-white hover:opacity-80"
                          >
                            {expanded ? '▾' : '▸'}
                          </button>
                        </td>
                        <td className="py-3 pr-4">{application.title}</td>
                        <td className="py-3 pr-4">{application.company}</td>
                        <td className="py-3 pr-4">{application.recruiter ? application.recruiter : 'N/A'}</td>
                        <td className="py-3 pr-4">{application.sourceWebsite ? application.sourceWebsite : 'N/A'}</td>
                        <td className="py-3 pr-4">
                          <StatusSelect application={application} onChange={handleApplicationUpdated} />
                        </td>
                        <td className="py-3 pr-4">{application.appliedOn ?? '—'}</td>
                        <td className="py-3">
                          <button
                            type="button"
                            onClick={() => setEditing(application)}
                            className="mr-3 font-medium text-white hover:underline"
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => handleDelete(application)}
                            className="font-medium text-red-200 hover:underline"
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                      {expanded && (
                        <tr className="border-b border-white/20">
                          <td colSpan={8} className="pb-4 pl-8">
                            <JobDescriptionPanel
                              application={application}
                              onChange={handleApplicationUpdated}
                            />
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
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
