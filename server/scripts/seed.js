const bcrypt = require('bcrypt')
const pool = require('../db')

const TEST_USER = {
  email: 'test@example.com',
  username: 'testuser',
  firstName: 'Test',
  lastName: 'User',
  password: 'password123',
}

async function seed() {
  const passwordHash = await bcrypt.hash(TEST_USER.password, 12)

  const result = await pool.query(
    `INSERT INTO users (email, username, first_name, last_name, password_hash)
     VALUES ($1, $2, $3, $4, $5)
     ON CONFLICT ((LOWER(email))) DO NOTHING
     RETURNING id`,
    [TEST_USER.email, TEST_USER.username, TEST_USER.firstName, TEST_USER.lastName, passwordHash]
  )

  if (result.rows.length > 0) {
    console.log(`Created test user (id ${result.rows[0].id}): ${TEST_USER.email} / ${TEST_USER.password}`)
  } else {
    console.log(`Test user already exists: ${TEST_USER.email} / ${TEST_USER.password}`)
  }
}

seed()
  .then(() => pool.end())
  .catch((err) => {
    console.error(err)
    pool.end()
    process.exit(1)
  })
