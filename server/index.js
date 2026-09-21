const express = require('express')
const cors = require('cors')
require('dotenv').config()
const { Pool } = require('pg')

const app = express()
const pool = new Pool({ connectionString: process.env.DATABASE_URL })

app.use(cors())
app.use(express.json())

app.get('/api/health', async (req, res) => {
    try {
      const result = await pool.query('SELECT NOW()')
      res.json({ status: 'ok', dbTime: result.rows[0].now })
    } catch (err) {
      console.error(err)
      res.status(500).json({ status: 'error', message: 'Database unavailable' })
    }
})

const PORT = process.env.PORT || 3001
app.listen(PORT, () => console.log(`Server running on port ${PORT}`))