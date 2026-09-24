import express from 'express'
import pool, { withTransaction } from '../db.js'
import requireAuth from '../middleware/requireAuth.js'

const router = express.Router()
router.use(requireAuth)

const STATUSES = ['saved', 'applied', 'interview', 'offer', 'rejected'] as const
type Status = (typeof STATUSES)[number]

interface ApplicationRow {
  id: number
  user_id: number
  title: string
  company: string
  recruiter: string | null
  source_website: string | null
  status: Status
  applied_on: string | null
  extraction_status: string
  created_at: string
  updated_at: string
}

interface PublicApplication {
  id: number
  title: string
  company: string
  recruiter: string | null
  sourceWebsite: string | null
  status: Status
  appliedOn: string | null
  extractionStatus: string
  createdAt: string
  updatedAt: string
}

function toPublicApplication(row: ApplicationRow): PublicApplication {
  return {
    id: row.id,
    title: row.title,
    company: row.company,
    recruiter: row.recruiter,
    sourceWebsite: row.source_website,
    status: row.status,
    appliedOn: row.applied_on,
    extractionStatus: row.extraction_status,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

const ID_PATTERN = /^[1-9]\d*$/

function parseId(raw: string): number | null {
  return ID_PATTERN.test(raw) ? Number(raw) : null
}

interface ApplicationInput {
  title?: string
  company?: string
  recruiter?: string | null
  sourceWebsite?: string | null
  status?: Status
  appliedOn?: string | null
}

type ParseResult =
  | { ok: true; value: ApplicationInput }
  | { ok: false; message: string }

const DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/

function parseApplicationInput(body: unknown, { partial }: { partial: boolean }): ParseResult {
  if (typeof body !== 'object' || body === null) {
    return { ok: false, message: 'Invalid request body' }
  }
  const input = body as Record<string, unknown>
  const value: ApplicationInput = {}

  if ('title' in input || !partial) {
    if (typeof input.title !== 'string' || input.title.trim() === '') {
      return { ok: false, message: 'Title is required' }
    }
    value.title = input.title.trim()
  }

  if ('company' in input || !partial) {
    if (typeof input.company !== 'string' || input.company.trim() === '') {
      return { ok: false, message: 'Company is required' }
    }
    value.company = input.company.trim()
  }

  if ('recruiter' in input) {
    if (input.recruiter !== null && typeof input.recruiter !== 'string') {
      return { ok: false, message: 'Recruiter must be a string or null' }
    }
    value.recruiter = input.recruiter === null || input.recruiter.trim() === '' ? null : input.recruiter.trim()
  }

  if ('sourceWebsite' in input) {
    if (input.sourceWebsite !== null && typeof input.sourceWebsite !== 'string') {
      return { ok: false, message: 'Source website must be a string or null' }
    }
    value.sourceWebsite =
      input.sourceWebsite === null || input.sourceWebsite.trim() === '' ? null : input.sourceWebsite.trim()
  }

  if ('status' in input) {
    if (typeof input.status !== 'string' || !STATUSES.includes(input.status as Status)) {
      return { ok: false, message: `Status must be one of: ${STATUSES.join(', ')}` }
    }
    value.status = input.status as Status
  }

  if ('appliedOn' in input) {
    if (input.appliedOn !== null && (typeof input.appliedOn !== 'string' || !DATE_PATTERN.test(input.appliedOn))) {
      return { ok: false, message: 'Applied date must be in YYYY-MM-DD format or null' }
    }
    value.appliedOn = input.appliedOn
  }

  return { ok: true, value }
}

router.get('/', async (req, res) => {
  try {
    const result = await pool.query<ApplicationRow>(
      'SELECT * FROM applications WHERE user_id = $1 ORDER BY updated_at DESC',
      [req.userId]
    )
    res.json(result.rows.map(toPublicApplication))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load applications' })
  }
})

router.post('/', async (req, res) => {
  const parsed = parseApplicationInput(req.body, { partial: false })
  if (!parsed.ok) {
    return res.status(400).json({ message: parsed.message })
  }
  const { title, company, recruiter, sourceWebsite, appliedOn } = parsed.value
  const status = parsed.value.status ?? 'saved'

  try {
    const application = await withTransaction(async (client) => {
      const insertResult = await client.query<ApplicationRow>(
        `INSERT INTO applications (user_id, title, company, recruiter, source_website, status, applied_on)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [req.userId, title, company, recruiter ?? null, sourceWebsite ?? null, status, appliedOn ?? null]
      )
      const row = insertResult.rows[0]

      await client.query(
        'INSERT INTO status_history (application_id, status) VALUES ($1, $2)',
        [row.id, row.status]
      )

      return row
    })

    res.status(201).json(toPublicApplication(application))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not create application' })
  }
})

router.get('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    return res.status(404).json({ message: 'Application not found' })
  }

  try {
    const result = await pool.query<ApplicationRow>(
      'SELECT * FROM applications WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    )
    const application = result.rows[0]
    if (!application) {
      return res.status(404).json({ message: 'Application not found' })
    }
    res.json(toPublicApplication(application))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load application' })
  }
})

class NotFoundError extends Error {}

const COLUMN_NAMES: Record<keyof ApplicationInput, string> = {
  title: 'title',
  company: 'company',
  recruiter: 'recruiter',
  sourceWebsite: 'source_website',
  status: 'status',
  appliedOn: 'applied_on',
}

router.patch('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    return res.status(404).json({ message: 'Application not found' })
  }

  const parsed = parseApplicationInput(req.body, { partial: true })
  if (!parsed.ok) {
    return res.status(400).json({ message: parsed.message })
  }
  const fields = Object.entries(parsed.value) as [keyof ApplicationInput, string | null][]
  if (fields.length === 0) {
    return res.status(400).json({ message: 'No fields to update' })
  }

  try {
    const application = await withTransaction(async (client) => {
      const currentResult = await client.query<Pick<ApplicationRow, 'status'>>(
        'SELECT status FROM applications WHERE id = $1 AND user_id = $2 FOR UPDATE',
        [id, req.userId]
      )
      const current = currentResult.rows[0]
      if (!current) {
        throw new NotFoundError()
      }

      const setClauses = fields.map(([key], index) => `${COLUMN_NAMES[key]} = $${index + 1}`)
      const values = fields.map(([, value]) => value)

      const updateResult = await client.query<ApplicationRow>(
        `UPDATE applications
         SET ${setClauses.join(', ')}, updated_at = NOW()
         WHERE id = $${fields.length + 1} AND user_id = $${fields.length + 2}
         RETURNING *`,
        [...values, id, req.userId]
      )
      const row = updateResult.rows[0]

      if (parsed.value.status && parsed.value.status !== current.status) {
        await client.query(
          'INSERT INTO status_history (application_id, status) VALUES ($1, $2)',
          [row.id, row.status]
        )
      }

      return row
    })

    res.json(toPublicApplication(application))
  } catch (err) {
    if (err instanceof NotFoundError) {
      return res.status(404).json({ message: 'Application not found' })
    }
    console.error(err)
    res.status(500).json({ message: 'Could not update application' })
  }
})

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    return res.status(404).json({ message: 'Application not found' })
  }

  try {
    const result = await pool.query('DELETE FROM applications WHERE id = $1 AND user_id = $2', [
      id,
      req.userId,
    ])
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Application not found' })
    }
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not delete application' })
  }
})

export default router
