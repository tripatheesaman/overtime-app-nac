import getCurrentMonthDetails from "@/app/services/DayDetails";
import { DayDetailsType } from "@/app/types/DayDetailType";
import prisma from "@/app/lib/prisma";
import {
  adjustTimeByHours,
  applyWinterAdjustments,
  parseWinterAdjustment,
} from "@/app/lib/helpers/winterTimeAdjustments";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const calculateTwoHoursBefore = (time: string): string =>
  adjustTimeByHours(time, -2);

interface AttendanceRecord {
  inTime: string;
  outTime: string;
}

const ProcessBlankTimes = async (
  attendanceData: AttendanceRecord[],
  regularInTime: string,
  regularOutTime: string,
  offDay: string,
  morningShiftStartTime?: string,
  morningShiftEndTime ?: string,
  morningShiftDays?: number[],
  nightDutyStartTime?: string,
  nightDutyEndTime?: string,
  nightDutyDays?: number[]
) => {
  const currentMonthDetails = await getCurrentMonthDetails();

  if (
    currentMonthDetails &&
    typeof currentMonthDetails === "object" &&
    "message" in currentMonthDetails &&
    "status" in currentMonthDetails
  ) {
    throw new Error(
      typeof currentMonthDetails.message === 'string' 
        ? currentMonthDetails.message 
        : 'No active month found'
    );
  }

  const { startDay, holidays } = currentMonthDetails;

  // Fetch global winter settings
  let isWinterEnabled = false;
  let winterStartDay: number | null = null;
  let winterEndDay: number | null = null;
  try {
    const settings = await prisma.$queryRawUnsafe<Array<{ isWinter: number; winterStartDay: number | null; winterEndDay: number | null }>>(
      'SELECT isWinter, winterStartDay, winterEndDay FROM settings WHERE id = 1 LIMIT 1'
    );
    if (settings && settings.length > 0) {
      isWinterEnabled = Boolean(settings[0].isWinter);
      winterStartDay = settings[0].winterStartDay;
      winterEndDay = settings[0].winterEndDay;
    }
  } catch {}

  // Get winter placeholders from month details
  const details = currentMonthDetails as DayDetailsType;
  const winterRegularInAdjustment = parseWinterAdjustment(
    details.winterRegularInPlaceholder
  );
  const winterRegularOutAdjustment = parseWinterAdjustment(
    details.winterRegularOutPlaceholder
  );
  const winterMorningInAdjustment = parseWinterAdjustment(
    details.winterMorningInPlaceholder
  );
  const winterMorningOutAdjustment = parseWinterAdjustment(
    details.winterMorningOutPlaceholder
  );
  const winterNightInAdjustment = parseWinterAdjustment(
    details.winterNightInPlaceholder
  );
  const winterNightOutAdjustment = parseWinterAdjustment(
    details.winterNightOutPlaceholder
  );

  const processedData = attendanceData.map((record, index) => {
    const dayOfWeekIndex = (startDay + index) % 7;
    const dayOfWeekName = daysOfWeek[dayOfWeekIndex];
    const dayOfMonth = index + 1;

    const isDayOff = dayOfWeekName.toLowerCase() === offDay.toLowerCase();
    const isHoliday = holidays.includes(dayOfMonth);
    const isOff = isDayOff || isHoliday;
    const isMorningShift = morningShiftDays?.includes(dayOfMonth) || false;
    const isNightDuty = nightDutyDays?.includes(dayOfMonth) || false;

    // Check if winter applies for this day
    const isWinterDay = Boolean(
      isWinterEnabled && 
      winterStartDay && 
      dayOfMonth >= winterStartDay &&
      (!winterEndDay || dayOfMonth <= winterEndDay)
    );

    const nextDayIndex = (startDay + index + 1) % 7;
    const nextDayName = daysOfWeek[nextDayIndex];
    const isDayBeforeOff = nextDayName.toLowerCase() === offDay.toLowerCase();

    let inTime = record.inTime;
    let outTime = record.outTime;

    // Determine the appropriate duty times based on shift type and winter settings
    let dutyInTime = regularInTime;
    let dutyOutTime = regularOutTime;
    
    const allowWinterOutAdjustment = !(isDayBeforeOff && !isHoliday);

    if (isNightDuty && nightDutyStartTime && nightDutyEndTime) {
      const adjusted = applyWinterAdjustments({
        baseStart: nightDutyStartTime,
        baseEnd: nightDutyEndTime,
        inAdjustment: winterNightInAdjustment ?? undefined,
        outAdjustment: winterNightOutAdjustment ?? undefined,
        isWinterDay,
        allowOutAdjustment: allowWinterOutAdjustment,
        baseEndNextDay: true,
      });
      dutyInTime = adjusted.start;
      dutyOutTime = adjusted.end;
    } else if (isMorningShift && morningShiftStartTime && morningShiftEndTime) {
      const adjusted = applyWinterAdjustments({
        baseStart: morningShiftStartTime,
        baseEnd: morningShiftEndTime,
        inAdjustment: winterMorningInAdjustment ?? undefined,
        outAdjustment: winterMorningOutAdjustment ?? undefined,
        isWinterDay,
        allowOutAdjustment: allowWinterOutAdjustment,
      });
      dutyInTime = adjusted.start;
      dutyOutTime = adjusted.end;
    } else {
      const adjusted = applyWinterAdjustments({
        baseStart: regularInTime,
        baseEnd: regularOutTime,
        inAdjustment: winterRegularInAdjustment ?? undefined,
        outAdjustment: winterRegularOutAdjustment ?? undefined,
        isWinterDay,
        allowOutAdjustment: allowWinterOutAdjustment,
      });
      dutyInTime = adjusted.start;
      dutyOutTime = adjusted.end;
    }

    const isShiftDay = isMorningShift || isNightDuty;

    if (inTime === "NA" && outTime === "NA") {
      if (isOff) {
        return { inTime, outTime };
      } else if (isShiftDay) {
        return { inTime: "NA", outTime: "NA" };
      } else {
        inTime = dutyInTime;
        outTime = isDayBeforeOff && !isHoliday ? calculateTwoHoursBefore(dutyOutTime) : dutyOutTime;
      }
    } else {
      if (inTime === "NA") {
        inTime = dutyInTime;
      }
      if (outTime === "NA") {
        outTime =
          isDayBeforeOff && !isHoliday
            ? calculateTwoHoursBefore(dutyOutTime)
            : dutyOutTime;
      }
    }

    return { inTime, outTime };
  });

  return processedData;
};

export default ProcessBlankTimes;
