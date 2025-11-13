import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 })
    }

    // Query raw to avoid needing Prisma model changes
    const rows = await prisma.$queryRawUnsafe<Array<{ id: number; username: string; password: string; role: string }>>(
      'SELECT id, username, password, role FROM User WHERE username = ? LIMIT 1',
      username
    )

    if (!rows || rows.length === 0) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const user = rows[0]

    // Plaintext compare (since seeding is plaintext). Replace with bcrypt compare after you hash passwords.
    if (String(user.password) !== String(password)) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

    const res = NextResponse.json({ success: true })
    res.cookies.set('admin_session', 'ok', {
      httpOnly: true,
      sameSite: 'lax',
      path: '/',
    })
    return res
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true })
  res.cookies.set('admin_session', '', { path: '/', maxAge: 0 })
  return res
}

export async function PUT(req: NextRequest) {
  try {
    const { username, currentPassword, newPassword } = await req.json()
    if (!username || !currentPassword || !newPassword) {
      return NextResponse.json({ success: false, error: 'Missing fields' }, { status: 400 })
    }
    const rows = await prisma.$queryRawUnsafe<Array<{ id: number; username: string; password: string }>>(
      'SELECT id, username, password FROM User WHERE username = ? LIMIT 1',
      username
    )
    if (!rows || rows.length === 0) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    if (String(rows[0].password) !== String(currentPassword)) return NextResponse.json({ success: false, error: 'Invalid current password' }, { status: 401 })
    await prisma.$executeRawUnsafe('UPDATE User SET password = ? WHERE id = ?', newPassword, rows[0].id)
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}


