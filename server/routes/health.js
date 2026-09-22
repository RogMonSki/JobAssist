const express = require('express')
const pool = require('../db')

const router = express.Router()

router.get('/health', async (req, res) => {
  try {
    const result = await pool.query('SELECT NOW()')
    res.json({ status: 'ok', dbTime: result.rows[0].now })
  } catch (err) {
    console.error(err)
    res.status(500).json({ status: 'error', message: 'Database unavailable' })
  }
})

module.exports = router
