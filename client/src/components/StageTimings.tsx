import StatTile from './StatTile'
import { formatDays, pluralise } from '../format'
import type { Stats } from '../types'

interface StageTimingsProps {
  stageDurations: Stats['stageDurations']
}

const TIMINGS = [
  { key: 'saved', label: 'Time before applying' },
  { key: 'applied', label: 'Time waiting for a reply' },
  { key: 'interview', label: 'Time in interview stage' },
] as const

const SMALL_SAMPLE_BELOW = 5

function StageTimings({ stageDurations }: StageTimingsProps) {
  return (
    <div>
      <h3 className="font-semibold text-slate-900">Time in each stage</h3>
      <p className="text-sm text-slate-600">Median length of completed stays before the status changed.</p>

      <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
        {TIMINGS.map(({ key, label }) => {
          const { medianDays, sampleSize } = stageDurations[key]
          return (
            <StatTile
              key={key}
              label={label}
              value={medianDays === null ? '—' : formatDays(medianDays)}
              detail={
                sampleSize === 0
                  ? 'No completed stays yet'
                  : `Median of ${pluralise(sampleSize, 'completed stay')}${sampleSize < SMALL_SAMPLE_BELOW ? ' (small sample)' : ''}`
              }
            />
          )
        })}
      </div>

      <p className="mt-3 text-xs text-slate-500">
        Timings use the day you changed each status in this app, so applications added after the fact can skew them.
      </p>
    </div>
  )
}

export default StageTimings
