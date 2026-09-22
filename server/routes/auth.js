const express = require('express')
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const rateLimit = require('express-rate-limit')
const pool = require('../db')
const config = require('../config')
const requireAuth = require('../middleware/requireAuth')

const router = express.Router()

const BCRYPT_COST = 12

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: { message: 'Too many attempts. Try again later.' },
})

const USERNAME_PATTERN = /^[A-Za-z0-9_]{3,30}$/

function signToken(userId) {
  return jwt.sign({ userId }, config.jwtSecret, { expiresIn: '7d' })
}

function setAuthCookie(res, token) {
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: config.isProd,
    maxAge: 7 * 24 * 60 * 60 * 1000,
  })
}

function toPublicUser(row) {
  return {
    id: row.id,
    email: row.email,
    username: row.username,
    firstName: row.first_name,
    lastName: row.last_name,
  }
}

router.post('/signup', authLimiter, async (req, res) => {
  const { email, username, firstName, lastName, password } = req.body || {}

  if (typeof email !== 'string' || !email.includes('@')) {
    return res.status(400).json({ message: 'A valid email is required' })
  }
  if (typeof username !== 'string' || !USERNAME_PATTERN.test(username)) {
    return res.status(400).json({
      message: 'Username must be 3-30 characters: letters, numbers, underscores only',
    })
  }
  if (typeof firstName !== 'string' || firstName.trim() === '') {
    return res.status(400).json({ message: 'First name is required' })
  }
  if (typeof lastName !== 'string' || lastName.trim() === '') {
    return res.status(400).json({ message: 'Last name is required' })
  }
  if (typeof password !== 'string' || password.length < 8) {
    return res.status(400).json({ message: 'Password must be at least 8 characters' })
  }

  try {
    const passwordHash = await bcrypt.hash(password, BCRYPT_COST)

    const result = await pool.query(
      `INSERT INTO users (email, username, first_name, last_name, password_hash)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING id, email, username, first_name, last_name`,
      [email, username, firstName.trim(), lastName.trim(), passwordHash]
    )

    const user = result.rows[0]
    setAuthCookie(res, signToken(user.id))
    res.status(201).json(toPublicUser(user))
  } catch (err) {
    if (err.code === '23505') {
      if (err.constraint === 'users_email_lower_idx') {
        return res.status(409).json({ message: 'That email is already registered' })
      }
      if (err.constraint === 'users_username_lower_idx') {
        return res.status(409).json({ message: 'That username is already taken' })
      }
      return res.status(409).json({ message: 'Account already exists' })
    }
    console.error(err)
    res.status(500).json({ message: 'Could not create account' })
  }
})

router.post('/login', authLimiter, async (req, res) => {
  const { identifier, password } = req.body || {}

  if (typeof identifier !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ message: 'Invalid credentials' })
  }

  try {
    const result = await pool.query(
      `SELECT id, email, username, first_name, last_name, password_hash
       FROM users
       WHERE LOWER(email) = LOWER($1) OR LOWER(username) = LOWER($1)`,
      [identifier]
    )

    const user = result.rows[0]

    if (!user) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    const passwordMatches = await bcrypt.compare(password, user.password_hash)
    if (!passwordMatches) {
      return res.status(401).json({ message: 'Invalid credentials' })
    }

    setAuthCookie(res, signToken(user.id))
    res.json(toPublicUser(user))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not log in' })
  }
})

router.post('/logout', (req, res) => {
  res.clearCookie('token')
  res.status(204).end()
})

router.get('/me', requireAuth, async (req, res) => {
  try {
    const result = await pool.query(
      'SELECT id, email, username, first_name, last_name FROM users WHERE id = $1',
      [req.userId]
    )
    const user = result.rows[0]
    if (!user) {
      return res.status(401).json({ message: 'Not logged in' })
    }
    res.json(toPublicUser(user))
  } catch (err) {
    console.error(err)
    res.status(500).json({ message: 'Could not load user' })
  }
})

module.exports = router
