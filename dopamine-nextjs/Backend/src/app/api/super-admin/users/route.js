import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/db.js'
import { users } from '@/lib/db/schema.js'
import { requireSuperAdmin } from '@/lib/middleware.js'
import { hashPassword } from '@/lib/auth.js'

const allowedRoles = ['costumer', 'admin', 'owner']

export async function GET(request, dbClient = db) {
  const authResult = await requireSuperAdmin(request)
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

export async function POST(request, dbClient = db) {
  const authResult = await requireSuperAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const body = await request.json()
  const { name, email, lokasi, password, role = 'admin' } = body

  if (!name || !email || !lokasi || !password) {
    return NextResponse.json(
      { error: 'name, email, lokasi, and password are required' },
      { status: 400 }
    )
  }

  if (!allowedRoles.includes(role)) {
    return NextResponse.json({ error: 'Invalid role' }, { status: 400 })
  }

  const existingUser = await dbClient.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (existingUser) {
    return NextResponse.json(
      { error: 'Email already registered' },
      { status: 409 }
    )
  }

  const hashedPassword = await hashPassword(password)
  const result = await dbClient.insert(users).values({
    name,
    email,
    lokasi,
    password: hashedPassword,
    role,
  })

  return NextResponse.json(
    {
      user: {
        id: result.insertId,
        name,
        email,
        lokasi,
        role,
      },
    },
    { status: 201 }
  )
}
