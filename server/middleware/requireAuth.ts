import jwt from 'jsonwebtoken'
import type { RequestHandler } from 'express'
import config from '../config.js'

const requireAuth: RequestHandler = (req, res, next) => {
  const token = req.cookies.token

  if (!token) {
    res.status(401).json({ message: 'Not logged in' })
    return
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    if (typeof payload === 'string' || typeof payload.userId !== 'number') {
      throw new Error('Malformed token payload')
    }
    req.userId = payload.userId
    next()
  } catch {
    res.status(401).json({ message: 'Invalid or expired session' })
  }
}

export default requireAuth
