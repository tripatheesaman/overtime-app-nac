import { NextRequest, NextResponse } from "next/server";
import { FormData } from "@/app/types/InputFormType";
import processRawTime from "@/app/lib/helpers/timetransformation";
import FormatNightTime from "@/app/lib/helpers/formatNightTime";
import ProcessBlankTimes from "@/app/lib/helpers/processblanktimes";
import CalculateOvertime from "@/app/lib/helpers/calculateovertime";

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
  // console.log(data.inOutTimes)
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
  if (data.nightDutyDays && Array.isArray(data.nightDutyDays) && data.nightDutyDays.length > 0) {
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
  // console.log(processedAttendanceData)
  let finalProcessedData;
  try {
    finalProcessedData = await ProcessBlankTimes(
      processedAttendanceData,
      data.dutyStartTime,
      data.dutyEndTime,
      data.regularOffDay
    );
    console.log(finalProcessedData)
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

  if (finalProcessedData === undefined)
    return NextResponse.json(
      { error: "Undefined finalProcessedData" },
      { status: 400 }
    );
    
  const overTimeData = await CalculateOvertime(
    finalProcessedData,
    data.nightDutyDays,
    data.dutyStartTime,
    data.dutyEndTime,
    data.regularOffDay,
    data.nightDutyStartTime,
    data.nightDutyEndTime
  );
  // console.log(overTimeData)
  return NextResponse.json(
    {
      success: true,
      overtimeData: overTimeData,
    },
    { status: 200 }
  );
};
