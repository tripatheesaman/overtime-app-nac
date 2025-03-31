import { NextRequest, NextResponse } from "next/server";
import { FormData } from "@/app/types/InputFormType";
import processRawTime from "@/app/lib/helpers/timetransformation";
import FormatNightTime from "@/app/lib/helpers/formatNightTime";
import ProcessBlankTimes from "@/app/lib/helpers/processblanktimes";

export const POST = async (req: NextRequest) => {
  let processedAttendanceData
  if (!(req.method === "POST"))
    return NextResponse.json({ error: "Method not allowed" }, { status: 401 });

  if (!req.body)
    return NextResponse.json(
      { error: "No request payload received !" },
      { status: 400 }
    );

  const data: FormData = (await req.json()) as FormData;
  if (!data || typeof data !== "object")
    return NextResponse.json(
      { error: "Invalid data received !" },
      { status: 400 }
    );
   if (!data.dutyStartTime || !data.dutyEndTime || !data.regularOffDay || !data.inOutTimes || !data.name || !data.staffId || !data.designation)
    return NextResponse.json(
      { error: "Incomplete data received!" },
      { status: 400 }
    );

    if (data.dutyStartTime == "" || data.dutyEndTime == "" || data.inOutTimes.length <1 || data.name == "" || data.staffId == "" || data.designation == "")
    return NextResponse.json(
      { error: "Some empty data received !" },
      { status: 400 }
    );
   processedAttendanceData = processRawTime(data.inOutTimes);
  if (!processedAttendanceData || !(processedAttendanceData.length > 0)) {
    return NextResponse.json(
      { error: "Invalid data after processing !" },
      { status: 400 }
    );
  }
  if (!data.nightDutyDays) {
    return NextResponse.json(
      { error: "Invalid night data received!" },
      { status: 400 }
    );
  }

  if (Array.isArray(data.nightDutyDays) && data.nightDutyDays.length > 0) {
    processedAttendanceData = FormatNightTime(
      processedAttendanceData,
      data.nightDutyDays
    );
  }

  const finalProcessedData = ProcessBlankTimes(processedAttendanceData,data.dutyStartTime, data.dutyEndTime)

  console.log(finalProcessedData)

  
  // console.log(hasNightDays);

  // const nightTimeFormattedAttendanceData = FormatNightTime(processedAttendanceData,data.night)

};
