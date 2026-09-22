require('dotenv').config()

const required = ['DATABASE_URL', 'JWT_SECRET']
const missing = required.filter((name) => !process.env[name])

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}. Check server/.env.`
  )
}

module.exports = {
  port: process.env.PORT || 3001,
  databaseUrl: process.env.DATABASE_URL,
  jwtSecret: process.env.JWT_SECRET,
  isProd: process.env.NODE_ENV === 'production',
}
