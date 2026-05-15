import {
  describe,
  expect,
  it,
  beforeAll,
  beforeEach,
  jest,
} from '@jest/globals'
process.env.JWT_SECRET = 'test-jwt-secret'

const mockDb = {
  query: {
    users: {
      findFirst: jest.fn(),
      findMany: jest.fn(),
    },
  },
  insert: jest.fn(() => ({
    values: jest.fn(async () => ({ insertId: 1 })),
  })),
  update: jest.fn(() => ({
    set: jest.fn(() => ({ where: jest.fn(async () => ({ rowCount: 1 })) })),
  })),
}

let authHelpers
let authRegisterRoute
let authLoginRoute
let authMeRoute
let adminUsersRoute
let adminProductsRoute
let superAdminUsersRoute

beforeAll(async () => {
  authHelpers = await import('@/lib/auth.js')
  authRegisterRoute = await import('@/app/api/auth/register/route.js')
  authLoginRoute = await import('@/app/api/auth/login/route.js')
  authMeRoute = await import('@/app/api/auth/me/route.js')
  adminUsersRoute = await import('@/app/api/admin/users/route.js')
  adminProductsRoute = await import('@/app/api/admin/products/route.js')
  superAdminUsersRoute = await import('@/app/api/super-admin/users/route.js')
})

beforeEach(() => {
  jest.clearAllMocks()
  process.env.JWT_SECRET = 'test-jwt-secret'
})

describe('Auth helpers', () => {
  it('hashes and verifies passwords correctly', async () => {
    const hash = await authHelpers.hashPassword('password123')
    expect(typeof hash).toBe('string')
    expect(await authHelpers.verifyPassword('password123', hash)).toBe(true)
  })

  it('signs and verifies JWT tokens', async () => {
    const token = authHelpers.signToken({ userId: 1, role: 'costumer' })
    expect(typeof token).toBe('string')
    const payload = authHelpers.verifyToken(token)
    expect(payload.userId).toBe(1)
    expect(payload.role).toBe('costumer')
  })

  it('reads Bearer token from request headers', () => {
    const request = new Request('http://localhost', {
      headers: { authorization: 'Bearer abc123' },
    })
    expect(authHelpers.getTokenFromRequest(request)).toBe('abc123')
  })
})

describe('Auth API routes', () => {
  it('registers a new customer', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null)
    mockDb.insert.mockImplementationOnce(() => ({
      values: jest.fn(async () => ({ insertId: 1 })),
    }))

    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'test@example.com',
        lokasi: 'Jakarta',
        password: 'password123',
      }),
    })

    const response = await authRegisterRoute.POST(request, mockDb)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.user).toMatchObject({
      id: 1,
      email: 'test@example.com',
      role: 'costumer',
    })
  })

  it('rejects duplicate registration email', async () => {
    mockDb.query.users.findFirst.mockResolvedValue({
      id: 1,
      email: 'test@example.com',
    })

    const request = new Request('http://localhost/api/auth/register', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        name: 'Test',
        email: 'test@example.com',
        lokasi: 'Jakarta',
        password: 'password123',
      }),
    })

    const response = await authRegisterRoute.POST(request, mockDb)
    expect(response.status).toBe(409)
    const body = await response.json()
    expect(body.error).toBe('Email already registered')
  })

  it('logs in with valid credentials', async () => {
    const hashedPassword = await authHelpers.hashPassword('password123')
    mockDb.query.users.findFirst.mockResolvedValue({
      id: 2,
      name: 'Login',
      email: 'login@example.com',
      password: hashedPassword,
      role: 'costumer',
    })

    const request = new Request('http://localhost/api/auth/login', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({
        email: 'login@example.com',
        password: 'password123',
      }),
    })

    const response = await authLoginRoute.POST(request, mockDb)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user.email).toBe('login@example.com')
    expect(typeof body.token).toBe('string')
  })

  it('returns profile for authenticated user', async () => {
    const user = {
      id: 3,
      name: 'Profile',
      email: 'profile@example.com',
      lokasi: 'Bandung',
      role: 'costumer',
    }
    mockDb.query.users.findFirst.mockResolvedValue(user)
    const token = authHelpers.signToken({ userId: 3, role: 'costumer' })

    const request = new Request('http://localhost/api/auth/me', {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    })

    const response = await authMeRoute.GET(request, mockDb)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.user).toMatchObject(user)
  })
})

describe('Admin API routes', () => {
  it('lists users for admin', async () => {
    const users = [
      {
        id: 4,
        name: 'AdminUser',
        email: 'admin@example.com',
        lokasi: 'Surabaya',
        role: 'admin',
      },
    ]
    mockDb.query.users.findMany.mockResolvedValue(users)
    const token = authHelpers.signToken({ userId: 4, role: 'admin' })

    const request = new Request('http://localhost/api/admin/users', {
      method: 'GET',
      headers: { authorization: `Bearer ${token}` },
    })

    const response = await adminUsersRoute.GET(request, mockDb)
    expect(response.status).toBe(200)
    const body = await response.json()
    expect(body.users).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ id: 4, email: 'admin@example.com' }),
      ])
    )
  })

  it('creates a product for admin', async () => {
    mockDb.insert.mockImplementationOnce(() => ({
      values: jest.fn(async () => ({ insertId: 5 })),
    }))
    const token = authHelpers.signToken({ userId: 4, role: 'admin' })

    const request = new Request('http://localhost/api/admin/products', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        categoryId: 1,
        nama: 'Shirt',
        stock: 10,
        ukuran: 'M',
      }),
    })

    const response = await adminProductsRoute.POST(request, mockDb)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.product).toMatchObject({
      id: 5,
      nama: 'Shirt',
      stock: 10,
      ukuran: 'M',
    })
  })
})

describe('Super-admin API routes', () => {
  it('creates a new admin user', async () => {
    mockDb.query.users.findFirst.mockResolvedValue(null)
    mockDb.insert.mockImplementationOnce(() => ({
      values: jest.fn(async () => ({ insertId: 6 })),
    }))
    const token = authHelpers.signToken({ userId: 1, role: 'owner' })

    const request = new Request('http://localhost/api/super-admin/users', {
      method: 'POST',
      headers: {
        authorization: `Bearer ${token}`,
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        name: 'NewAdmin',
        email: 'newadmin@example.com',
        lokasi: 'Bali',
        password: 'adminpass',
        role: 'admin',
      }),
    })

    const response = await superAdminUsersRoute.POST(request, mockDb)
    expect(response.status).toBe(201)
    const body = await response.json()
    expect(body.user).toMatchObject({ id: 6, name: 'NewAdmin', role: 'admin' })
  })
})
