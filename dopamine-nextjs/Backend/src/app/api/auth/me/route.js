import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/db.js'
import { users } from '@/lib/db/schema.js'
import { requireAuth } from '@/lib/middleware.js'

export async function GET(request, dbClient = db) {
  const authResult = await requireAuth(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const user = await dbClient.query.users.findFirst({
    where: eq(users.id, authResult.userId),
  })

  if (!user) {
    return NextResponse.json({ error: 'User not found' }, { status: 404 })
  }

  return NextResponse.json({
    user: {
      id: user.id,
      name: user.name,
      email: user.email,
      lokasi: user.lokasi,
      role: user.role,
    },
  })
}
