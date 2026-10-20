import type { Pool } from 'pg'

export type EvidenceTier = 'none' | 'limited' | 'full'

export interface SkillGapRow {
  name: string
  applicationCount: number
  requiredCount: number
  inCv: boolean
}

export interface SkillGap {
  applicationCount: number
  tier: EvidenceTier
  skills: SkillGapRow[]
}

const FULL_CONFIDENCE_MIN_APPLICATIONS = 5

export function evidenceTier(applicationCount: number): EvidenceTier {
  if (applicationCount >= FULL_CONFIDENCE_MIN_APPLICATIONS) {
    return 'full'
  }
  return applicationCount >= 1 ? 'limited' : 'none'
}

export async function getSkillGap(
  db: Pick<Pool, 'query'>,
  userId: number,
  cvId: number
): Promise<SkillGap> {
  const [counted, skills] = await Promise.all([
    db.query<{ count: number }>(
      `SELECT COUNT(*)::int AS count FROM applications
       WHERE user_id = $1 AND extraction_status = 'success'`,
      [userId]
    ),
    db.query<{ name: string; application_count: number; required_count: number; in_cv: boolean }>(
      `SELECT s.canonical_name AS name,
              COUNT(*)::int AS application_count,
              (COUNT(*) FILTER (WHERE ask.importance = 'required'))::int AS required_count,
              EXISTS (
                SELECT 1 FROM cv_skills cs
                JOIN cvs c ON c.id = cs.cv_id
                WHERE cs.skill_id = s.id AND cs.cv_id = $2 AND c.user_id = $1
              ) AS in_cv
       FROM application_skills ask
       JOIN applications a ON a.id = ask.application_id
       JOIN skills s ON s.id = ask.skill_id
       WHERE a.user_id = $1 AND a.extraction_status = 'success'
       GROUP BY s.id, s.canonical_name
       ORDER BY application_count DESC, required_count DESC, s.canonical_name`,
      [userId, cvId]
    ),
  ])

  const applicationCount = counted.rows[0].count
  return {
    applicationCount,
    tier: evidenceTier(applicationCount),
    skills: skills.rows.map((row) => ({
      name: row.name,
      applicationCount: row.application_count,
      requiredCount: row.required_count,
      inCv: row.in_cv,
    })),
  }
}
