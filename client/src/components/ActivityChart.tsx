import { useState } from 'react'
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import ChartViewToggle from './ChartViewToggle'
import { CHART_COLORS } from '../chartTheme'
import { formatWeek, pluralise } from '../format'
import type { WeeklyCount } from '../types'

interface ActivityChartProps {
  weeks: WeeklyCount[]
}

const CHART_HEIGHT = 220
const BAR_SIZE = 20
const END_RADIUS = 4

function ActivityTooltip({ active, label, weeks }: { active?: boolean; label?: string | number; weeks: WeeklyCount[] }) {
  const index = weeks.findIndex((week) => week.weekStart === label)
  if (!active || index === -1) {
    return null
  }
  const week = weeks[index]
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-slate-900">
        Week of {formatWeek(week.weekStart)}
        {index === weeks.length - 1 && <span className="font-normal text-slate-500"> (so far)</span>}
      </p>
      <p className="mt-1 flex items-center gap-2 text-slate-600">
        <span className="h-0.5 w-3" style={{ backgroundColor: CHART_COLORS.activity }} />
        <span>
          <strong className="text-slate-900">{week.count}</strong> sent
        </span>
      </p>
    </div>
  )
}

function ActivityTable({ weeks }: { weeks: WeeklyCount[] }) {
  return (
    <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-slate-50">
          <tr className="border-b border-slate-200 text-slate-600">
            <th className="px-3 py-2 font-medium">Week of</th>
            <th className="px-3 py-2 font-medium">Applications sent</th>
          </tr>
        </thead>
        <tbody>
          {weeks.map((week) => (
            <tr key={week.weekStart} className="border-b border-slate-100 last:border-0">
              <td className="px-3 py-2 font-medium text-slate-900">{formatWeek(week.weekStart)}</td>
              <td className="px-3 py-2 text-slate-700">{week.count}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function ActivityChart({ weeks }: ActivityChartProps) {
  const [showTable, setShowTable] = useState(false)
  const total = weeks.reduce((sum, week) => sum + week.count, 0)

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">Applications sent per week</h3>
          <p className="text-sm text-slate-600">
            {pluralise(total, 'application')} sent in the last {weeks.length} weeks.
          </p>
        </div>
        {total > 0 && <ChartViewToggle showTable={showTable} onToggle={() => setShowTable((current) => !current)} />}
      </div>

      {total === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          Nothing sent in this period. Set an application to Applied and it will show up here.
        </p>
      ) : showTable ? (
        <ActivityTable weeks={weeks} />
      ) : (
        <div
          role="img"
          aria-label={`Column chart of applications sent per week over the last ${weeks.length} weeks. The table view lists the same values.`}
          className="mt-3"
        >
          <ResponsiveContainer width="100%" height={CHART_HEIGHT}>
            <BarChart data={weeks} barSize={BAR_SIZE} margin={{ top: 8, right: 8, bottom: 0, left: 0 }}>
              <CartesianGrid vertical={false} stroke={CHART_COLORS.grid} />
              <XAxis
                dataKey="weekStart"
                tickFormatter={formatWeek}
                tickLine={false}
                axisLine={{ stroke: CHART_COLORS.baseline }}
                tick={{ fill: CHART_COLORS.inkMuted, fontSize: 12 }}
              />
              <YAxis
                allowDecimals={false}
                width={28}
                tickLine={false}
                axisLine={false}
                tick={{ fill: CHART_COLORS.inkMuted, fontSize: 12 }}
              />
              <Tooltip
                cursor={{ fill: CHART_COLORS.hover }}
                content={(props) => <ActivityTooltip active={props.active} label={props.label} weeks={weeks} />}
              />
              <Bar
                dataKey="count"
                fill={CHART_COLORS.activity}
                radius={[END_RADIUS, END_RADIUS, 0, 0]}
                isAnimationActive={false}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      )}
    </div>
  )
}

export default ActivityChart
