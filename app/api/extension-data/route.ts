import { NextRequest, NextResponse } from "next/server";
import getCurrentMonthDetails from "@/app/services/DayDetails";

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
      return NextResponse.json({ 
        success: true, 
        data: monthDetails 
      });
    }

    return NextResponse.json({ success: true, data: parsedData });
  } catch (error) {
    return NextResponse.json(
      { error: `Invalid data format: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 400 }
    );
  }
} 