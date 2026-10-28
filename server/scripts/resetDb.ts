import config from '../config.js'
import pool from '../db.js'

const LOCAL_HOSTS = ['localhost', '127.0.0.1', '[::1]']

function assertLocalDatabase() {
  const { hostname } = new URL(config.databaseUrl)
  if (config.isProd || !LOCAL_HOSTS.includes(hostname)) {
    throw new Error(`Refusing to reset a non-local database (host: ${hostname || 'unknown'})`)
  }
}

async function reset() {
  assertLocalDatabase()
  await pool.query('DROP SCHEMA public CASCADE')
  await pool.query('CREATE SCHEMA public')
  console.log('Dropped and recreated the public schema')
}

reset()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err)
    pool.end()
    process.exit(1)
  })
