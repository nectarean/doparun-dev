import { NextResponse } from 'next/server'
import { eq } from 'drizzle-orm'
import { db } from '@/lib/db/db.js'
import { users } from '@/lib/db/schema.js'
import { hashPassword } from '@/lib/auth.js'

export async function POST(request) {
  const body = await request.json()
  const { name, email, lokasi, password } = body

  if (!name || !email || !lokasi || !password) {
    return NextResponse.json(
      { error: 'name, email, lokasi, and password are required' },
      { status: 400 }
    )
  }

  const existingUser = await db.query.users.findFirst({
    where: eq(users.email, email),
  })

  if (existingUser) {
    return NextResponse.json(
      { error: 'Email already registered' },
      { status: 409 }
    )
  }

  const hashedPassword = await hashPassword(password)
  const result = await db.insert(users).values({
    name,
    email,
    lokasi,
    password: hashedPassword,
    role: 'costumer',
  })

  return NextResponse.json(
    {
      user: {
        id: result.insertId,
        name,
        email,
        lokasi,
        role: 'costumer',
      },
    },
    { status: 201 }
  )
}
