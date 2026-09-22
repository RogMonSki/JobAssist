const express = require('express')
const cors = require('cors')
const cookieParser = require('cookie-parser')
const config = require('./config')
const healthRouter = require('./routes/health')
const authRouter = require('./routes/auth')

const app = express()

app.use(cors())
app.use(express.json())
app.use(cookieParser())

app.use('/api', healthRouter)
app.use('/api/auth', authRouter)

app.listen(config.port, () => console.log(`Server running on port ${config.port}`))
