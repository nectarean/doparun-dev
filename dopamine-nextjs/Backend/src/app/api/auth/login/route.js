import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/db.js'
import { users } from '@/lib/db/schema.js'
import { verifyPassword, signToken } from '@/lib/auth.js'

export async function POST(request, dbClient = db) {
  const body = await request.json()
  const { email, password } = body

  if (!email || !password) {
    return NextResponse.json(
      { error: 'Email and password are required' },
      { status: 400 }
    )
  }

  const user = await dbClient.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (!user) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const isValid = await verifyPassword(password, user.password)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const token = signToken({ userId: user.id, role: user.role })
  return NextResponse.json({
    token,
    user: { id: user.id, name: user.name, email: user.email, role: user.role },
  })
}
