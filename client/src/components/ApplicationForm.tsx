import { useState, type SubmitEvent } from 'react'
import { apiRequest } from '../api'
import { STATUSES, type Application, type ApplicationInput } from '../types'

interface ApplicationFormProps {
  initial?: Application
  onSaved: (application: Application) => void
}

function ApplicationForm({ initial, onSaved }: ApplicationFormProps) {
  const [title, setTitle] = useState(initial?.title ?? '')
  const [company, setCompany] = useState(initial?.company ?? '')
  const [recruiter, setRecruiter] = useState(initial?.recruiter ?? '')
  const [sourceWebsite, setSourceWebsite] = useState(initial?.sourceWebsite ?? '')
  const [status, setStatus] = useState(initial?.status ?? 'saved')
  const [appliedOn, setAppliedOn] = useState(initial?.appliedOn ?? '')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event: SubmitEvent<HTMLFormElement>) {
    event.preventDefault()
    setError(null)
    setSubmitting(true)

    const trimmedRecruiter = recruiter.trim()
    const trimmedSourceWebsite = sourceWebsite.trim()

    const body: ApplicationInput = {
      title: title.trim(),
      company: company.trim(),
      recruiter: trimmedRecruiter === '' ? null : trimmedRecruiter,
      sourceWebsite: trimmedSourceWebsite === '' ? null : trimmedSourceWebsite,
      status,
      appliedOn: appliedOn === '' ? null : appliedOn,
    }

    try {
      const saved = initial
        ? await apiRequest<Application>(`/api/applications/${initial.id}`, {
            method: 'PATCH',
            body: JSON.stringify(body),
          })
        : await apiRequest<Application>('/api/applications', {
            method: 'POST',
            body: JSON.stringify(body),
          })
      onSaved(saved)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong')
    } finally {
      setSubmitting(false)
    }
  }

  const inputClasses =
    'mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 focus:border-cyan-500 focus:outline-none focus:ring-2 focus:ring-cyan-200'
  const labelClasses = 'mt-4 block text-sm font-medium text-slate-700 first:mt-0'

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>
      )}

      <label htmlFor="title" className={labelClasses}>
        Title
      </label>
      <input
        id="title"
        required
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        className={inputClasses}
      />

      <label htmlFor="company" className={labelClasses}>
        Company
      </label>
      <input
        id="company"
        required
        value={company}
        onChange={(event) => setCompany(event.target.value)}
        className={inputClasses}
      />

      <label htmlFor="recruiter" className={labelClasses}>
        Recruiter
      </label>
      <input
        id="recruiter"
        value={recruiter}
        onChange={(event) => setRecruiter(event.target.value)}
        className={inputClasses}
      />

      <label htmlFor="sourceWebsite" className={labelClasses}>
        Source website
      </label>
      <input
        id="sourceWebsite"
        value={sourceWebsite}
        onChange={(event) => setSourceWebsite(event.target.value)}
        className={inputClasses}
      />

      <label htmlFor="status" className={labelClasses}>
        Status
      </label>
      <select
        id="status"
        value={status}
        onChange={(event) => setStatus(event.target.value as typeof status)}
        className={`${inputClasses} capitalize`}
      >
        {STATUSES.map((s) => (
          <option key={s} value={s} className="capitalize">
            {s}
          </option>
        ))}
      </select>

      <label htmlFor="appliedOn" className={labelClasses}>
        Applied on
      </label>
      <input
        id="appliedOn"
        type="date"
        value={appliedOn ?? ''}
        onChange={(event) => setAppliedOn(event.target.value)}
        className={inputClasses}
      />

      <button
        type="submit"
        disabled={submitting}
        className="mt-6 w-full rounded-lg bg-linear-to-br from-cyan-500 to-teal-600 px-4 py-2.5 font-semibold text-white hover:opacity-90 disabled:opacity-60"
      >
        {submitting ? 'Saving...' : initial ? 'Save changes' : 'Add application'}
      </button>
    </form>
  )
}

export default ApplicationForm
