import { NextResponse } from "next/server";
const convertDecimalToRoundedTime = (decimalTime: number): string => {
  if (decimalTime === null || decimalTime === undefined) return "--"; // Handle missing values

  const totalMinutes = decimalTime * 24 * 60; // Convert fraction to total minutes
  let hours = Math.floor(totalMinutes / 60); // Extract hours
  let minutes = Math.round(totalMinutes % 60); // Extract minutes

  // Round based on the 25-minute rule
  if (minutes < 25) {
    minutes = 0; // Round down
  } else {
    minutes = 0; // Reset minutes
    hours += 1; // Round up to next hour
  }

  return `${hours.toString().padStart(2, "0")}:00`;
};

export async function POST(req: Request) {
  try {
    const { attendanceData } = await req.json();

    if (!attendanceData || !Array.isArray(attendanceData)) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    console.log("Received attendance data:", attendanceData); // ✅ Debugging

    const formattedRecords = attendanceData.map((record) => ({
      inTime: convertDecimalToRoundedTime(record.inTime),
      outTime: convertDecimalToRoundedTime(record.outTime),
    }));

    console.log("Formatted attendance data:", formattedRecords)

    return NextResponse.json(
      { message: "Data successfully uploaded!" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error processing request:", error);
    return NextResponse.json(
      { error: "Internal Server Error" },
      { status: 500 }
    );
  }
}
