import { NextRequest, NextResponse } from "next/server";
import { FormData } from "@/app/types/InputFormType";
import processRawTime from "@/app/lib/helpers/timetransformation";
import FormatNightTime from "@/app/lib/helpers/formatNightTime";

export const POST = async (req: NextRequest) => {
  let hasNightDays = false
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
  const processedAttendanceData = processRawTime(data.inOutTimes);
  if (!processedAttendanceData || !(processedAttendanceData.length > 0)){
    return NextResponse.json(
      {error:"Invalid data after processing !"},
      {status:400}
    )
  }
  if (!data.nightDutyDays){
        return NextResponse.json(
          { error: "Invalid night data received!" },
          { status: 400 }
        );
  }
  if (data.nightDutyDays.length>0 && data.nightDutyDays){
    hasNightDays = true
    const attendanceDataAfterNightDuty = FormatNightTime(processedAttendanceData, data.nightDutyDays)
  }
  // const nightTimeFormattedAttendanceData = FormatNightTime(processedAttendanceData, )
    
  if (processedAttendanceData.length < 1)
    return NextResponse
      .json({ error: "Invalid data found after processing !" }, {status:400});
  
};
