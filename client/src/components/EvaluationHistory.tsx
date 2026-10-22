import { evidenceLabel, formatDateTime } from '../format'
import type { Evaluation } from '../types'
import EvaluationResult from './EvaluationResult'
import SkillGapTable from './SkillGapTable'

interface EvaluationHistoryProps {
  items: Evaluation[]
}

function EvaluationHistory({ items }: EvaluationHistoryProps) {
  return (
    <details className="rounded-xl border border-slate-200 bg-white shadow-sm">
      <summary className="cursor-pointer px-6 py-4 font-semibold text-slate-900">
        Evaluation history ({items.length})
      </summary>

      <div className="space-y-4 border-t border-slate-200 p-6">
        {items.length === 0 ? (
          <p className="text-sm text-slate-600">No evaluations yet.</p>
        ) : (
          items.map((item) => (
            <article key={item.id} className="rounded-lg border border-teal-600/30 p-4">
              <div className="flex flex-wrap items-baseline justify-between gap-2">
                <h3 className="font-semibold text-slate-900">
                  {item.cvFileName}
                  {item.cvId === null && <span className="ml-1 font-normal text-slate-500">(deleted)</span>}
                </h3>
                <p className="text-xs text-slate-500">
                  {formatDateTime(item.createdAt)} · {evidenceLabel(item.tier, item.applicationCount)}
                </p>
              </div>

              <div className="mt-3">
                <EvaluationResult evaluation={item.evaluation} />
              </div>

              {item.tier !== 'none' && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-teal-700">
                    Skill gap at the time
                  </summary>
                  <div className="mt-3">
                    <SkillGapTable gap={item.skillGap} />
                  </div>
                </details>
              )}
            </article>
          ))
        )}
      </div>
    </details>
  )
}

export default EvaluationHistory
