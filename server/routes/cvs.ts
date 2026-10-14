import express from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import type { PoolClient } from 'pg'
import pool, { withTransaction } from '../db.js'
import requireAuth from '../middleware/requireAuth.js'
import { analyseCv, type CvExtraction } from '../llm.js'
import {
  MAX_CV_BYTES,
  CvParseError,
  detectCvType,
  extractCvText,
  sanitiseFileName,
  type CvMimeType,
} from '../cvFiles.js'
import { parseId } from './params.js'

const router = express.Router()
router.use(requireAuth)

const MAX_CVS_PER_USER = 10

type TextExtractionStatus = 'success' | 'failed'
type SkillsExtractionStatus = 'not_attempted' | 'success' | 'failed'

interface CvRow {
  id: number
  file_name: string
  mime_type: CvMimeType
  size_bytes: number
  text_extraction_status: TextExtractionStatus
  uploaded_at: string
  is_primary: boolean
  skills_extraction: CvExtraction | null
  skills_extraction_status: SkillsExtractionStatus
}

interface PublicCv {
  id: number
  fileName: string
  mimeType: CvMimeType
  sizeBytes: number
  textExtractionStatus: TextExtractionStatus
  uploadedAt: string
  isPrimary: boolean
  skillsExtraction: CvExtraction | null
  skillsExtractionStatus: SkillsExtractionStatus
}

const CV_COLUMNS = `id, file_name, mime_type, size_bytes, text_extraction_status, uploaded_at,
  is_primary, skills_extraction, skills_extraction_status`

function toPublicCv(row: CvRow): PublicCv {
  return {
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    textExtractionStatus: row.text_extraction_status,
    uploadedAt: row.uploaded_at,
    isPrimary: row.is_primary,
    skillsExtraction: row.skills_extraction,
    skillsExtractionStatus: row.skills_extraction_status,
  }
}

async function lockUserCvs(client: PoolClient, userId: number | undefined): Promise<void> {
  await client.query('SELECT 1 FROM users WHERE id = $1 FOR NO KEY UPDATE', [userId])
}

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_CV_BYTES, files: 1 },
  defParamCharset: 'utf8',
})

const uploadLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyGenerator: (req) => String(req.userId),
  message: { message: 'Too many uploads. Try again later.' },
})

router.get('/', async (req, res) => {
  try {
    const result = await pool.query<CvRow>(
      `SELECT ${CV_COLUMNS} FROM cvs WHERE user_id = $1 ORDER BY uploaded_at, id`,
      [req.userId]
    )
    res.json(result.rows.map(toPublicCv))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load CVs' })
  }
})

router.post('/', uploadLimiter, upload.single('file'), async (req, res) => {
  const file = req.file
  if (!file) {
    return res.status(400).json({ message: 'Choose a file to upload' })
  }

  const type = detectCvType(file.buffer, file.originalname)
  if (!type) {
    return res.status(400).json({
      message: 'Unsupported file. Upload a PDF, DOCX or TXT file whose name ends in .pdf, .docx or .txt',
    })
  }

  let text: string
  try {
    text = await extractCvText(file.buffer, type)
  } catch (err) {
    if (err instanceof CvParseError) {
      return res.status(400).json({ message: 'That file could not be read. It may be corrupt.' })
    }
    console.error(err)
    return res.status(500).json({ message: 'Could not upload CV' })
  }

  const limitMessage = `You can store up to ${MAX_CVS_PER_USER} CVs. Delete one to upload another.`

  try {
    const count = await pool.query<{ count: number }>(
      'SELECT COUNT(*)::int AS count FROM cvs WHERE user_id = $1',
      [req.userId]
    )
    if (count.rows[0].count >= MAX_CVS_PER_USER) {
      return res.status(409).json({ message: limitMessage })
    }

    let extraction: CvExtraction | null = null
    let skillsStatus: SkillsExtractionStatus = 'not_attempted'
    if (text !== '') {
      try {
        extraction = await analyseCv(text)
        skillsStatus = 'success'
      } catch (err) {
        console.error('CV skills extraction failed', err)
        skillsStatus = 'failed'
      }
    }

    const row = await withTransaction(async (client) => {
      await lockUserCvs(client, req.userId)
      const result = await client.query<CvRow>(
        `INSERT INTO cvs (
           user_id, file_name, mime_type, size_bytes, file_data, extracted_text,
           text_extraction_status, skills_extraction, skills_extraction_status, is_primary
         )
         SELECT $1::int, $2::text, $3::text, $4::int, $5::bytea, $6::text, $7::text, $8::jsonb, $9::text,
                NOT EXISTS (SELECT 1 FROM cvs WHERE user_id = $1::int)
         WHERE (SELECT COUNT(*) FROM cvs WHERE user_id = $1::int) < $10::int
         RETURNING ${CV_COLUMNS}`,
        [
          req.userId,
          sanitiseFileName(file.originalname, type),
          type,
          file.size,
          file.buffer,
          text === '' ? null : text,
          text === '' ? 'failed' : 'success',
          extraction,
          skillsStatus,
          MAX_CVS_PER_USER,
        ]
      )
      return result.rows[0]
    })
    if (!row) {
      return res.status(409).json({ message: limitMessage })
    }
    res.status(201).json(toPublicCv(row))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not upload CV' })
  }
})

