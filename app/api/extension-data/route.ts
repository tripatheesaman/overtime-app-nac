import { NextRequest, NextResponse } from "next/server";

export async function GET(req: NextRequest) {
  const searchParams = req.nextUrl.searchParams;
  const data = searchParams.get('data');

  if (!data) {
    return NextResponse.json({ error: "No data provided" }, { status: 400 });
  }

  try {
    const parsedData = JSON.parse(data);
    return NextResponse.json({ success: true, data: parsedData });
  } catch (error) {
    return NextResponse.json(
      { error: `Invalid data format: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 400 }
    );
  }
} 