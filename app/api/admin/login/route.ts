import { NextRequest, NextResponse } from 'next/server'
import prisma from '@/app/lib/prisma'

export async function POST(req: NextRequest) {
  try {
    const { username, password } = await req.json()
    if (!username || !password) {
      return NextResponse.json({ success: false, error: 'Missing credentials' }, { status: 400 })
    }

    // Query user using Prisma
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, username: true, password: true, role: true }
    })

    if (!user) {
      return NextResponse.json({ success: false, error: 'Invalid credentials' }, { status: 401 })
    }

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
    const user = await prisma.user.findUnique({
      where: { username },
      select: { id: true, password: true }
    })
    if (!user) return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 })
    if (String(user.password) !== String(currentPassword)) return NextResponse.json({ success: false, error: 'Invalid current password' }, { status: 401 })
    await prisma.user.update({
      where: { id: user.id },
      data: { password: newPassword }
    })
    return NextResponse.json({ success: true })
  } catch (error) {
    return NextResponse.json({ success: false, error: String(error) }, { status: 500 })
  } finally {
    await prisma.$disconnect()
  }
}


