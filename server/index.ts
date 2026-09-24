import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import config from './config.js'
import healthRouter from './routes/health.js'
import authRouter from './routes/auth.js'
import applicationsRouter from './routes/applications.js'

const app = express()

app.use(cors())
app.use(express.json())
app.use(cookieParser())

app.use('/api', healthRouter)
app.use('/api/auth', authRouter)
app.use('/api/applications', applicationsRouter)

app.listen(config.port, () => console.log(`Server running on port ${config.port}`))
