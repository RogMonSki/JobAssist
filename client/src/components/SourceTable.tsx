import { formatPercent } from '../format'
import type { SourceStats } from '../types'

interface SourceTableProps {
  sources: SourceStats[]
}

const MIN_SENT_FOR_RELIABLE_RATE = 3

function SourceTable({ sources }: SourceTableProps) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900">Where you applied</h3>
      <p className="text-sm text-slate-600">
        Reply rate is the share of sent applications that got an interview, offer or rejection.
      </p>

      {sources.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No applications yet.</p>
      ) : (
        <div className="mt-3 overflow-x-auto rounded-lg border border-slate-200">
          <table className="w-full border-collapse text-left text-sm">
            <thead className="bg-slate-50">
              <tr className="border-b border-slate-200 text-slate-600">
                <th className="px-3 py-2 font-medium">Source</th>
                <th className="px-3 py-2 text-right font-medium">Tracked</th>
                <th className="px-3 py-2 text-right font-medium">Sent</th>
                <th className="px-3 py-2 text-right font-medium">Replies</th>
                <th className="px-3 py-2 text-right font-medium">Reply rate</th>
              </tr>
            </thead>
            <tbody>
              {sources.map((source) => {
                const reliable = source.applied >= MIN_SENT_FOR_RELIABLE_RATE
                return (
                  <tr key={source.source ?? 'not-recorded'} className="border-b border-slate-100 last:border-0">
                    <td className="px-3 py-2 font-medium text-slate-900">
                      {source.source ?? <span className="font-normal text-slate-500 italic">Not recorded</span>}
                    </td>
                    <td className="px-3 py-2 text-right text-slate-700 tabular-nums">{source.applications}</td>
                    <td className="px-3 py-2 text-right text-slate-700 tabular-nums">{source.applied}</td>
                    <td className="px-3 py-2 text-right text-slate-700 tabular-nums">{source.replied}</td>
                    <td
                      title={reliable ? undefined : `Fewer than ${MIN_SENT_FOR_RELIABLE_RATE} sent, too few to compare`}
                      className={`px-3 py-2 text-right tabular-nums ${reliable ? 'font-medium text-slate-900' : 'text-slate-400'}`}
                    >
                      {formatPercent(source.replied, source.applied)}
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

export default SourceTable
