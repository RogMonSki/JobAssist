import type { Pool } from 'pg'

export type Status = 'saved' | 'applied' | 'interview' | 'offer' | 'rejected'

export interface StatusEvent {
  status: Status
  changedAt: Date
}

const PIPELINE = ['saved', 'applied', 'interview', 'offer'] as const
type Stage = (typeof PIPELINE)[number]

const TIMED_STAGES = ['saved', 'applied', 'interview'] as const
type TimedStage = (typeof TIMED_STAGES)[number]

const DAY_MS = 24 * 60 * 60 * 1000
const AWAITING_REPLY_AFTER_DAYS = 14

export interface StageTiming {
  medianDays: number | null
  sampleSize: number
}

export interface StatusSummary {
  funnel: Record<Stage, number>
  dropOff: Record<Stage, number>
  stageDurations: Record<TimedStage, StageTiming>
  awaitingReply: number
}

function isTimedStage(status: Status): status is TimedStage {
  return (TIMED_STAGES as readonly Status[]).includes(status)
}

function median(values: number[]): number | null {
  if (values.length === 0) {
    return null
  }
  const sorted = [...values].sort((a, b) => a - b)
  const middle = Math.floor(sorted.length / 2)
  return sorted.length % 2 === 0 ? (sorted[middle - 1] + sorted[middle]) / 2 : sorted[middle]
}

function toTiming(days: number[]): StageTiming {
  return { medianDays: median(days), sampleSize: days.length }
}

function highestStageIndex(events: StatusEvent[]): number {
  return Math.max(0, ...events.map((event) => PIPELINE.findIndex((stage) => stage === event.status)))
}

function zeroCounts(): Record<Stage, number> {
  return { saved: 0, applied: 0, interview: 0, offer: 0 }
}

function isAwaitingReply(current: StatusEvent | undefined, now: Date): boolean {
  return (
    current?.status === 'applied' &&
    now.getTime() - current.changedAt.getTime() > AWAITING_REPLY_AFTER_DAYS * DAY_MS
  )
}

export function summariseStatusHistory(histories: StatusEvent[][], now: Date): StatusSummary {
  const funnel = zeroCounts()
  const dropOff = zeroCounts()
  const stays: Record<TimedStage, number[]> = { saved: [], applied: [], interview: [] }
  let awaitingReply = 0

  for (const events of histories) {
    const highest = highestStageIndex(events)
    for (const stage of PIPELINE.slice(0, highest + 1)) {
      funnel[stage] += 1
    }
    const current = events.at(-1)
    if (current?.status === 'rejected') {
      dropOff[PIPELINE[highest]] += 1
    }
    if (isAwaitingReply(current, now)) {
      awaitingReply += 1
    }

    for (let i = 0; i < events.length - 1; i++) {
      const { status, changedAt } = events[i]
      if (isTimedStage(status)) {
        stays[status].push((events[i + 1].changedAt.getTime() - changedAt.getTime()) / DAY_MS)
      }
    }
  }

  return {
    funnel,
    dropOff,
    stageDurations: {
      saved: toTiming(stays.saved),
      applied: toTiming(stays.applied),
      interview: toTiming(stays.interview),
    },
    awaitingReply,
  }
}

export interface SkillFrequency {
  name: string
  requiredCount: number
  niceToHaveCount: number
}

export interface SourceStats {
  source: string | null
  applications: number
  applied: number
  replied: number
}

export interface WeeklyCount {
  weekStart: string
  count: number
}

export interface ExperienceStats {
  medianYears: number | null
  minYears: number | null
  maxYears: number | null
  sampleSize: number
}

export interface Stats extends StatusSummary {
  totals: { applications: number; applied: number; replied: number }
  extractedApplications: number
  skills: SkillFrequency[]
  sources: SourceStats[]
  weeklyApplications: WeeklyCount[]
  experience: ExperienceStats
}

type Db = Pick<Pool, 'query'>

const TOP_SKILLS = 15
const ACTIVITY_WEEKS = 12

async function getStatusEvents(db: Db, userId: number): Promise<StatusEvent[][]> {
  const result = await db.query<{ application_id: number; status: Status; changed_at: Date }>(
    `SELECT sh.application_id, sh.status, sh.changed_at
     FROM status_history sh
     JOIN applications a ON a.id = sh.application_id
     WHERE a.user_id = $1
     ORDER BY sh.application_id, sh.changed_at, sh.id`,
    [userId]
  )

  const byApplication = new Map<number, StatusEvent[]>()
  for (const row of result.rows) {
    const events = byApplication.get(row.application_id) ?? []
    events.push({ status: row.status, changedAt: row.changed_at })
    byApplication.set(row.application_id, events)
  }
  return [...byApplication.values()]
}

