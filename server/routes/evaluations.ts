import express from 'express'
import rateLimit from 'express-rate-limit'
import pool from '../db.js'
import requireAuth from '../middleware/requireAuth.js'
import { evaluateCv, type CvEvaluation } from '../llm.js'
import { getSkillGap, type EvidenceTier, type SkillGap } from '../skillGap.js'
import { parseId } from './params.js'

const router = express.Router()
router.use(requireAuth)

const MAX_HISTORY_ITEMS = 100

interface EvaluationRow {
  id: number
  cv_id: number | null
  cv_file_name: string
  tier: EvidenceTier
  application_count: number
  skill_gap: SkillGap
  evaluation: CvEvaluation
  created_at: string
}

interface PublicEvaluation {
  id: number
  cvId: number | null
  cvFileName: string
  tier: EvidenceTier
  applicationCount: number
  skillGap: SkillGap
  evaluation: CvEvaluation
  createdAt: string
}

const EVALUATION_COLUMNS =
  'id, cv_id, cv_file_name, tier, application_count, skill_gap, evaluation, created_at'

function toPublicEvaluation(row: EvaluationRow): PublicEvaluation {
  return {
    id: row.id,
    cvId: row.cv_id,
    cvFileName: row.cv_file_name,
    tier: row.tier,
    applicationCount: row.application_count,
    skillGap: row.skill_gap,
    evaluation: row.evaluation,
    createdAt: row.created_at,
  }
}

function parseCvId(value: unknown): number | null {
  if (typeof value === 'number') {
    return parseId(String(value))
  }
  return typeof value === 'string' ? parseId(value) : null
}

const evaluationLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => String(req.userId),
  message: { message: 'Too many evaluations. Try again later.' },
})

router.get('/', async (req, res) => {
  try {
    const result = await pool.query<EvaluationRow>(
      `SELECT ${EVALUATION_COLUMNS} FROM cv_evaluations
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT $2`,
      [req.userId, MAX_HISTORY_ITEMS]
    )
    res.json(result.rows.map(toPublicEvaluation))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load evaluations' })
  }
})

router.get('/skill-gap', async (req, res) => {
  const cvId = parseCvId(req.query.cvId)
  if (cvId === null || req.userId === undefined) {
    return res.status(404).json({ message: 'CV not found' })
  }

  try {
    const owned = await pool.query('SELECT 1 FROM cvs WHERE id = $1 AND user_id = $2', [cvId, req.userId])
    if (owned.rowCount === 0) {
      return res.status(404).json({ message: 'CV not found' })
    }
    res.json(await getSkillGap(pool, req.userId, cvId))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load skill gap' })
  }
})

router.post('/', evaluationLimiter, async (req, res) => {
  const body: unknown = req.body
  const cvId = typeof body === 'object' && body !== null && 'cvId' in body ? parseCvId(body.cvId) : null
  if (cvId === null || req.userId === undefined) {
    return res.status(404).json({ message: 'CV not found' })
  }

  try {
    const found = await pool.query<{
      file_name: string
      extracted_text: string | null
      skills_extraction_status: string
    }>('SELECT file_name, extracted_text, skills_extraction_status FROM cvs WHERE id = $1 AND user_id = $2', [
      cvId,
      req.userId,
    ])
    const cv = found.rows[0]
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' })
    }
    if (cv.extracted_text === null) {
      return res.status(400).json({ message: 'No text could be read from this CV, so it cannot be evaluated' })
    }

    const gap = await getSkillGap(pool, req.userId, cvId)
    if (gap.tier !== 'none' && cv.skills_extraction_status !== 'success') {
      return res.status(400).json({
        message: "This CV's skills have not been extracted yet. Open it on the dashboard and retry the extraction.",
      })
    }

    let evaluation: CvEvaluation
    try {
      evaluation = await evaluateCv({
        cvText: cv.extracted_text,
        tier: gap.tier,
        applicationCount: gap.applicationCount,
        skills: gap.skills,
      })
    } catch (err) {
      console.error('CV evaluation failed', err)
      return res.status(502).json({ message: 'The evaluation could not be generated. Please try again.' })
    }

    const inserted = await pool.query<EvaluationRow>(
      `INSERT INTO cv_evaluations (user_id, cv_id, cv_file_name, tier, application_count, skill_gap, evaluation)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       RETURNING ${EVALUATION_COLUMNS}`,
      [req.userId, cvId, cv.file_name, gap.tier, gap.applicationCount, gap, evaluation]
    )
    res.status(201).json(toPublicEvaluation(inserted.rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not evaluate CV' })
  }
})

export default router
