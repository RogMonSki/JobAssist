import { useEffect, useState } from 'react'
import StatTile from './StatTile'
import SkillFrequencyChart from './SkillFrequencyChart'
import ApplicationFunnel from './ApplicationFunnel'
import StageTimings from './StageTimings'
import SourceTable from './SourceTable'
import ActivityChart from './ActivityChart'
import { apiRequest } from '../api'
import { formatPercent, formatYears, pluralise } from '../format'
import type { Application, Stats } from '../types'

interface StatsPanelProps {
  applications: Application[]
}

interface StatsState {
  stats: Stats | null
  error: string | null
}

function Overview({ stats }: { stats: Stats }) {
  const { totals, awaitingReply, experience } = stats

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatTile
        label="Applications"
        value={String(totals.applications)}
        detail={`${totals.applied} sent, ${totals.applications - totals.applied} not yet`}
      />
      <StatTile
        label="Reply rate"
        value={formatPercent(totals.replied, totals.applied)}
        detail={
          totals.applied === 0
            ? 'No applications sent yet'
            : `${totals.replied} of ${totals.applied} sent got an interview, offer or rejection`
        }
      />
      <StatTile
        label="Awaiting reply"
        value={String(awaitingReply)}
        detail="Applied more than 14 days ago, no change since"
      />
      <StatTile
        label="Experience asked for"
        value={experience.medianYears === null ? '—' : `${formatYears(experience.medianYears)} yrs`}
        detail={
          experience.medianYears === null || experience.minYears === null || experience.maxYears === null
            ? 'No job description states a number of years yet'
            : `Median of ${pluralise(experience.sampleSize, 'job description')}, range ${formatYears(experience.minYears)}–${formatYears(experience.maxYears)}`
        }
      />
    </div>
  )
}

function StatsPanel({ applications }: StatsPanelProps) {
  const [state, setState] = useState<StatsState>({ stats: null, error: null })

  useEffect(() => {
    let ignore = false
    apiRequest<Stats>('/api/stats')
      .then((stats) => {
        if (!ignore) {
          setState({ stats, error: null })
        }
      })
      .catch((err: unknown) => {
        if (!ignore) {
          setState((current) => ({
            ...current,
            error: err instanceof Error ? err.message : 'Could not load stats',
          }))
        }
      })
    return () => {
      ignore = true
    }
  }, [applications])

  const { stats, error } = state

  return (
    <section
      aria-labelledby="stats-heading"
      className="mt-8 space-y-4 rounded-xl border border-slate-200 bg-white p-6 shadow-sm"
    >
      <h2 id="stats-heading" className="text-xl font-semibold text-slate-900">
        Your stats
      </h2>

      {error && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}

      {stats === null ? (
        error === null && <p className="text-sm text-slate-600">Loading stats...</p>
      ) : stats.totals.applications === 0 ? (
        <p className="text-sm text-slate-600">Add your first application to start seeing stats.</p>
      ) : (
        <>
          <Overview stats={stats} />
          <div className="border-t border-slate-200 pt-4">
            <SkillFrequencyChart skills={stats.skills} extractedApplications={stats.extractedApplications} />
          </div>
          <div className="grid gap-8 border-t border-slate-200 pt-4 lg:grid-cols-2">
            <ApplicationFunnel funnel={stats.funnel} dropOff={stats.dropOff} />
            <SourceTable sources={stats.sources} />
          </div>
          <div className="border-t border-slate-200 pt-4">
            <StageTimings stageDurations={stats.stageDurations} />
          </div>
          <div className="border-t border-slate-200 pt-4">
            <ActivityChart weeks={stats.weeklyApplications} />
          </div>
        </>
      )}
    </section>
  )
}

export default StatsPanel
