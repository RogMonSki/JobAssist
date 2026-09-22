const jwt = require('jsonwebtoken')
const config = require('../config')

function requireAuth(req, res, next) {
  const token = req.cookies.token

  if (!token) {
    return res.status(401).json({ message: 'Not logged in' })
  }

  try {
    const payload = jwt.verify(token, config.jwtSecret)
    req.userId = payload.userId
    next()
  } catch (err) {
    res.status(401).json({ message: 'Invalid or expired session' })
  }
}

module.exports = requireAuth
