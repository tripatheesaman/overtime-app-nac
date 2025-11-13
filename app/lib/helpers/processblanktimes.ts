import getCurrentMonthDetails from "@/app/services/DayDetails";
import { DayDetailsType } from "@/app/types/DayDetailType";
import prisma from "@/app/lib/prisma";
import dayjs from "dayjs";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const calculateTwoHoursBefore = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = dayjs().hour(hours).minute(minutes);
  const twoHoursBefore = date.subtract(2, "hour");
  return twoHoursBefore.format("HH:mm");
};

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
  try {
    const settings = await prisma.$queryRawUnsafe<Array<{ isWinter: number; winterStartDay: number | null }>>(
      'SELECT isWinter, winterStartDay FROM Settings WHERE id = 1 LIMIT 1'
    );
    if (settings && settings.length > 0) {
      isWinterEnabled = Boolean(settings[0].isWinter);
      winterStartDay = settings[0].winterStartDay;
    }
  } catch {}

  // Get winter placeholders from month details
  const details = currentMonthDetails as DayDetailsType;
  const winterRegularIn = details.winterRegularInPlaceholder || undefined;
  const winterRegularOut = details.winterRegularOutPlaceholder || undefined;
  const winterMorningIn = details.winterMorningInPlaceholder || undefined;
  const winterMorningOut = details.winterMorningOutPlaceholder || undefined;
  const winterNightIn = details.winterNightInPlaceholder || undefined;
  const winterNightOut = details.winterNightOutPlaceholder || undefined;

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
    const isWinterDay = isWinterEnabled && winterStartDay && dayOfMonth >= winterStartDay;

    const nextDayIndex = (startDay + index + 1) % 7;
    const nextDayName = daysOfWeek[nextDayIndex];
    const isDayBeforeOff = nextDayName.toLowerCase() === offDay.toLowerCase();

    let inTime = record.inTime;
    let outTime = record.outTime;

    // Determine the appropriate duty times based on shift type and winter settings
    let dutyInTime = regularInTime;
    let dutyOutTime = regularOutTime;
    
    if (isNightDuty && nightDutyStartTime && nightDutyEndTime) {
      // Use winter placeholders if available and winter applies
      if (isWinterDay && winterNightIn && winterNightOut) {
        dutyInTime = winterNightIn;
        dutyOutTime = winterNightOut;
      } else {
        dutyInTime = nightDutyStartTime;
        dutyOutTime = nightDutyEndTime;
      }
    } else if (isMorningShift && morningShiftStartTime && morningShiftEndTime) {
      // Use winter placeholders if available and winter applies
      if (isWinterDay && winterMorningIn && winterMorningOut) {
        dutyInTime = winterMorningIn;
        dutyOutTime = winterMorningOut;
      } else {
        dutyInTime = morningShiftStartTime;
        dutyOutTime = morningShiftEndTime;
      }
    } else {
      // Regular duty - use winter placeholders if available and winter applies
      if (isWinterDay && winterRegularIn && winterRegularOut) {
        dutyInTime = winterRegularIn;
        dutyOutTime = winterRegularOut;
      }
    }

    if (inTime === "NA" && outTime === "NA") {
      if (isOff) {
        return { inTime, outTime };
      } else {
        inTime = dutyInTime;
        outTime = isDayBeforeOff && !isHoliday ? calculateTwoHoursBefore(dutyOutTime) : dutyOutTime;
      }
    } else {
      if (inTime === "NA") {
        inTime = dutyInTime;
      }
      if (outTime === "NA") {
        outTime = isDayBeforeOff && !isHoliday ? calculateTwoHoursBefore(dutyOutTime) : dutyOutTime;
      }
    }

    return { inTime, outTime };
  });

  return processedData;
};

export default ProcessBlankTimes;
