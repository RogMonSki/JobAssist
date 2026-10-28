import { useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  LabelList,
  Rectangle,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import type { BarShapeProps } from 'recharts'
import ChartViewToggle from './ChartViewToggle'
import { CHART_COLORS } from '../chartTheme'
import { pluralise } from '../format'
import type { SkillFrequency } from '../types'

interface SkillFrequencyChartProps {
  skills: SkillFrequency[]
  extractedApplications: number
}

interface Row extends SkillFrequency {
  total: number
}

const BAR_SIZE = 16
const ROW_HEIGHT = 30
const AXIS_BAND = 32
const SEGMENT_GAP = 2
const END_RADIUS = 4
const MAX_LABEL_CHARS = 24
const CHAR_WIDTH = 6.4
const SMALL_SAMPLE_BELOW = 5

function truncate(name: string): string {
  return name.length > MAX_LABEL_CHARS ? `${name.slice(0, MAX_LABEL_CHARS - 1)}…` : name
}

function segmentShape(rows: Row[], segment: 'required' | 'niceToHave') {
  return function renderSegment({ index, x = 0, y = 0, width = 0, height = 0 }: BarShapeProps) {
    const row = rows[index]
    if (!row || width <= 0) {
      return null
    }
    const isOutermost = segment === 'niceToHave' || row.niceToHaveCount === 0
    const inset = segment === 'niceToHave' && row.requiredCount > 0 ? SEGMENT_GAP : 0
    return (
      <Rectangle
        x={x + inset}
        y={y}
        width={Math.max(width - inset, 0)}
        height={height}
        fill={segment === 'required' ? CHART_COLORS.required : CHART_COLORS.niceToHave}
        radius={isOutermost ? [0, END_RADIUS, END_RADIUS, 0] : 0}
      />
    )
  }
}

function LegendItem({ color, label }: { color: string; label: string }) {
  return (
    <li className="flex items-center gap-2">
      <span className="h-3 w-3 rounded-sm" style={{ backgroundColor: color }} />
      {label}
    </li>
  )
}

function KeyedCount({ color, count, label }: { color: string; count: number; label: string }) {
  return (
    <p className="mt-1 flex items-center gap-2 text-slate-600">
      <span className="h-0.5 w-3" style={{ backgroundColor: color }} />
      <span>
        <strong className="text-slate-900">{count}</strong> {label}
      </span>
    </p>
  )
}

function SkillTooltip({ active, label, rows }: { active?: boolean; label?: string | number; rows: Row[] }) {
  const row = rows.find((candidate) => candidate.name === label)
  if (!active || !row) {
    return null
  }
  return (
    <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs shadow-sm">
      <p className="font-semibold text-slate-900">{row.name}</p>
      <KeyedCount color={CHART_COLORS.required} count={row.requiredCount} label="required" />
      <KeyedCount color={CHART_COLORS.niceToHave} count={row.niceToHaveCount} label="nice to have" />
    </div>
  )
}

function SkillTable({ rows }: { rows: Row[] }) {
  return (
    <div className="mt-3 max-h-80 overflow-y-auto rounded-lg border border-slate-200">
      <table className="w-full border-collapse text-left text-sm">
        <thead className="sticky top-0 bg-slate-50">
          <tr className="border-b border-slate-200 text-slate-600">
            <th className="px-3 py-2 font-medium">Skill</th>
            <th className="px-3 py-2 font-medium">Required in</th>
            <th className="px-3 py-2 font-medium">Nice to have in</th>
            <th className="px-3 py-2 font-medium">Total</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.name} className="border-b border-slate-100 last:border-0">
              <td className="px-3 py-2 font-medium text-slate-900">{row.name}</td>
              <td className="px-3 py-2 text-slate-700">{row.requiredCount}</td>
              <td className="px-3 py-2 text-slate-700">{row.niceToHaveCount}</td>
              <td className="px-3 py-2 text-slate-700">{row.total}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function SkillFrequencyChart({ skills, extractedApplications }: SkillFrequencyChartProps) {
  const [showTable, setShowTable] = useState(false)

  const rows: Row[] = skills.map((skill) => ({ ...skill, total: skill.requiredCount + skill.niceToHaveCount }))
  const labelWidth = Math.max(60, Math.max(0, ...rows.map((row) => truncate(row.name).length)) * CHAR_WIDTH + 12)

  return (
    <div>
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <h3 className="font-semibold text-slate-900">Skills employers ask for</h3>
          {extractedApplications > 0 && (
            <p className="text-sm text-slate-600">
              Based on {pluralise(extractedApplications, 'job description')}
              {extractedApplications < SMALL_SAMPLE_BELOW && ' — a small sample, so treat it as indicative'}.
            </p>
          )}
        </div>
        {rows.length > 0 && (
          <ChartViewToggle showTable={showTable} onToggle={() => setShowTable((current) => !current)} />
        )}
      </div>

      {extractedApplications === 0 ? (
        <p className="mt-2 text-sm text-slate-600">
          Add job descriptions to your applications to see which skills employers ask for most often.
        </p>
      ) : rows.length === 0 ? (
        <p className="mt-2 text-sm text-slate-600">No skills were found in those job descriptions.</p>
      ) : showTable ? (
        <SkillTable rows={rows} />
      ) : (
        <>
          <ul className="mt-3 flex gap-4 text-sm text-slate-600">
            <LegendItem color={CHART_COLORS.required} label="Required" />
            <LegendItem color={CHART_COLORS.niceToHave} label="Nice to have" />
          </ul>
          <div
            role="img"
            aria-label={`Stacked bar chart of the ${rows.length} most requested skills. The table view lists the same values.`}
            className="mt-2"
          >
            <ResponsiveContainer width="100%" height={rows.length * ROW_HEIGHT + AXIS_BAND}>
              <BarChart data={rows} layout="vertical" barSize={BAR_SIZE} margin={{ top: 4, right: 32, bottom: 0, left: 0 }}>
                <CartesianGrid horizontal={false} stroke={CHART_COLORS.grid} />
                <XAxis
                  type="number"
                  allowDecimals={false}
                  domain={[0, 'auto']}
                  tickLine={false}
                  axisLine={{ stroke: CHART_COLORS.baseline }}
                  tick={{ fill: CHART_COLORS.inkMuted, fontSize: 12 }}
                />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={labelWidth}
                  interval={0}
                  tickFormatter={truncate}
                  tickLine={false}
                  axisLine={{ stroke: CHART_COLORS.baseline }}
                  tick={{ fill: CHART_COLORS.inkSecondary, fontSize: 12 }}
                />
                <Tooltip
                  cursor={{ fill: CHART_COLORS.hover }}
                  content={(props) => <SkillTooltip active={props.active} label={props.label} rows={rows} />}
                />
                <Bar
                  dataKey="requiredCount"
                  stackId="skills"
                  fill={CHART_COLORS.required}
                  shape={segmentShape(rows, 'required')}
                  isAnimationActive={false}
                />
                <Bar
                  dataKey="niceToHaveCount"
                  stackId="skills"
                  fill={CHART_COLORS.niceToHave}
                  shape={segmentShape(rows, 'niceToHave')}
                  isAnimationActive={false}
                >
                  <LabelList
                    valueAccessor={(_entry, index) => rows[index]?.total}
                    position="right"
                    fill={CHART_COLORS.inkSecondary}
                    fontSize={12}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </>
      )}
    </div>
  )
}

export default SkillFrequencyChart
