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
  const totalMinutes = end.diff(start, "minute");
  const totalHours = totalMinutes / 60;
  
  // Round to nearest whole hour (no 30 minutes allowed)
  return Math.round(totalHours);
}

function getDayName(startDay: number, dayIndex: number) {
  return dayNames[(startDay + dayIndex) % 7];
}

function calculateTwoHoursBefore(time: string): string {
  const [hours, minutes] = time.split(":").map(Number);
  const date = dayjs().hour(hours).minute(minutes);
  const twoHoursBefore = date.subtract(2, "hour");
  return twoHoursBefore.format("HH:mm");
}

function getOvertimeIntervals(
  inTime: string,
  outTime: string,
  dutyStart: string,
  dutyEnd: string,
  isHoliday: boolean,
  isNight: boolean,
  nightDutyStart: string,
  nightDutyEnd: string,
  isMorning: boolean,
  morningShiftStart: string,
  morningShiftEnd: string
) {
  const result: {
    beforeDuty?: [string, string];
    afterDuty?: [string, string];
    night?: [string, string];
    holiday?: [string, string];
    morning?: [string, string];
  } = {};

  const start = parseTime(inTime);
  let end = parseTime(outTime);
  if (end.isBefore(start)) {
    end = end.add(1, "day"); // overnight shift
  }

  const dutyStartTime = parseTime(dutyStart);
  const dutyEndTime = parseTime(dutyEnd);
  const midnight = dayjs().startOf("day").add(1, "day");
  const nightStartTime = parseTime(nightDutyStart);
  const nightEndTime = parseTime(nightDutyEnd);
  const morningStartTime = parseTime(morningShiftStart);
  const morningEndTime = parseTime(morningShiftEnd);

  if (isHoliday) {
    if (isNight) {
      if (end.isAfter(midnight)) {
        result.holiday = [formatTime(start), formatTime(midnight)];
        result.night = [formatTime(midnight), formatTime(end)];
      } else {
        result.holiday = [formatTime(start), formatTime(end)];
      }
    } else if (isMorning) {
      // All time is overtime for morning shift on holiday
      result.holiday = [formatTime(start), formatTime(end)];
    } else {
      result.holiday = [formatTime(start), formatTime(end)];
    }
    return result;
  }

  if (isNight) {
    if (start.isBefore(nightStartTime)) {
      result.beforeDuty = [formatTime(start), formatTime(nightStartTime)];
    }
    if (end.isAfter(midnight)) {
      result.afterDuty = [formatTime(nightEndTime), formatTime(midnight)];
      result.night = [formatTime(midnight), formatTime(end)];
    } else if (end.isAfter(nightEndTime)) {
      result.afterDuty = [formatTime(nightEndTime), formatTime(end)];
    }
  } else if (isMorning) {
    // For regular morning shift, only time outside the morning window is overtime
    if (start.isBefore(morningStartTime)) {
      result.beforeDuty = [formatTime(start), formatTime(morningStartTime)];
    }
    if (end.isAfter(morningEndTime)) {
      result.afterDuty = [formatTime(morningEndTime), formatTime(end)];
    }
    // Optionally, you could add a 'morning' key for the main shift window
    result.morning = [formatTime(morningStartTime), formatTime(morningEndTime)];
  } else {
    // For regular duty
    if (start.isBefore(dutyStartTime)) {
      result.beforeDuty = [formatTime(start), formatTime(dutyStartTime)];
    }
    if (end.isAfter(dutyEndTime) && end.isBefore(midnight)) {
      result.afterDuty = [formatTime(dutyEndTime), formatTime(end)];
    } else if (end.isAfter(midnight)) {
      result.afterDuty = [formatTime(dutyEndTime), formatTime(midnight)];
      result.night = [formatTime(midnight), formatTime(end)];
    }
  }

  return result;
}

