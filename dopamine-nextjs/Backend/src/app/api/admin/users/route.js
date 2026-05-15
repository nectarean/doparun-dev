import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/db.js'
import { users } from '@/lib/db/schema.js'
import { requireAdmin } from '@/lib/middleware.js'

const allowedRoles = ['costumer', 'admin', 'owner']

export async function GET(request, dbClient = db) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const allUsers = await dbClient.query.users.findMany()
  return NextResponse.json({
    users: allUsers.map((user) => ({
      id: user.id,
      name: user.name,
      email: user.email,
      lokasi: user.lokasi,
      role: user.role,
      createdAt: user.createdAt,
    })),
  })
}

export async function PATCH(request, dbClient = db) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const body = await request.json()
  const { id, role } = body
  if (!id || !role) {
    return NextResponse.json(
      { error: 'id and role are required' },
      { status: 400 }
    )
  }

  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const updateResult = await dbClient
    .update(users)
    .set({ role })
    .where(eq(users.id, Number(id)))

  return NextResponse.json({ updated: updateResult.rowCount || 0 })
}
