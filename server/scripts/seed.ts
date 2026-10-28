import bcrypt from 'bcrypt'
import pool, { withTransaction } from '../db.js'
import { syncApplicationSkills } from '../skills.js'
import { DEMO_APPLICATIONS, type DemoApplication } from './demoApplications.js'

const TEST_USER = {
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  password: 'password123',
}

function describeJob({ title, company, extraction }: DemoApplication): string | null {
  if (extraction === null) {
    return null
  }
  const lines = [
    `${title} at ${company}.`,
    `Requirements: ${extraction.requiredSkills.join(', ')}.`,
    `Nice to have: ${extraction.niceToHaveSkills.join(', ')}.`,
    ...extraction.experienceRequirements,
  ]
  return lines.join('\n')
}

async function seedUser(): Promise<number> {
  const passwordHash = await bcrypt.hash(TEST_USER.password, 12)

  const created = await pool.query<{ id: number }>(
    `INSERT INTO users (email, username, first_name, last_name, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ((LOWER(email))) DO NOTHING
     RETURNING id`,
    [TEST_USER.email, TEST_USER.username, TEST_USER.firstName, TEST_USER.lastName, passwordHash]
  )

  if (created.rows.length > 0) {
    console.log(`Created test user (id ${created.rows[0].id}): ${TEST_USER.email} / ${TEST_USER.password}`)
    return created.rows[0].id
  }

  const existing = await pool.query<{ id: number }>('SELECT id FROM users WHERE LOWER(email) = LOWER($1)', [
    TEST_USER.email,
  ])
  console.log(`Test user already exists: ${TEST_USER.email} / ${TEST_USER.password}`)
  return existing.rows[0].id
}

async function seedApplications(
  userId: number,
  { refresh }: { refresh: boolean }
): Promise<{ removed: number; created: number; skipped: number }> {
  return withTransaction(async (client) => {
    let removed = 0
    let created = 0
    let skipped = 0

    if (refresh) {
      const deleted = await client.query(
        `DELETE FROM applications
         WHERE user_id = $1
           AND (title, company) IN (SELECT * FROM unnest($2::text[], $3::text[]))`,
        [userId, DEMO_APPLICATIONS.map((demo) => demo.title), DEMO_APPLICATIONS.map((demo) => demo.company)]
      )
      removed = deleted.rowCount ?? 0
    }

    for (const demo of DEMO_APPLICATIONS) {
      const exists = await client.query('SELECT 1 FROM applications WHERE user_id = $1 AND title = $2 AND company = $3', [
        userId,
        demo.title,
        demo.company,
      ])
      if (exists.rowCount !== 0) {
        skipped += 1
        continue
      }

      const first = demo.history[0]
      const last = demo.history[demo.history.length - 1]
      const applied = demo.history.find(([status]) => status === 'applied')

      const inserted = await client.query<{ id: number }>(
        `INSERT INTO applications
           (user_id, title, company, source_website, status, applied_on,
            extraction_status, job_description, jd_extraction, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, CURRENT_DATE - $6::int, $7, $8, $9,
                 NOW() - make_interval(days => $10::int), NOW() - make_interval(days => $11::int))
         RETURNING id`,
        [
          userId,
          demo.title,
          demo.company,
          demo.sourceWebsite,
          last[0],
          applied?.[1] ?? null,
          demo.extraction === null ? 'not_attempted' : 'success',
          describeJob(demo),
          demo.extraction,
          first[1],
          last[1],
        ]
      )
      const applicationId = inserted.rows[0].id

      await client.query(
        `INSERT INTO status_history (application_id, status, changed_at)
         SELECT $1, step.status, NOW() - make_interval(days => step.days_ago)
         FROM unnest($2::text[], $3::int[]) AS step(status, days_ago)`,
        [applicationId, demo.history.map(([status]) => status), demo.history.map(([, daysAgo]) => daysAgo)]
      )

      await syncApplicationSkills(client, applicationId, demo.extraction)
      created += 1
    }

    return { removed, created, skipped }
  })
}

async function seed() {
  const refresh = process.argv.includes('--refresh')
  const userId = await seedUser()
  const { removed, created, skipped } = await seedApplications(userId, { refresh })
  console.log(
    `Demo applications: ${refresh ? `${removed} removed, ` : ''}${created} added, ${skipped} already present`
  )
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err)
    pool.end()
    process.exit(1)
  })
