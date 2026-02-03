import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// Simple settings storage - uses a single Settings row or creates one
const SETTINGS_ID = 1;

export async function GET() {
  try {
    const settings = await prisma.$queryRawUnsafe<Array<{ isWinter: number; winterStartDay: number | null; winterEndDay: number | null }>>(
      'SELECT isWinter, winterStartDay, winterEndDay FROM settings WHERE id = ? LIMIT 1',
      SETTINGS_ID
    );
    
    if (!settings || settings.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: { isWinter: false, winterStartDay: null, winterEndDay: null } 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        isWinter: Boolean(settings[0].isWinter), 
        winterStartDay: settings[0].winterStartDay,
        winterEndDay: settings[0].winterEndDay
      } 
    });
  } catch {
    return NextResponse.json({ 
      success: true, 
      data: { isWinter: false, winterStartDay: null, winterEndDay: null } 
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isWinter, winterStartDay, winterEndDay } = await req.json();
    
    const exists = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
      'SELECT id FROM settings WHERE id = ? LIMIT 1',
      SETTINGS_ID
    );
    
    if (exists && exists.length > 0) {
      await prisma.$executeRawUnsafe(
        'UPDATE settings SET isWinter = ?, winterStartDay = ?, winterEndDay = ? WHERE id = ?',
        isWinter ? 1 : 0,
        winterStartDay || null,
        winterEndDay || null,
        SETTINGS_ID
      );
    } else {
      await prisma.$executeRawUnsafe(
        'INSERT INTO settings (id, isWinter, winterStartDay, winterEndDay) VALUES (?, ?, ?, ?)',
        SETTINGS_ID,
        isWinter ? 1 : 0,
        winterStartDay || null,
        winterEndDay || null
      );
    }
    
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ 
      success: false, 
      error: String(error) 
    }, { status: 500 });
  } finally {
    await prisma.$disconnect();
  }
}

