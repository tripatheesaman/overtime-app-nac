import { NextRequest, NextResponse } from "next/server";
import { FormData } from "@/app/types/InputFormType";
import processRawTime from "@/app/lib/helpers/timetransformation";

export const POST = async (req: NextRequest, res: NextResponse) => {
  // if (!(req.method === "POST"))
    // return res.status(405).json({ error: "Method not allowed !" });

  // if (!req.body) return res.status(400).json({ error: "No data received!" });
  const data: FormData = await req.json() as FormData;
  console.log("Data",data)
  // if (!data || typeof data !== "object")
  //   return res.status(400).json({ error: "Invalid data provided !" });
  console.log(data.inOutTimes);
  const processedAttendanceData = processRawTime(data.inOutTimes);
  // if (processedAttendanceData.length < 1)
  //   return res
  //     .status(400)
  //     .json({ error: "Invalid data found after processing !" });
  console.log(processedAttendanceData);
};

