import { formatDateTime } from '../format'
import type { InterviewPrep } from '../types'
import PrepGuidance from './PrepGuidance'

interface PrepHistoryProps {
  items: InterviewPrep[]
}

function PrepHistory({ items }: PrepHistoryProps) {
  return (
    <section className="space-y-3">
      <h2 className="text-xl font-semibold text-slate-900">Prep history ({items.length})</h2>

      {items.length === 0 ? (
        <p className="rounded-xl border border-slate-200 bg-white p-6 text-sm text-slate-600 shadow-sm">
          No interview prep yet.
        </p>
      ) : (
        items.map((item) => (
          <details key={item.id} className="rounded-xl border border-slate-200 bg-white shadow-sm">
            <summary className="flex cursor-pointer flex-wrap items-baseline justify-between gap-2 px-6 py-4">
              <span className="font-semibold text-slate-900">
                {item.jobTitle} — {item.company}
                {item.applicationId === null && <span className="ml-1 font-normal text-slate-500">(deleted)</span>}
              </span>
              <span className="text-xs text-slate-500">{formatDateTime(item.createdAt)}</span>
            </summary>

            <div className="border-t border-slate-200 p-6">
              <PrepGuidance guidance={item.guidance} />
            </div>
          </details>
        ))
      )}
    </section>
  )
}

export default PrepHistory
