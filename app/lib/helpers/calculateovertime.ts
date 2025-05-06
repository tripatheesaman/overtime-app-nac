import getCurrentMonthDetails from "@/app/services/DayDetails";
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
  attendanceData: any[],
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

    // Process each day
    for (let day = 1; day <= numberOfDays; day++) {
      const dayIndex = day - 1;
      const dayOfWeekIndex = (startDay + dayIndex) % 7;
      const dayOfWeekName = dayNames[dayOfWeekIndex];
      const isDayOff = dayOfWeekName.toLowerCase() === regularOffDay.toLowerCase();
      const isHoliday = holidays.includes(day);
      const isOff = isDayOff || isHoliday;
      const isNightDuty = nightDutyDays.includes(day);
      const isMorningShift = morningShiftDays.includes(day);

      const record = attendanceData[dayIndex];
      if (!record) continue;

      const { inTime, outTime } = record;
      if (!inTime || !outTime) continue;

      const overtimeIntervals = getOvertimeIntervals(
        inTime,
        outTime,
        regularStart,
        regularEnd,
        isOff,
        isNightDuty,
        nightDutyStart,
        nightDutyEnd,
        isMorningShift,
        morningShiftStart,
        morningShiftEnd
      );

      let totalHours = 0;
      let totalNightHours = 0;

      if (overtimeIntervals.beforeDuty) {
        totalHours += calculateDuration(
          overtimeIntervals.beforeDuty[0],
          overtimeIntervals.beforeDuty[1]
        );
      }

      if (overtimeIntervals.afterDuty) {
        totalHours += calculateDuration(
          overtimeIntervals.afterDuty[0],
          overtimeIntervals.afterDuty[1]
        );
      }

      if (overtimeIntervals.night) {
        totalNightHours += calculateDuration(
          overtimeIntervals.night[0],
          overtimeIntervals.night[1]
        );
        totalHours += totalNightHours;
      }

      if (overtimeIntervals.holiday) {
        totalHours += calculateDuration(
          overtimeIntervals.holiday[0],
          overtimeIntervals.holiday[1]
        );
      }

      if (totalHours > 0) {
        results.push({
          day,
          currentMonth: name,
          ...overtimeIntervals,
          totalHours,
          totalNightHours,
          isHolidayOvertime: isOff,
          typeOfHoliday: isHoliday ? "Holiday" : isDayOff ? "Off Day" : null,
          hasBeforeDutyOvertime: !!overtimeIntervals.beforeDuty,
          hasAfterDutyOvertime: !!overtimeIntervals.afterDuty,
          hasNightOvertime: !!overtimeIntervals.night,
          hasMorningOvertime: !!overtimeIntervals.morning,
        });
      }
    }

    return results;
  }

  return [];
};

export default CalculateOvertime;
