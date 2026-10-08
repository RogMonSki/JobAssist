import { useState } from 'react'
import { apiRequest } from '../api'
import type { Application } from '../types'

interface JobDescriptionPanelProps {
  application: Application
  onChange: (updated: Application) => void
}

function JobDescriptionPanel({ application, onChange }: JobDescriptionPanelProps) {
  const [draft, setDraft] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const editing = draft !== null

  async function save(jobDescription: string | null) {
    setSaving(true)
    setError(null)
    try {
      const updated = await apiRequest<Application>(
        `/api/applications/${application.id}/job-description`,
        { method: 'PUT', body: JSON.stringify({ jobDescription }) }
      )
      onChange(updated)
      setDraft(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not save job description')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="space-y-4 py-2">
      <div>
        <h3 className="font-semibold">Job description</h3>

        {editing ? (
          <div className="mt-2">
            <textarea
              value={draft}
              onChange={(event) => setDraft(event.target.value)}
              disabled={saving}
              rows={10}
              aria-label="Job description"
              placeholder="Paste the job description here"
              className="w-full rounded-lg border border-slate-300 bg-white p-3 text-sm text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:opacity-60"
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => save(draft)}
                disabled={saving}
                className="rounded-lg bg-white px-4 py-1.5 font-semibold text-teal-700 hover:bg-white/90 disabled:opacity-60"
              >
                {saving ? 'Saving & extracting…' : 'Save'}
              </button>
              <button
                type="button"
                onClick={() => setDraft(null)}
                disabled={saving}
                className="rounded-lg px-4 py-1.5 font-medium text-white hover:underline disabled:opacity-60"
              >
                Cancel
              </button>
            </div>
          </div>
        ) : application.jobDescription ? (
          <p className="mt-2 max-h-48 overflow-y-auto rounded-lg bg-black/25 p-3 text-sm whitespace-pre-wrap">
            {application.jobDescription}
          </p>
        ) : (
          <p className="mt-2 text-sm text-white/80">No job description yet.</p>
        )}
      </div>

      {!editing && application.extractionStatus === 'success' && (
        <p className="text-sm text-white/80">Requirements extracted.</p>
      )}
      {!editing && application.extractionStatus === 'failed' && (
        <p className="text-sm">
          Could not extract requirements.{' '}
          <button
            type="button"
            onClick={() => save(application.jobDescription)}
            disabled={saving}
            className="font-medium underline disabled:opacity-60"
          >
            {saving ? 'Retrying…' : 'Retry'}
          </button>
        </p>
      )}

      {!editing && (
        <button
          type="button"
          onClick={() => setDraft(application.jobDescription ?? '')}
          className="rounded-lg bg-white px-4 py-1.5 font-semibold text-teal-700 hover:bg-white/90"
        >
          {application.jobDescription ? 'Edit job description' : 'Add job description'}
        </button>
      )}

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      <div>
        <h3 className="font-semibold">Debug: extracted JSON</h3>
        <pre className="mt-2 max-h-64 overflow-auto rounded-lg bg-black/50 p-3 text-xs">
          {JSON.stringify(application.jdExtraction, null, 2)}
        </pre>
      </div>
    </div>
  )
}

export default JobDescriptionPanel