const CalculateOvertime = async (
  attendanceData: AttendanceRecord[],
  nightDutyDays: number[] = [],
  regularStart: string,
  regularEnd: string,
  regularOffDay: string,
  nightDutyStart: string,
  nightDutyEnd: string,
  morningShiftDays: number[] = [],
  morningShiftStart: string = "",
  morningShiftEnd: string = ""
) => {
  const currentMonthDetails = await getCurrentMonthDetails();

  if (
    "startDay" in currentMonthDetails &&
    "holidays" in currentMonthDetails &&
    "numberOfDays" in currentMonthDetails &&
    "name" in currentMonthDetails
  ) {
    const { startDay, holidays, numberOfDays, name } = currentMonthDetails;

    const results: {
      day: number;
      currentMonth: string;
      beforeDuty?: [string, string];
      afterDuty?: [string, string];
      night?: [string, string];
      holiday?: [string, string];
      morning?: [string, string];
      totalHours: number;
      totalNightHours: number;
      isHolidayOvertime: boolean;
      typeOfHoliday: string | null;
      hasBeforeDutyOvertime: boolean;
      hasAfterDutyOvertime: boolean;
      hasNightOvertime: boolean;
      hasMorningOvertime: boolean;
    }[] = [];

    for (let i = 0; i < numberOfDays; i++) {
      const record = attendanceData[i];
      const dayNumber = i + 1;

      const currentDayName = getDayName(startDay, i);
      const isOffDay =
        currentDayName.toLowerCase() === regularOffDay.toLowerCase();
      const isCHD = holidays.includes(dayNumber);
      const isHoliday = isOffDay || isCHD;
      const isNightDuty = nightDutyDays.includes(dayNumber);
      const isMorningShift = morningShiftDays.includes(dayNumber);

      // Check if next day is off day
      const nextDayIndex = (startDay + i + 1) % 7;
      const nextDayName = dayNames[nextDayIndex];
      const isDayBeforeOff = nextDayName.toLowerCase() === regularOffDay.toLowerCase();

      const dutyStartTime = isNightDuty ? nightDutyStart : (isMorningShift ? morningShiftStart : regularStart);
      const dutyEndTime = isNightDuty ? nightDutyEnd : (isMorningShift ? (isDayBeforeOff && !isHoliday ? calculateTwoHoursBefore(morningShiftEnd) : morningShiftEnd) : (isDayBeforeOff && !isHoliday ? calculateTwoHoursBefore(regularEnd) : regularEnd));

      if (!record || record.inTime === "NA" || record.outTime === "NA") {
        results.push({
          day: dayNumber,
          currentMonth: name,
          totalHours: 0,
          totalNightHours: 0,
          isHolidayOvertime: isHoliday,
          typeOfHoliday: isOffDay && isCHD ? "OFF+CHD" : isOffDay ? "OFF" : isCHD ? "CHD" : null,
          hasBeforeDutyOvertime: false,
          hasAfterDutyOvertime: false,
          hasNightOvertime: false,
          hasMorningOvertime: false,
        });
        continue;
      }

      const overtime = getOvertimeIntervals(
        record.inTime,
        record.outTime,
        dutyStartTime,
        dutyEndTime,
        isHoliday,
        isNightDuty,
        nightDutyStart,
        nightDutyEnd,
        isMorningShift,
        dutyStartTime,
        dutyEndTime
      );

      let total = 0;
      let nightTotal = 0;
      const hasBeforeDutyOvertime = !!overtime.beforeDuty;
      const hasAfterDutyOvertime = !!overtime.afterDuty;
      const hasNightOvertime = !!overtime.night;
      const hasMorningOvertime = !!overtime.morning;
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
      if (hasNightOvertime) {
        nightTotal += calculateDuration(...overtime.night!);
      }
      // For morning shift, overtime is only before/after the shift, not the main shift window

      results.push({
        day: dayNumber,
        currentMonth: name,
        ...overtime,
        totalHours: Math.round(total), // Ensure whole hours only
        totalNightHours: Math.round(nightTotal), // Ensure whole hours only
        isHolidayOvertime,
        typeOfHoliday: isOffDay && isCHD ? "OFF+CHD" : isOffDay ? "OFF" : isCHD ? "CHD" : null,
        hasBeforeDutyOvertime,
        hasAfterDutyOvertime,
        hasNightOvertime,
        hasMorningOvertime,
      });
    }

    return results;
  }
};

export default CalculateOvertime;
