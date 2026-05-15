import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '1h'

if (!JWT_SECRET) {
  throw new Error('Missing JWT_SECRET environment variable')
}

export async function hashPassword(password) {
  return bcrypt.hash(password, 10)
}

export async function verifyPassword(password, hash) {
  return bcrypt.compare(password, hash)
}

export function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: JWT_EXPIRES_IN })
}

export function verifyToken(token) {
  return jwt.verify(token, JWT_SECRET)
}

export function getTokenFromRequest(request) {
  const authorization = request.headers.get('authorization')
  if (!authorization) {
    return null
  }
  const [type, token] = authorization.split(' ')
  if (type !== 'Bearer' || !token) {
    return null
  }
  return token
}
