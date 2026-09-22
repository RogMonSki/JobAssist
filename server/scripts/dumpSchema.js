const { execFileSync } = require('child_process')
const path = require('path')
const config = require('../config')

const outFile = path.join(__dirname, '..', 'schema.sql')

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
