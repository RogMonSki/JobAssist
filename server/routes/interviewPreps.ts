import express from 'express'
import rateLimit from 'express-rate-limit'
import pool from '../db.js'
import requireAuth from '../middleware/requireAuth.js'
import { prepareForInterview, type InterviewGuidance } from '../llm.js'
import { parseIdValue } from './params.js'

const router = express.Router()
router.use(requireAuth)

const MAX_HISTORY_ITEMS = 100

interface PrepRow {
  id: number
  application_id: number | null
  job_title: string
  company: string
  guidance: InterviewGuidance
  created_at: string
}

interface PublicPrep {
  id: number
  applicationId: number | null
  jobTitle: string
  company: string
  guidance: InterviewGuidance
  createdAt: string
}

const PREP_COLUMNS = 'id, application_id, job_title, company, guidance, created_at'

function toPublicPrep(row: PrepRow): PublicPrep {
  return {
    id: row.id,
    applicationId: row.application_id,
    jobTitle: row.job_title,
    company: row.company,
    guidance: row.guidance,
    createdAt: row.created_at,
  }
}

const prepLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => String(req.userId),
  message: { message: 'Too many interview prep requests. Try again later.' },
})

router.get('/', async (req, res) => {
  try {
    const result = await pool.query<PrepRow>(
      `SELECT ${PREP_COLUMNS} FROM interview_preps
       WHERE user_id = $1
       ORDER BY created_at DESC, id DESC
       LIMIT $2`,
      [req.userId, MAX_HISTORY_ITEMS]
    )
    res.json(result.rows.map(toPublicPrep))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load interview prep history' })
  }
})

router.get('/count', async (req, res) => {
  try {
    const result = await pool.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM interview_preps WHERE user_id = $1',
      [req.userId]
    )
    res.json({ count: result.rows[0].count })
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load interview prep history' })
  }
})

router.post('/', prepLimiter, async (req, res) => {
  const body: unknown = req.body
  const applicationId =
    typeof body === 'object' && body !== null && 'applicationId' in body ? parseIdValue(body.applicationId) : null
  if (applicationId === null) {
    return res.status(404).json({ message: 'Application not found' })
  }

  try {
    const found = await pool.query<{
      title: string
      company: string
      status: string
      job_description: string | null
    }>('SELECT title, company, status, job_description FROM applications WHERE id = $1 AND user_id = $2', [
      applicationId,
      req.userId,
    ])
    const application = found.rows[0]
    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }
    if (application.status !== 'interview') {
      return res
        .status(400)
        .json({ message: 'Interview prep is only available for applications in the interview stage' })
    }
    if (application.job_description === null) {
      return res
        .status(400)
        .json({ message: 'This application has no job description. Add one on the dashboard first.' })
    }

    let guidance: InterviewGuidance
    try {
      guidance = await prepareForInterview({
        title: application.title,
        company: application.company,
        jobDescription: application.job_description,
      })
    } catch (err) {
      console.error('Interview prep failed', err)
      return res.status(502).json({ message: 'The guidance could not be generated. Please try again.' })
    }

    const inserted = await pool.query<PrepRow>(
      `INSERT INTO interview_preps (user_id, application_id, job_title, company, guidance)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING ${PREP_COLUMNS}`,
      [req.userId, applicationId, application.title, application.company, guidance]
    )
    res.status(201).json(toPublicPrep(inserted.rows[0]))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not generate interview prep' })
  }
})

export default router
