import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import SkillGapTable from '../components/SkillGapTable'
import EvaluationResult from '../components/EvaluationResult'
import EvaluationHistory from '../components/EvaluationHistory'
import { apiRequest } from '../api'
import { evidenceLabel, formatDateTime } from '../format'
import type { Cv, Evaluation, SkillGap } from '../types'

interface GapState {
  cvId: number
  gap: SkillGap | null
  error: string | null
}

function evaluationBlocker(cv: Cv | null, gap: SkillGap | null): string | null {
  if (!cv) {
    return null
  }
  if (cv.textExtractionStatus === 'failed') {
    return 'No text could be read from this CV (it may be a scanned image), so it cannot be evaluated.'
  }
  if (gap && gap.tier !== 'none' && cv.skillsExtractionStatus !== 'success') {
    return "This CV's skills have not been extracted yet. Open it on the dashboard and retry the extraction."
  }
  return null
}

function Evaluate() {
  const [cvs, setCvs] = useState<Cv[]>([])
  const [history, setHistory] = useState<Evaluation[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [selectedCvId, setSelectedCvId] = useState<number | null>(null)
  const [gapState, setGapState] = useState<GapState | null>(null)
  const [evaluating, setEvaluating] = useState(false)
  const [evaluateError, setEvaluateError] = useState<string | null>(null)
  const [result, setResult] = useState<Evaluation | null>(null)

  useEffect(() => {
    Promise.all([apiRequest<Cv[]>('/api/cvs'), apiRequest<Evaluation[]>('/api/evaluations')])
      .then(([loadedCvs, loadedHistory]) => {
        setCvs(loadedCvs)
        setHistory(loadedHistory)
        setSelectedCvId((loadedCvs.find((cv) => cv.isPrimary) ?? loadedCvs[0])?.id ?? null)
      })
      .catch((err: unknown) => {
        setLoadError(err instanceof Error ? err.message : 'Something went wrong')
      })
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    if (selectedCvId === null) {
      return
    }
    let ignore = false
    apiRequest<SkillGap>(`/api/evaluations/skill-gap?cvId=${selectedCvId}`)
      .then((gap) => {
        if (!ignore) {
          setGapState({ cvId: selectedCvId, gap, error: null })
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setGapState({
            cvId: selectedCvId,
            gap: null,
            error: err instanceof Error ? err.message : 'Could not load the skill gap',
          })
        }
      })
    return () => {
      ignore = true
    }
  }, [selectedCvId])

  const selectedCv = cvs.find((cv) => cv.id === selectedCvId) ?? null
  const currentGapState = gapState?.cvId === selectedCvId ? gapState : null
  const gap = currentGapState?.gap ?? null
  const blocker = evaluationBlocker(selectedCv, gap)

  async function handleEvaluate() {
    if (selectedCvId === null) {
      return
    }
    setEvaluating(true)
    setEvaluateError(null)
    try {
      const evaluation = await apiRequest<Evaluation>('/api/evaluations', {
        method: 'POST',
        body: JSON.stringify({ cvId: selectedCvId }),
      })
      setResult(evaluation)
      setHistory((current) => [evaluation, ...current])
    } catch (err) {
      setEvaluateError(err instanceof Error ? err.message : 'Could not evaluate CV')
    } finally {
      setEvaluating(false)
    }
  }

  function handleEvaluateAnother() {
    setResult(null)
    setEvaluateError(null)
  }

  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />

      <main className="mx-auto w-full max-w-4xl space-y-6 p-8">
        <Link to="/dashboard" className="text-sm font-medium text-teal-700 hover:underline">
          ← Back to dashboard
        </Link>
        <h1 className="text-3xl font-bold">Evaluate my CV</h1>

        {loading ? (
          <p className="text-slate-600">Loading...</p>
        ) : loadError ? (
          <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{loadError}</p>
        ) : (
          <>
            {cvs.length === 0 ? (
              <p className="rounded-xl border border-slate-200 bg-white p-6 text-slate-700 shadow-sm">
                You have no CVs yet.{' '}
                <Link to="/dashboard" className="font-medium text-teal-700 hover:underline">
                  Upload one on the dashboard
                </Link>{' '}
                to evaluate it.
              </p>
            ) : (
              <section className="space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap items-end gap-4">
                  <div className="min-w-0 flex-1">
                    <label htmlFor="cv-select" className="block text-sm font-medium text-slate-700">
                      CV to evaluate
                    </label>
                    <select
                      id="cv-select"
                      value={selectedCvId ?? ''}
                      onChange={(event) => setSelectedCvId(Number(event.target.value))}
                      disabled={evaluating || result !== null}
                      className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-slate-900 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200 disabled:opacity-60"
                    >
                      {cvs.map((cv) => (
                        <option key={cv.id} value={cv.id}>
                          {cv.fileName}
                          {cv.isPrimary ? ' ★ (primary)' : ''}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    type="button"
                    onClick={result ? handleEvaluateAnother : handleEvaluate}
                    disabled={evaluating || (!result && (gap === null || blocker !== null))}
                    className="rounded-lg bg-linear-to-br from-cyan-500 to-teal-600 px-4 py-2 font-semibold text-white hover:opacity-90 disabled:opacity-60"
                  >
                    {evaluating ? 'Evaluating...' : result ? 'Evaluate another CV' : 'Evaluate'}
                  </button>
                </div>

                {blocker && !result && (
                  <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-800">{blocker}</p>
                )}
                {evaluateError && (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{evaluateError}</p>
                )}
                {evaluating && (
                  <p role="status" className="text-sm text-slate-600">
                    Writing your evaluation. This can take a few seconds.
                  </p>
                )}
              </section>
            )}

            {selectedCv && (
              <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <h2 className="mb-3 text-xl font-semibold text-slate-900">Skill gap</h2>
                {currentGapState === null ? (
                  <p className="text-sm text-slate-600">Loading skill gap...</p>
                ) : currentGapState.error ? (
                  <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{currentGapState.error}</p>
                ) : gap ? (
                  <SkillGapTable gap={gap} />
                ) : null}
              </section>
            )}

            {result && (
              <section className="rounded-xl border border-teal-600/30 bg-white p-6 shadow-sm">
                <h2 className="text-xl font-semibold text-slate-900">Evaluation of {result.cvFileName}</h2>
                <p className="mb-4 text-xs text-slate-500">
                  {formatDateTime(result.createdAt)} · {evidenceLabel(result.tier, result.applicationCount)}
                </p>
                <EvaluationResult evaluation={result.evaluation} />
              </section>
            )}

            <EvaluationHistory items={history} />
          </>
        )}
      </main>
    </div>
  )
}

export default Evaluate