router.put('/:id/primary', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    return res.status(404).json({ message: 'CV not found' })
  }

  try {
    const row = await withTransaction(async (client) => {
      await lockUserCvs(client, req.userId)
      const found = await client.query<CvRow>(
        `SELECT ${CV_COLUMNS} FROM cvs WHERE id = $1 AND user_id = $2`,
        [id, req.userId]
      )
      const cv = found.rows[0]
      if (!cv || cv.is_primary) {
        return cv
      }
      await client.query('UPDATE cvs SET is_primary = false WHERE user_id = $1 AND is_primary', [req.userId])
      const updated = await client.query<CvRow>(
        `UPDATE cvs SET is_primary = true WHERE id = $1 AND user_id = $2 RETURNING ${CV_COLUMNS}`,
        [id, req.userId]
      )
      return updated.rows[0]
    })
    if (!row) {
      return res.status(404).json({ message: 'CV not found' })
    }
    res.json(toPublicCv(row))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not set primary CV' })
  }
})

const skillsExtractionLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  keyGenerator: (req) => String(req.userId),
  message: { message: 'Too many extraction requests. Try again later.' },
})

router.use('/:id/extract-skills', skillsExtractionLimiter)

router.post('/:id/extract-skills', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    return res.status(404).json({ message: 'CV not found' })
  }

  try {
    const found = await pool.query<CvRow & { extracted_text: string | null }>(
      `SELECT ${CV_COLUMNS}, extracted_text FROM cvs WHERE id = $1 AND user_id = $2`,
      [id, req.userId]
    )
    const cv = found.rows[0]
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' })
    }
    if (cv.skills_extraction_status === 'success') {
      return res.json(toPublicCv(cv))
    }
    if (cv.extracted_text === null) {
      return res.status(400).json({ message: 'No text could be read from this CV' })
    }

    let extraction: CvExtraction | null = null
    let skillsStatus: SkillsExtractionStatus = 'success'
    try {
      extraction = await analyseCv(cv.extracted_text)
    } catch (err) {
      console.error('CV skills extraction failed', err)
      skillsStatus = 'failed'
    }

    const updated = await pool.query<CvRow>(
      `UPDATE cvs SET skills_extraction = $1, skills_extraction_status = $2
       WHERE id = $3 AND user_id = $4
       RETURNING ${CV_COLUMNS}`,
      [extraction, skillsStatus, id, req.userId]
    )
    const row = updated.rows[0]
    if (!row) {
      return res.status(404).json({ message: 'CV not found' })
    }
    res.json(toPublicCv(row))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not extract skills' })
  }
})

router.get('/:id/file', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    return res.status(404).json({ message: 'CV not found' })
  }

  try {
    const result = await pool.query<Pick<CvRow, 'file_name' | 'mime_type'> & { file_data: Buffer }>(
      'SELECT file_name, mime_type, file_data FROM cvs WHERE id = $1 AND user_id = $2',
      [id, req.userId]
    )
    const cv = result.rows[0]
    if (!cv) {
      return res.status(404).json({ message: 'CV not found' })
    }

    res.attachment(cv.file_name)
    if (req.query.download !== '1') {
      const disposition = String(res.getHeader('Content-Disposition'))
      res.setHeader('Content-Disposition', disposition.replace(/^attachment/, 'inline'))
    }
    res.type(cv.mime_type === 'text/plain' ? 'text/plain; charset=utf-8' : cv.mime_type)
    res.setHeader('X-Content-Type-Options', 'nosniff')
    res.setHeader('Cache-Control', 'private, no-store')
    res.send(cv.file_data)
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load CV' })
  }
})

router.delete('/:id', async (req, res) => {
  const id = parseId(req.params.id)
  if (id === null) {
    return res.status(404).json({ message: 'CV not found' })
  }

  try {
    const deleted = await withTransaction(async (client) => {
      await lockUserCvs(client, req.userId)
      const result = await client.query<{ is_primary: boolean }>(
        'DELETE FROM cvs WHERE id = $1 AND user_id = $2 RETURNING is_primary',
        [id, req.userId]
      )
      const row = result.rows[0]
      if (row?.is_primary) {
        await client.query(
          `UPDATE cvs SET is_primary = true
           WHERE id = (SELECT id FROM cvs WHERE user_id = $1 ORDER BY uploaded_at DESC, id DESC LIMIT 1)`,
          [req.userId]
        )
      }
      return row !== undefined
    })
    if (!deleted) {
      return res.status(404).json({ message: 'CV not found' })
    }
    res.status(204).end()
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not delete CV' })
  }
})

const handleUploadError: express.ErrorRequestHandler = (err, _req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res
        .status(413)
        .json({ message: `File is too large. The limit is ${MAX_CV_BYTES / (1024 * 1024)} MB` })
    }
    return res.status(400).json({ message: 'Invalid upload' })
  }
  next(err)
}

router.use(handleUploadError)

export default router
