import { CHART_COLORS } from '../chartTheme'
import { formatPercent, pluralise } from '../format'
import type { PipelineStage, Stats } from '../types'

interface ApplicationFunnelProps {
  funnel: Stats['funnel']
  dropOff: Stats['dropOff']
}

const STAGES = [
  { key: 'applied', label: 'Applied' },
  { key: 'interview', label: 'Interview' },
  { key: 'offer', label: 'Offer' },
] as const

const CONVERSION_TEXT = {
  interview: (percent: string) => `${percent} of applications led to an interview`,
  offer: (percent: string) => `${percent} of interviews led to an offer`,
}

const DROP_OFF_ORDER: PipelineStage[] = ['saved', 'applied', 'interview', 'offer']

const DROP_OFF_LABELS: Record<PipelineStage, string> = {
  saved: 'Before applying',
  applied: 'After applying, no interview',
  interview: 'After an interview',
  offer: 'After an offer',
}

const BAR_HEIGHT = 'h-4'
const SMALL_SAMPLE_BELOW = 5

function ApplicationFunnel({ funnel, dropOff }: ApplicationFunnelProps) {
  const sent = funnel.applied
  const rejections = DROP_OFF_ORDER.map((stage) => ({ stage, count: dropOff[stage] })).filter(
    (entry) => entry.count > 0
  )
  const totalRejections = rejections.reduce((total, entry) => total + entry.count, 0)

  return (
    <div>
      <h3 className="font-semibold text-slate-900">Application funnel</h3>

      {sent === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          No applications sent yet. Move an application to Applied to start the funnel.
        </p>
      ) : (
        <>
          <p className="text-sm text-slate-600">
            Based on {pluralise(sent, 'application')} sent
            {sent < SMALL_SAMPLE_BELOW && ' — a small sample, so treat it as indicative'}.
          </p>

          <ol className="mt-3">
            {STAGES.map(({ key, label }, index) => {
              const count = funnel[key]
              const width = (count / sent) * 100
              const previous = index === 0 ? null : STAGES[index - 1]
              return (
                <li key={key}>
                  {previous && key !== 'applied' && (
                    <p className="py-1.5 pl-23 text-xs text-slate-500">
                      {CONVERSION_TEXT[key](formatPercent(count, funnel[previous.key]))}
                    </p>
                  )}
                  <div
                    title={`${count} of ${pluralise(sent, 'application')} sent reached ${label.toLowerCase()} (${formatPercent(count, sent)})`}
                    className="flex items-center gap-3 rounded hover:bg-slate-50"
                  >
                    <span className="w-20 shrink-0 text-sm text-slate-700">{label}</span>
                    <div className="flex-1 pr-10">
                      <div className={`relative ${BAR_HEIGHT}`}>
                        <div
                          aria-hidden="true"
                          className="h-full rounded-r"
                          style={{ width: `${width}%`, backgroundColor: CHART_COLORS.stage[key] }}
                        />
                        <span
                          className="absolute top-1/2 -translate-y-1/2 text-sm font-medium text-slate-900"
                          style={{ left: `calc(${width}% + 8px)` }}
                        >
                          {count}
                        </span>
                      </div>
                    </div>
                  </div>
                </li>
              )
            })}
          </ol>

          <div className="mt-5 border-t border-slate-100 pt-3">
            <h4 className="text-sm font-medium text-slate-700">Where rejections happened</h4>
            {totalRejections === 0 ? (
              <p className="mt-1 text-sm text-slate-600">No rejections yet.</p>
            ) : (
              <ul className="mt-2 space-y-1 text-sm">
                {rejections.map(({ stage, count }) => (
                  <li key={stage} className="flex justify-between gap-4 text-slate-700">
                    <span>{DROP_OFF_LABELS[stage]}</span>
                    <span>
                      <strong className="text-slate-900">{count}</strong>{' '}
                      <span className="text-slate-500">({formatPercent(count, totalRejections)})</span>
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </>
      )}
    </div>
  )
}

export default ApplicationFunnel
