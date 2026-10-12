import express from 'express'
import multer from 'multer'
import rateLimit from 'express-rate-limit'
import pool from '../db.js'
import requireAuth from '../middleware/requireAuth.js'
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

interface CvRow {
  id: number
  file_name: string
  mime_type: CvMimeType
  size_bytes: number
  text_extraction_status: TextExtractionStatus
  uploaded_at: string
}

interface PublicCv {
  id: number
  fileName: string
  mimeType: CvMimeType
  sizeBytes: number
  textExtractionStatus: TextExtractionStatus
  uploadedAt: string
}

const CV_COLUMNS = 'id, file_name, mime_type, size_bytes, text_extraction_status, uploaded_at'

function toPublicCv(row: CvRow): PublicCv {
  return {
    id: row.id,
    fileName: row.file_name,
    mimeType: row.mime_type,
    sizeBytes: row.size_bytes,
    textExtractionStatus: row.text_extraction_status,
    uploadedAt: row.uploaded_at,
  }
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

  try {
    const result = await pool.query<CvRow>(
      `INSERT INTO cvs (user_id, file_name, mime_type, size_bytes, file_data, extracted_text, text_extraction_status)
       SELECT $1::int, $2::text, $3::text, $4::int, $5::bytea, $6::text, $7::text
       WHERE (SELECT COUNT(*) FROM cvs WHERE user_id = $1::int) < $8::int
       RETURNING ${CV_COLUMNS}`,
      [
        req.userId,
        sanitiseFileName(file.originalname, type),
        type,
        file.size,
        file.buffer,
        text === '' ? null : text,
        text === '' ? 'failed' : 'success',
        MAX_CVS_PER_USER,
      ]
    )
    const row = result.rows[0]
    if (!row) {
      return res
        .status(409)
        .json({ message: `You can store up to ${MAX_CVS_PER_USER} CVs. Delete one to upload another.` })
    }
    res.status(201).json(toPublicCv(row))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not upload CV' })
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
    const result = await pool.query('DELETE FROM cvs WHERE id = $1 AND user_id = $2', [id, req.userId])
    if (result.rowCount === 0) {
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
