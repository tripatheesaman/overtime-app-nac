import { NextRequest, NextResponse } from "next/server";
import { FormData } from "@/app/types/InputFormType";
import processRawTime from "@/app/lib/helpers/timetransformation";
import FormatNightTime from "@/app/lib/helpers/formatNightTime";
import ProcessBlankTimes from "@/app/lib/helpers/processblanktimes";

export const POST = async (req: NextRequest) => {
  if (req.method !== "POST") {
    return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
  }
  if (!req.body) {
    return NextResponse.json(
      { error: "No request payload received!" },
      { status: 400 }
    );
  }

  let data: FormData;
  try {
    data = await req.json();
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json(
        { error: "Failed to parse request data: " + error.message },
        { status: 400 }
      );
    } else {
      return NextResponse.json(
        { error: "Failed to parse request data." },
        { status: 400 }
      );
    }
  }

  if (!data || typeof data !== "object") {
    return NextResponse.json(
      { error: "Invalid data received!" },
      { status: 400 }
    );
  }

  const requiredFields = [
    "dutyStartTime",
    "dutyEndTime",
    "regularOffDay",
    "inOutTimes",
    "name",
    "staffId",
    "designation",
  ];

  for (const field of requiredFields) {
    if (!(field in data)) {
      return NextResponse.json(
        { error: `${field} is required!` },
        { status: 400 }
      );
    }
  }
  if (
    data.dutyStartTime === "" ||
    data.dutyEndTime === "" ||
    data.inOutTimes.length < 1 ||
    data.name === "" ||
    data.staffId === "" ||
    data.designation === ""
  ) {
    return NextResponse.json(
      { error: "Some empty data received!" },
      { status: 400 }
    );
  }

  let processedAttendanceData;
  try {
    processedAttendanceData = processRawTime(data.inOutTimes);
    if (!processedAttendanceData || processedAttendanceData.length === 0) {
      throw new Error("Invalid data after processing!");
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred while processing raw time data!" },
        { status: 400 }
      );
    }
  }

  if (data.nightDutyDays && Array.isArray(data.nightDutyDays)) {
    try {
      processedAttendanceData = FormatNightTime(
        processedAttendanceData,
        data.nightDutyDays
      );
    } catch (error: unknown) {
      if (error instanceof Error) {
        return NextResponse.json(
          { error: "Error formatting night duty time: " + error.message },
          { status: 400 }
        );
      } else {
        return NextResponse.json(
          {
            error:
              "An unknown error occurred while formatting night duty time!",
          },
          { status: 400 }
        );
      }
    }
  }

  let finalProcessedData;
  try {
    finalProcessedData = await ProcessBlankTimes(
      processedAttendanceData,
      data.dutyStartTime,
      data.dutyEndTime,
      data.regularOffDay
    );
  } catch (error: unknown) {
    if (error instanceof Error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    } else {
      return NextResponse.json(
        { error: "An unknown error occurred while processing blank times!" },
        { status: 400 }
      );
    }
  }
  console.log(finalProcessedData)
  // return NextResponse.json(finalProcessedData, { status: 200 });
};
