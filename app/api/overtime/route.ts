import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { FormData } from "@/app/types/InputFormType";
import processRawTime from "@/app/lib/helpers/timetransformation";
import FormatNightTime from "@/app/lib/helpers/formatNightTime";
import ProcessBlankTimes from "@/app/lib/helpers/processblanktimes";
import CalculateOvertime from "@/app/lib/helpers/calculateovertime";
import prisma from "@/app/lib/prisma";

type OvertimeResultRow = {
  beforeDuty?: [string, string];
  afterDuty?: [string, string];
  totalHours?: number;
  totalNightHours?: number;
  totalChdHours?: number;
  totalOffHours?: number;
  totalDashainHours?: number;
  totalTiharHours?: number;
  hasNightOvertime?: boolean;
  hasMorningOvertime?: boolean;
};

const isHHMM = (value?: string | null) =>
  /^([01]\d|2[0-3]):([0-5]\d)$/.test((value ?? "").trim());

const intervalHours = (start?: string, end?: string) => {
  const safeStart = (start ?? "").trim();
  const safeEnd = (end ?? "").trim();
  if (!isHHMM(safeStart) || !isHHMM(safeEnd)) return 0;
  const [startH, startM] = safeStart.split(":").map(Number);
  const [endH, endM] = safeEnd.split(":").map(Number);
  const startMinutes = startH * 60 + startM;
  let endMinutes = endH * 60 + endM;
  if (endMinutes <= startMinutes) endMinutes += 24 * 60;
  return (endMinutes - startMinutes) / 60;
};

const toDbIntHours = (hours: number) => Math.max(0, Math.round(hours));

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
    "departmentId",
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
    const recordsWithShiftInfo = data.inOutTimes.map((record, index) => ({
      ...record,
      isMorningShift: data.morningShiftDays?.includes(index + 1) || false
    }));
    
    processedAttendanceData = processRawTime(recordsWithShiftInfo, data.dutyStartTime, data.dutyEndTime);
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
      processedAttendanceData = FormatNightTime(processedAttendanceData);
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
      data.regularOffDay,
      data.morningShiftStartTime,
      data.morningShiftEndTime,
      data.morningShiftDays,
      data.nightDutyStartTime,
      data.nightDutyEndTime,
      data.nightDutyDays
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

  if (finalProcessedData === undefined)
    return NextResponse.json(
      { error: "Undefined finalProcessedData" },
      { status: 400 }
    );
    
  const overTimeData =
    (await CalculateOvertime(
    finalProcessedData,
    data.nightDutyDays,
    data.dutyStartTime,
    data.dutyEndTime,
    data.regularOffDay,
    data.nightDutyStartTime,
    data.nightDutyEndTime,
    data.morningShiftDays,
    data.morningShiftStartTime,
    data.morningShiftEndTime,
    data.departmentId
    )) ?? [];

  const normalizedRows = overTimeData as OvertimeResultRow[];

  const beforeDutyHours = normalizedRows.reduce(
    (sum, row) => sum + intervalHours(row.beforeDuty?.[0], row.beforeDuty?.[1]),
    0
  );
  const afterDutyHours = normalizedRows.reduce(
    (sum, row) => sum + intervalHours(row.afterDuty?.[0], row.afterDuty?.[1]),
    0
  );
  const totalOvertimeHours = normalizedRows.reduce(
    (sum, row) => sum + (Number(row.totalHours) || 0),
    0
  );
  const nightOvertimeHours = normalizedRows.reduce(
    (sum, row) => sum + (Number(row.totalNightHours) || 0),
    0
  );
  const holidayHours = normalizedRows.reduce(
    (sum, row) =>
      sum +
      (Number(row.totalChdHours) || 0) +
      (Number(row.totalOffHours) || 0) +
      (Number(row.totalDashainHours) || 0) +
      (Number(row.totalTiharHours) || 0),
    0
  );
  const numberOfOddShifts = normalizedRows.reduce(
    (sum, row) =>
      sum + (row.hasNightOvertime || row.hasMorningOvertime ? 1 : 0),
    0
  );
  const monthName =
    overTimeData.length > 0 && "currentMonth" in overTimeData[0]
      ? String((overTimeData[0] as { currentMonth?: string }).currentMonth ?? "")
      : "";
  const attendanceAudit: Prisma.InputJsonValue = JSON.parse(
    JSON.stringify({
      rawAttendance: data.inOutTimes,
      processedAttendance: finalProcessedData,
      overtimeBreakdown: overTimeData,
      nightDutyDays: data.nightDutyDays ?? [],
      morningShiftDays: data.morningShiftDays ?? [],
    })
  );

  await prisma.overTimeDetails.create({
    data: {
      name: data.name,
      designation: data.designation,
      staffid: data.staffId,
      totalovertimehours: toDbIntHours(totalOvertimeHours),
      nightovertime: toDbIntHours(nightOvertimeHours),
      beforedutyhours: toDbIntHours(beforeDutyHours),
      afterdutyhours: toDbIntHours(afterDutyHours),
      numberofoddshifts: numberOfOddShifts,
      holidayhours: toDbIntHours(holidayHours),
      monthname: monthName,
      regularoffday: data.regularOffDay,
      regulardutyhoursfrom: data.dutyStartTime,
      regulardutyhoursto: data.dutyEndTime,
      attendancedata: attendanceAudit,
      departmentId: data.departmentId,
    },
  });

  return NextResponse.json(
    {
      success: true,
      overtimeData: overTimeData,
    },
    { status: 200 }
  );
};
