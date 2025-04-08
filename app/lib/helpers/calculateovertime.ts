import getCurrentMonthDetails from "@/app/services/DayDetails";
import { AttendanceRecord } from "@/app/types/InputFormType";
import dayjs from "dayjs";

const dayNames = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

function parseTime(timeStr: string, dayOffset = 0) {
  const [h, m] = timeStr.split(":").map(Number);
  return dayjs()
    .startOf("day")
    .add(dayOffset, "day")
    .add(h, "hour")
    .add(m || 0, "minute");
}

function formatTime(time: dayjs.Dayjs) {
  return time.format("HH:mm");
}

function calculateDuration(startStr: string, endStr: string): number {
  const start = parseTime(startStr);
  const end = parseTime(endStr, endStr < startStr ? 1 : 0);
  return end.diff(start, "minute") / 60;
}

function getDayName(startDay: number, dayIndex: number) {
  return dayNames[(startDay + dayIndex) % 7];
}

function getOvertimeIntervals(
  inTime: string,
  outTime: string,
  dutyStart: string,
  dutyEnd: string,
  isHoliday: boolean,
  isNight: boolean
) {
  const result: {
    beforeDuty?: [string, string];
    afterDuty?: [string, string];
    night?: [string, string];
    holiday?: [string, string];
  } = {};

  const start = parseTime(inTime);
  let end = parseTime(outTime);
  if (end.isBefore(start)) {
    end = end.add(1, "day"); // overnight shift
  }

  const dutyStartTime = parseTime(dutyStart);
  const dutyEndTime = parseTime(dutyEnd);
  const midnight = dayjs().startOf("day").add(1, "day");

  if (isHoliday) {
    if (!isNight)
    result.holiday = [formatTime(start), formatTime(end)];
    else
    result.holiday = [formatTime(start), "23:00"];

    if (isNight) {
      const nightStart = dayjs().startOf("day").add(1, "day");
      if (end.isAfter(nightStart)) {
        result.night = [formatTime(nightStart), formatTime(end)];
      }
    }
    return result;
  }

  if (start.isBefore(dutyStartTime)) {
    result.beforeDuty = [formatTime(start), formatTime(dutyStartTime)];
  }

  if (end.isAfter(dutyEndTime) && end.isBefore(midnight)) {
    result.afterDuty = [formatTime(dutyEndTime), formatTime(end)];
  } else if (end.isAfter(midnight)) {
    result.afterDuty = [formatTime(dutyEndTime), formatTime(midnight)];
    result.night = [formatTime(midnight), formatTime(end)];
  }

  return result;
}

const CalculateOvertime = async (
  attendanceData: AttendanceRecord[],
  nightDutyDays: number[] = [],
  regularStart: string,
  regularEnd: string,
  regularOffDay: string
) => {
  const currentMonthDetails = await getCurrentMonthDetails();
  const { startDay, holidays, numberOfDays } = currentMonthDetails;

  const nightStart = "17:00";
  const nightEnd = "23:00";

  const results: {
    day: number;
    beforeDuty?: [string, string];
    afterDuty?: [string, string];
    night?: [string, string];
    holiday?: [string, string];
    totalHours: number;
    totalNightHours: number;
    isHolidayOvertime: boolean;
    typeOfHoliday: string | null;
    hasBeforeDutyOvertime: boolean;
    hasAfterDutyOvertime: boolean;
    hasNightOvertime: boolean;
  }[] = [];

  for (let i = 0; i < numberOfDays; i++) {
    const record = attendanceData[i];
    const dayNumber = i + 1;

    if (!record || record.inTime === "NA" || record.outTime === "NA") {
      continue;
    }

    const currentDayName = getDayName(startDay, i);
    const isOffDay =
      currentDayName.toLowerCase() === regularOffDay.toLowerCase();
    const isCHD = holidays.includes(dayNumber);
    const isHoliday = isOffDay || isCHD;

    let typeOfHoliday = null;
    if (isOffDay && isCHD) typeOfHoliday = "OFF+CHD";
    else if (isOffDay) typeOfHoliday = "OFF";
    else if (isCHD) typeOfHoliday = "CHD";

    const isNightDuty = nightDutyDays.includes(dayNumber);
    const dutyStartTime = isNightDuty ? nightStart : regularStart;
    const dutyEndTime = isNightDuty ? nightEnd : regularEnd;

    const overtime = getOvertimeIntervals(
      record.inTime,
      record.outTime,
      dutyStartTime,
      dutyEndTime,
      isHoliday,
      isNightDuty
    );

    let total = 0;
    let nightTotal = 0
    const hasBeforeDutyOvertime = !!overtime.beforeDuty;
    const hasAfterDutyOvertime = !!overtime.afterDuty;
    const hasNightOvertime = !!overtime.night;
    const isHolidayOvertime = !!overtime.holiday;

    if (hasBeforeDutyOvertime) {
      total += calculateDuration(...overtime.beforeDuty!);
    }
    if (hasAfterDutyOvertime) {
      total += calculateDuration(...overtime.afterDuty!);
    }
    if (isHolidayOvertime) {
      total += calculateDuration(...overtime.holiday!);
    }
    if (hasNightOvertime && !isNightDuty) {
      total += calculateDuration(...overtime.night!);
    }
    if (hasNightOvertime && isNightDuty) nightTotal += calculateDuration(...overtime.night!)

    results.push({
      day: dayNumber,
      ...overtime,
      totalHours: parseFloat(total.toFixed(2)),
      totalNightHours:parseFloat(nightTotal.toFixed(2)),
      isHolidayOvertime,
      typeOfHoliday,
      hasBeforeDutyOvertime,
      hasAfterDutyOvertime,
      hasNightOvertime,
    });
  }

  return results
};

export default CalculateOvertime;
