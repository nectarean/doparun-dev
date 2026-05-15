import { NextResponse } from 'next/server'
import { db } from '@/lib/db/db.js'
import { products } from '@/lib/db/schema.js'
import { requireAdmin } from '@/lib/middleware.js'

export async function GET(request, dbClient = db) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const allProducts = await dbClient.query.products.findMany()
  return NextResponse.json({ products: allProducts })
}

export async function POST(request, dbClient = db) {
  const authResult = await requireAdmin(request)
  if (authResult instanceof NextResponse) {
    return authResult
  }

  const body = await request.json()
  const { categoryId, nama, stock, ukuran } = body

  if (!categoryId || !nama || typeof stock !== 'number' || !ukuran) {
    return NextResponse.json(
      { error: 'categoryId, nama, stock, and ukuran are required' },
      { status: 400 }
    )
  }

  const result = await dbClient.insert(products).values({
    categoryId: Number(categoryId),
    userId: authResult.userId,
    nama,
    stock,
    ukuran,
  })

  return NextResponse.json(
    {
      product: {
        id: result.insertId,
        categoryId: Number(categoryId),
        userId: authResult.userId,
        nama,
        stock,
        ukuran,
      },
    },
    { status: 201 }
  )
}
