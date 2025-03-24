import { NextRequest, NextResponse } from "next/server";
import { FormData } from "@/app/types/InputFormType";
import processRawTime from "@/app/lib/helpers/timetransformation";

export const POST = async (req: NextRequest) => {
  if (!(req.method === "POST"))
    return NextResponse.json({ error: "Method not allowed" }, { status: 401 });

  if (!req.body)
    return NextResponse.json(
      { error: "No request payload received !" },
      { status: 400 }
    );
  const data: FormData = (await req.json()) as FormData;
  console.log("Data", data);
  if (!data || typeof data !== "object")
    return NextResponse.json(
      { error: "invalid data received !" },
      { status: 400 }
    );
  console.log(data.inOutTimes);
  const processedAttendanceData = processRawTime(data.inOutTimes);
  if (processedAttendanceData.length < 1)
    return NextResponse
      .json({ error: "Invalid data found after processing !" }, {status:400});
  console.log(processedAttendanceData);
};
