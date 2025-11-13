import { NextRequest, NextResponse } from "next/server";
import prisma from "@/app/lib/prisma";

// Simple settings storage - uses a single Settings row or creates one
const SETTINGS_ID = 1;

export async function GET() {
  try {
    const settings = await prisma.$queryRawUnsafe<Array<{ isWinter: number; winterStartDay: number | null }>>(
      'SELECT isWinter, winterStartDay FROM Settings WHERE id = ? LIMIT 1',
      SETTINGS_ID
    );
    
    if (!settings || settings.length === 0) {
      return NextResponse.json({ 
        success: true, 
        data: { isWinter: false, winterStartDay: null } 
      });
    }
    
    return NextResponse.json({ 
      success: true, 
      data: { 
        isWinter: Boolean(settings[0].isWinter), 
        winterStartDay: settings[0].winterStartDay 
      } 
    });
  } catch {
    return NextResponse.json({ 
      success: true, 
      data: { isWinter: false, winterStartDay: null } 
    });
  } finally {
    await prisma.$disconnect();
  }
}

export async function POST(req: NextRequest) {
  try {
    const { isWinter, winterStartDay } = await req.json();
    
    const exists = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
      'SELECT id FROM Settings WHERE id = ? LIMIT 1',
      SETTINGS_ID
    );
    
    if (exists && exists.length > 0) {
      await prisma.$executeRawUnsafe(
        'UPDATE Settings SET isWinter = ?, winterStartDay = ? WHERE id = ?',
        isWinter ? 1 : 0,
        winterStartDay || null,
        SETTINGS_ID
      );
    } else {
      await prisma.$executeRawUnsafe(
        'INSERT INTO Settings (id, isWinter, winterStartDay) VALUES (?, ?, ?)',
        SETTINGS_ID,
        isWinter ? 1 : 0,
        winterStartDay || null
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