async function getSkillFrequency(db: Db, userId: number): Promise<SkillFrequency[]> {
  const result = await db.query<{ name: string; required_count: number; nice_to_have_count: number }>(
    `SELECT s.canonical_name AS name,
            (COUNT(*) FILTER (WHERE ask.importance = 'required'))::int AS required_count,
            (COUNT(*) FILTER (WHERE ask.importance = 'nice_to_have'))::int AS nice_to_have_count
     FROM application_skills ask
     JOIN applications a ON a.id = ask.application_id
     JOIN skills s ON s.id = ask.skill_id
     WHERE a.user_id = $1 AND a.extraction_status = 'success'
     GROUP BY s.id, s.canonical_name
     ORDER BY COUNT(*) DESC, required_count DESC, s.canonical_name
     LIMIT $2`,
    [userId, TOP_SKILLS]
  )
  return result.rows.map((row) => ({
    name: row.name,
    requiredCount: row.required_count,
    niceToHaveCount: row.nice_to_have_count,
  }))
}

async function getExtractedApplicationCount(db: Db, userId: number): Promise<number> {
  const result = await db.query<{ count: number }>(
    `SELECT COUNT(*)::int AS count FROM applications
     WHERE user_id = $1 AND extraction_status = 'success'`,
    [userId]
  )
  return result.rows[0].count
}

async function getSourceStats(db: Db, userId: number): Promise<SourceStats[]> {
  const result = await db.query<SourceStats>(
    `SELECT MIN(NULLIF(btrim(a.source_website), '')) AS source,
            COUNT(*)::int AS applications,
            (COUNT(*) FILTER (WHERE h.reached_applied))::int AS applied,
            (COUNT(*) FILTER (WHERE h.reached_applied AND h.got_reply))::int AS replied
     FROM applications a
     CROSS JOIN LATERAL (
       SELECT COALESCE(bool_or(status IN ('applied', 'interview', 'offer')), false) AS reached_applied,
              COALESCE(bool_or(status IN ('interview', 'offer', 'rejected')), false) AS got_reply
       FROM status_history
       WHERE application_id = a.id
     ) h
     WHERE a.user_id = $1
     GROUP BY lower(btrim(COALESCE(a.source_website, '')))
     ORDER BY applications DESC, source NULLS LAST`,
    [userId]
  )
  return result.rows
}

async function getWeeklyApplications(db: Db, userId: number): Promise<WeeklyCount[]> {
  const result = await db.query<{ week_start: string; count: number }>(
    `WITH weeks AS (
       SELECT generate_series(
                date_trunc('week', CURRENT_DATE::timestamp) - make_interval(weeks => $2::int - 1),
                date_trunc('week', CURRENT_DATE::timestamp),
                interval '1 week'
              )::date AS week_start
     ), applied_days AS (
       SELECT COALESCE(
                a.applied_on,
                (SELECT MIN(sh.changed_at)::date FROM status_history sh
                 WHERE sh.application_id = a.id AND sh.status IN ('applied', 'interview', 'offer'))
              ) AS day
       FROM applications a
       WHERE a.user_id = $1
     )
     SELECT w.week_start::text AS week_start, COUNT(d.day)::int AS count
     FROM weeks w
     LEFT JOIN applied_days d ON date_trunc('week', d.day::timestamp)::date = w.week_start
     GROUP BY w.week_start
     ORDER BY w.week_start`,
    [userId, ACTIVITY_WEEKS]
  )
  return result.rows.map((row) => ({ weekStart: row.week_start, count: row.count }))
}

async function getExperienceStats(db: Db, userId: number): Promise<ExperienceStats> {
  const result = await db.query<{
    median_years: number | null
    min_years: number | null
    max_years: number | null
    sample_size: number
  }>(
    `SELECT percentile_cont(0.5) WITHIN GROUP (ORDER BY years) AS median_years,
            MIN(years) AS min_years,
            MAX(years) AS max_years,
            COUNT(*)::int AS sample_size
     FROM (
       SELECT (jd_extraction->>'minYearsExperience')::float8 AS years
       FROM applications
       WHERE user_id = $1
         AND extraction_status = 'success'
         AND jd_extraction->>'minYearsExperience' IS NOT NULL
     ) t`,
    [userId]
  )
  const row = result.rows[0]
  return {
    medianYears: row.median_years,
    minYears: row.min_years,
    maxYears: row.max_years,
    sampleSize: row.sample_size,
  }
}

export async function getStats(db: Db, userId: number): Promise<Stats> {
  const [histories, skills, extractedApplications, sources, weeklyApplications, experience] = await Promise.all([
    getStatusEvents(db, userId),
    getSkillFrequency(db, userId),
    getExtractedApplicationCount(db, userId),
    getSourceStats(db, userId),
    getWeeklyApplications(db, userId),
    getExperienceStats(db, userId),
  ])

  const sum = (pick: (source: SourceStats) => number) => sources.reduce((total, source) => total + pick(source), 0)

  return {
    ...summariseStatusHistory(histories, new Date()),
    totals: {
      applications: sum((source) => source.applications),
      applied: sum((source) => source.applied),
      replied: sum((source) => source.replied),
    },
    extractedApplications,
    skills,
    sources,
    weeklyApplications,
    experience,
  }
}
