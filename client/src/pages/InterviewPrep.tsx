import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import PrepGuidance from '../components/PrepGuidance'
import PrepHistory from '../components/PrepHistory'
import { apiRequest } from '../api'
import { formatDateTime } from '../format'
import type { Application, InterviewPrep as InterviewPrepEntry } from '../types'

function InterviewPrep() {
  const [applications, setApplications] = useState<Application[]>([])
  const [history, setHistory] = useState<InterviewPrepEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [generating, setGenerating] = useState(false)
  const [generateError, setGenerateError] = useState<string | null>(null)
  const [result, setResult] = useState<InterviewPrepEntry | null>(null)

  useEffect(() => {
    Promise.all([
      apiRequest<Application[]>('/api/applications'),
      apiRequest<InterviewPrepEntry[]>('/api/interview-preps'),
    ])
      .then(([loadedApplications, loadedHistory]) => {
        const interviewing = loadedApplications.filter((application) => application.status === 'interview')
        setApplications(interviewing)
        setHistory(loadedHistory)
        setSelectedId(interviewing.find((application) => application.jobDescription !== null)?.id ?? null)
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Something went wrong')
      })
      .finally(() => setLoading(false))
  }, [])

  async function handleGenerate() {
    if (selectedId === null) {
      return
    }
    setGenerating(true)
    setGenerateError(null)
    try {
      const prep = await apiRequest<InterviewPrepEntry>('/api/interview-preps', {
        method: 'POST',
        body: JSON.stringify({ applicationId: selectedId }),
      })
      setResult(prep)
      setHistory((current) => [prep, ...current])
    } catch (err) {
      setGenerateError(err instanceof Error ? err.message : 'Could not generate guidance')
    } finally {
      setGenerating(false)
    }
  }

  function handlePrepareAnother() {
    setResult(null)
    setGenerateError(null)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl space-y-6 p-8">
        <Link to="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold">Interview prep</h1>

        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : loadError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
        ) : (
          <>
            {applications.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
                None of your applications are in the interview stage.{' '}
                <Link to="/dashboard" className="font-medium text-teal-700 hover:underline">
                  Change an application's status on the dashboard
                </Link>{' '}
                to get guidance for it.
              </p>
            ) : (
              <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="application-select" className="block text-sm font-medium text-slate-700">
                      Application to prepare for
                    </label>
                    <select
                      id="application-select"
                      value={selectedId ?? ''}
                      onChange={(event) => setSelectedId(Number(event.target.value))}
                      disabled={generating || result !== null}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:opacity-60"
                    >
                      {selectedId === null && (
                        <option value="" disabled>
                          Select an application
                        </option>
                      )}
                      {applications.map((application) => (
                        <option
                          key={application.id}
                          value={application.id}
                          disabled={application.jobDescription === null}
                        >
                          {application.title} — {application.company}
                          {application.jobDescription === null ? ' (no job description)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={result ? handlePrepareAnother : handleGenerate}
                    disabled={generating || (!result && selectedId === null)}
                    className="rounded-lg bg-linear-to-br from-cyan-500 to-teal-600 px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {generating ? 'Generating...' : result ? 'Prepare for another' : 'Generate guidance'}
                  </button>
                </div>

                {selectedId === null && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">
                    Guidance is written from the job description. Add one to an interview-stage application on
                    the dashboard first.
                  </p>
                )}
                {generateError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{generateError}</p>
                )}
                {generating && (
                  <p role="status" className="text-sm text-slate-600">
                    Writing your guidance. This can take a few seconds.
                  </p>
                )}
              </section>
            )}

            {result && (
              <section className="rounded-xl border border-teal-600/30 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">
                  Guidance for {result.jobTitle} — {result.company}
                </h2>
                <p className="mb-4 text-xs text-slate-500">{formatDateTime(result.createdAt)}</p>
                <PrepGuidance guidance={result.guidance} />
              </section>
            )}

            <PrepHistory items={history} />
          </>
        )}
      </main>
    </div>
  )
}

export default InterviewPrep
