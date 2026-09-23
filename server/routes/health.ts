import express from 'express'
import pool from '../db.js'

const router = express.Router()

router.get('/health', async (req, res) => {
  try {
    const result = await pool.query<{ now: Date }>('SELECT NOW()')
    res.json({ status: 'ok', dbTime: result.rows[0].now })
  } catch (err) {
    console.error(err)
    res.status(500).json({ status: 'error', message: 'Database unavailable' })
  }
})

export default router
