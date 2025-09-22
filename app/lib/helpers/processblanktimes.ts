import getCurrentMonthDetails from "@/app/services/DayDetails";
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
  morningShiftEndTime?: string,
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
    return;
  }

  const { startDay, holidays } = currentMonthDetails;

  const processedData = attendanceData.map((record, index) => {
    const dayOfWeekIndex = (startDay + index) % 7;
    const dayOfWeekName = daysOfWeek[dayOfWeekIndex];
    const dayOfMonth = index + 1;

    const isDayOff = dayOfWeekName.toLowerCase() === offDay.toLowerCase();
    const isHoliday = holidays.includes(dayOfMonth);
    const isOff = isDayOff || isHoliday;
    const isMorningShift = morningShiftDays?.includes(dayOfMonth) || false;
    const isNightDuty = nightDutyDays?.includes(dayOfMonth) || false;

    const nextDayIndex = (startDay + index + 1) % 7;
    const nextDayName = daysOfWeek[nextDayIndex];
    const isDayBeforeOff = nextDayName.toLowerCase() === offDay.toLowerCase();

    let inTime = record.inTime;
    let outTime = record.outTime;

    // Determine the appropriate duty times based on shift type
    let dutyInTime = regularInTime;
    let dutyOutTime = regularOutTime;
    
    if (isNightDuty && nightDutyStartTime && nightDutyEndTime) {
      dutyInTime = nightDutyStartTime;
      dutyOutTime = nightDutyEndTime;
    } else if (isMorningShift && morningShiftStartTime && morningShiftEndTime) {
      dutyInTime = morningShiftStartTime;
      dutyOutTime = morningShiftEndTime;
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
