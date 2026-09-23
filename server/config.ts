import 'dotenv/config'

const REQUIRED_ENV_VARS = ['DATABASE_URL', 'JWT_SECRET']

const missing = REQUIRED_ENV_VARS.filter((name) => !process.env[name])

if (missing.length > 0) {
  throw new Error(
    `Missing required environment variable(s): ${missing.join(', ')}. Check server/.env.`
  )
}

function requireEnv(name: string): string {
  const value = process.env[name]
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`)
  }
  return value
}

export default {
  port: process.env.PORT || 3001,
  databaseUrl: requireEnv('DATABASE_URL'),
  jwtSecret: requireEnv('JWT_SECRET'),
  isProd: process.env.NODE_ENV === 'production',
}
