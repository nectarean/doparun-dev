import { NextResponse } from 'next/server'
import { getTokenFromRequest, verifyToken } from './auth.js'

async function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
}

async function forbidden() {
  return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
}

export async function requireAuth(request) {
  const token = getTokenFromRequest(request)
  if (!token) {
    return unauthorized()
  }

  try {
    const payload = verifyToken(token)
    if (!payload || typeof payload !== 'object' || !('userId' in payload)) {
      return unauthorized()
    }
    return payload
  } catch (error) {
    return unauthorized()
  }
}

export async function requireRole(request, allowedRoles = []) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  if (!allowedRoles.includes(authResult.role)) {
    return forbidden()
  }

  return authResult
}

export async function requireAdmin(request) {
  return requireRole(request, ['admin', 'owner'])
}

export async function requireSuperAdmin(request) {
  return requireRole(request, ['owner'])
}
