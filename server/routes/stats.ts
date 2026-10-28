import express from 'express'
import pool from '../db.js'
import requireAuth from '../middleware/requireAuth.js'
import { getStats } from '../stats.js'

const router = express.Router()
router.use(requireAuth)

router.get('/', async (req, res) => {
  if (req.userId === undefined) {
    return res.status(401).json({ message: 'Not logged in' })
  }

  try {
    res.json(await getStats(pool, req.userId))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load stats' })
  }
})

export default router
