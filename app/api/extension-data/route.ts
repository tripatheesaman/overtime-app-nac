import { NextRequest, NextResponse } from "next/server";
import getCurrentMonthDetails from "@/app/services/DayDetails";
import prisma from "@/app/lib/prisma";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const data = searchParams.get('data');

  if (!data) {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
  }

  try {
    const parsedData = JSON.parse(data);
    
    if (parsedData.action === 'getCurrentMonthDetails') {
      const monthDetails = await getCurrentMonthDetails();
      if ('message' in monthDetails && 'status' in monthDetails) {
        return NextResponse.json({ 
          success: false, 
          error: monthDetails.message 
        }, { status: monthDetails.status });
      }
      
      // Fetch global winter settings
      const settings = await prisma.$queryRawUnsafe<Array<{ isWinter: number; winterStartDay: number | null; winterEndDay: number | null }>>(
        'SELECT isWinter, winterStartDay, winterEndDay FROM settings WHERE id = 1 LIMIT 1'
      );
      
      const winterSettings = settings && settings.length > 0 
        ? { isWinter: Boolean(settings[0].isWinter), winterStartDay: settings[0].winterStartDay, winterEndDay: settings[0].winterEndDay }
        : { isWinter: false, winterStartDay: null, winterEndDay: null };
      
      return NextResponse.json({ 
        success: true, 
        data: { ...monthDetails, ...winterSettings }
      });
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error) {
    return NextResponse.json(
      { error: `Invalid data format: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 400 }
    );
  } finally {
    await prisma.$disconnect();
  }
} 