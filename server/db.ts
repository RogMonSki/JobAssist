import { Pool, types, type PoolClient } from 'pg'
import config from './config.js'

const PG_TYPE_DATE = 1082
types.setTypeParser(PG_TYPE_DATE, (value) => value)

const pool = new Pool({ connectionString: config.databaseUrl })

export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await pool.connect()
  try {
    await client.query('BEGIN')
    const result = await fn(client)
    await client.query('COMMIT')
    client.release()
    return result
  } catch (err) {
    await client.query('ROLLBACK').catch(() => undefined)
    client.release(err instanceof Error ? err : new Error(String(err)))
    throw err
  }
}

export default pool
