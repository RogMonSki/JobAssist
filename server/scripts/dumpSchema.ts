import { execFileSync } from 'node:child_process'
import path from 'node:path'
import config from '../config.js'

const outFile = path.join(import.meta.dirname, '..', 'schema.sql')

execFileSync(
  'pg_dump',
  [
    '--schema-only',
    '--no-owner',
    '--no-privileges',
    '--exclude-table=pgmigrations',
    '--exclude-table=pgmigrations_id_seq',
    config.databaseUrl,
    '-f',
    outFile,
  ],
  { stdio: 'inherit' }
)

console.log(`Schema written to ${outFile}`)
