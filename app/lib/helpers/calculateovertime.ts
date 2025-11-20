import getCurrentMonthDetails from "@/app/services/DayDetails";
import { AttendanceRecord } from "@/app/types/InputFormType";
import dayjs from "dayjs";
import {
  adjustTimeByHours,
  applyWinterAdjustments,
  parseWinterAdjustment,
} from "@/app/lib/helpers/winterTimeAdjustments";

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
  let end = parseTime(endStr);
  if (end.isBefore(start) || end.isSame(start)) {
    end = end.add(1, "day");
  }
  const totalMinutes = end.diff(start, "minute");
  const roundedToNearest30 = Math.round(totalMinutes / 30) * 30;
  return roundedToNearest30 / 60;
}

function getDayName(startDay: number, dayIndex: number) {
  return dayNames[(startDay + dayIndex) % 7];
}

function calculateTwoHoursBefore(time: string): string {
  return adjustTimeByHours(time, -2);
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
  isMorning: boolean
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
  let nightEndTime = parseTime(nightDutyEnd);
  const baseNightEnd = nightEndTime;
  if (nightEndTime.isBefore(nightStartTime) || nightEndTime.isSame(nightStartTime)) {
    nightEndTime = nightEndTime.add(1, "day");
  }

  if (isHoliday) {
    // For holidays, if inTime is before duty start time, calculate beforeDuty separately
    // This ensures column C is filled correctly for holidays and Dashain/Tihar days
    if (start.isBefore(dutyStartTime)) {
      result.beforeDuty = [formatTime(start), formatTime(dutyStartTime)];
      // On holidays, all time from duty start to end is treated as holiday overtime (no capping to duty end)
      if (end.isAfter(midnight)) {
        result.holiday = [formatTime(dutyStartTime), formatTime(midnight)];
        result.night = [formatTime(midnight), formatTime(end)];
      } else {
        result.holiday = [formatTime(dutyStartTime), formatTime(end)];
      }
    } else {
      // If inTime is not before duty start, all time from start to end is holiday overtime
      if (end.isAfter(midnight)) {
        result.holiday = [formatTime(start), formatTime(midnight)];
        result.night = [formatTime(midnight), formatTime(end)];
      } else {
        result.holiday = [formatTime(start), formatTime(end)];
      }
    }
    return result;
  }

  const mergeNightSegment = (segmentStart: dayjs.Dayjs, segmentEnd: dayjs.Dayjs) => {
    if (segmentEnd.isBefore(segmentStart) || segmentEnd.isSame(segmentStart)) {
      segmentEnd = segmentEnd.add(1, "day");
    }

    if (!result.night) {
      result.night = [formatTime(segmentStart), formatTime(segmentEnd)];
    } else {
      const existingStart = parseTime(result.night[0]);
      let existingEnd = parseTime(result.night[1]);
      if (existingEnd.isBefore(existingStart) || existingEnd.isSame(existingStart)) {
        existingEnd = existingEnd.add(1, "day");
      }
      const newStart = segmentStart.isBefore(existingStart)
        ? segmentStart
        : existingStart;
      const newEnd = segmentEnd.isAfter(existingEnd)
        ? segmentEnd
        : existingEnd;
      result.night = [formatTime(newStart), formatTime(newEnd)];
    }
  };

  if (isNight) {
    if (start.isBefore(nightStartTime)) {
      result.beforeDuty = [formatTime(start), formatTime(nightStartTime)];
    }

    if (end.isAfter(midnight)) {
      const nightSegmentStart = start.isAfter(nightStartTime)
        ? start
        : nightStartTime;
      const clampedNightStart = nightSegmentStart.isBefore(midnight)
        ? midnight
        : nightSegmentStart;

      let nightSegmentEnd: dayjs.Dayjs;
      if (end.isAfter(nightEndTime)) {
        nightSegmentEnd = nightEndTime;
      } else if (end.isAfter(midnight)) {
        nightSegmentEnd = end;
      } else {
        nightSegmentEnd = end;
      }

      if (nightSegmentEnd.isAfter(clampedNightStart)) {
        mergeNightSegment(clampedNightStart, nightSegmentEnd);
      }

      if (end.isAfter(nightSegmentEnd)) {
        result.afterDuty = [formatTime(nightSegmentEnd), formatTime(end)];
      }
    } else if (end.isAfter(baseNightEnd)) {
      result.afterDuty = [formatTime(baseNightEnd), formatTime(end)];
    }
  } else if (isMorning) {
    // For regular morning shift, only time outside the morning window is overtime
    if (start.isBefore(dutyStartTime)) {
      result.beforeDuty = [formatTime(start), formatTime(dutyStartTime)];
    }
    if (end.isAfter(dutyEndTime)) {
      result.afterDuty = [formatTime(dutyEndTime), formatTime(end)];
    }
    // Optionally, you could add a 'morning' key for the main shift window
    result.morning = [formatTime(dutyStartTime), formatTime(dutyEndTime)];
  } else {
    // For regular duty
    if (start.isBefore(dutyStartTime)) {
      result.beforeDuty = [formatTime(start), formatTime(dutyStartTime)];
    }
    if (end.isAfter(dutyEndTime) && end.isBefore(midnight)) {
      result.afterDuty = [formatTime(dutyEndTime), formatTime(end)];
    } else if (end.isAfter(midnight)) {
      result.afterDuty = [formatTime(dutyEndTime), formatTime(midnight)];
      mergeNightSegment(midnight, end);
    }
  }

  if (result.afterDuty) {
    const afterStart = parseTime(result.afterDuty[0]);
    let afterEnd = parseTime(result.afterDuty[1]);
    if (afterEnd.isBefore(afterStart) || afterEnd.isSame(afterStart)) {
      afterEnd = afterEnd.add(1, "day");
    }

    if (afterStart.isAfter(midnight) || afterStart.isSame(midnight)) {
      mergeNightSegment(afterStart, afterEnd);
      delete result.afterDuty;
    } else if (afterEnd.isAfter(midnight)) {
      result.afterDuty[1] = formatTime(midnight);
      mergeNightSegment(midnight, afterEnd);
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
  morningShiftEnd: string = "",
  departmentId?: number
) => {
  const currentMonthDetails = await getCurrentMonthDetails();
  
  // Fetch global winter settings
  let isWinterEnabled = false;
  let winterStartDay: number | null = null;
  try {
    const prisma = (await import("@/app/lib/prisma")).default;
    const settings = await prisma.$queryRawUnsafe<Array<{ isWinter: number; winterStartDay: number | null }>>(
      'SELECT isWinter, winterStartDay FROM settings WHERE id = 1 LIMIT 1'
    );
    if (settings && settings.length > 0) {
      isWinterEnabled = Boolean(settings[0].isWinter);
      winterStartDay = settings[0].winterStartDay;
    }
  } catch {}
  
  // Fetch department-specific winter placeholders if departmentId is provided
  let departmentInfo: {
    winterRegularInPlaceholder?: string | null;
    winterRegularOutPlaceholder?: string | null;
    winterMorningInPlaceholder?: string | null;
    winterMorningOutPlaceholder?: string | null;
    winterNightInPlaceholder?: string | null;
    winterNightOutPlaceholder?: string | null;
  } | null = null;
  if (departmentId) {
    try {
      const prisma = (await import("@/app/lib/prisma")).default;
      const dept = await prisma.department.findUnique({
        where: { id: departmentId },
        select: {
          winterRegularInPlaceholder: true,
          winterRegularOutPlaceholder: true,
          winterMorningInPlaceholder: true,
          winterMorningOutPlaceholder: true,
          winterNightInPlaceholder: true,
          winterNightOutPlaceholder: true,
        },
      });
      if (dept) {
        departmentInfo = dept;
      }
    } catch {}
  }
  
  // Get winter placeholders from department (preferred) or fallback to month details
  const resolveAdjustment = (
    departmentValue?: string | null,
    monthValue?: string | null
  ) =>
    parseWinterAdjustment(
      departmentValue ??
        (typeof monthValue === "string" ? monthValue : undefined)
    );

  const winterRegularInAdjustment = resolveAdjustment(
    departmentInfo?.winterRegularInPlaceholder,
    "winterRegularInPlaceholder" in currentMonthDetails
      ? currentMonthDetails.winterRegularInPlaceholder
      : undefined
  );
  const winterRegularOutAdjustment = resolveAdjustment(
    departmentInfo?.winterRegularOutPlaceholder,
    "winterRegularOutPlaceholder" in currentMonthDetails
      ? currentMonthDetails.winterRegularOutPlaceholder
      : undefined
  );
  const winterMorningInAdjustment = resolveAdjustment(
    departmentInfo?.winterMorningInPlaceholder,
    "winterMorningInPlaceholder" in currentMonthDetails
      ? currentMonthDetails.winterMorningInPlaceholder
      : undefined
  );
  const winterMorningOutAdjustment = resolveAdjustment(
    departmentInfo?.winterMorningOutPlaceholder,
    "winterMorningOutPlaceholder" in currentMonthDetails
      ? currentMonthDetails.winterMorningOutPlaceholder
      : undefined
  );
  const winterNightInAdjustment = resolveAdjustment(
    departmentInfo?.winterNightInPlaceholder,
    "winterNightInPlaceholder" in currentMonthDetails
      ? currentMonthDetails.winterNightInPlaceholder
      : undefined
  );
  const winterNightOutAdjustment = resolveAdjustment(
    departmentInfo?.winterNightOutPlaceholder,
    "winterNightOutPlaceholder" in currentMonthDetails
      ? currentMonthDetails.winterNightOutPlaceholder
      : undefined
  );

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
      totalDashainHours: number;
      totalTiharHours: number;
      isHolidayOvertime: boolean;
      isDashainOvertime: boolean;
      isTiharOvertime: boolean;
      typeOfHoliday: string | null;
      hasBeforeDutyOvertime: boolean;
      hasAfterDutyOvertime: boolean;
      hasNightOvertime: boolean;
      hasMorningOvertime: boolean;
      totalChdHours: number;
      totalOffHours: number;
      totalRegularOvertimeHours: number;
    }[] = [];

    for (let i = 0; i < numberOfDays; i++) {
      const record = attendanceData[i];
      const dayNumber = i + 1;

      const currentDayName = getDayName(startDay, i);
      const isOffDay =
        currentDayName.toLowerCase() === regularOffDay.toLowerCase();
      const isCHD = holidays.includes(dayNumber);
      
      // Check if this is a Dashain day
      const isDashainDay = Boolean('isDashainMonth' in currentMonthDetails && currentMonthDetails.isDashainMonth) && 
                           Array.isArray(('dashainDays' in currentMonthDetails ? currentMonthDetails.dashainDays : undefined)) &&
                           (('dashainDays' in currentMonthDetails && currentMonthDetails.dashainDays) ? currentMonthDetails.dashainDays!.includes(dayNumber) : false);

      // Check if this is a Tihar day
      const isTiharDay = Boolean('isTiharMonth' in currentMonthDetails && currentMonthDetails.isTiharMonth) && 
                         Array.isArray(('tiharDays' in currentMonthDetails ? currentMonthDetails.tiharDays : undefined)) &&
                         (('tiharDays' in currentMonthDetails && currentMonthDetails.tiharDays) ? currentMonthDetails.tiharDays!.includes(dayNumber) : false);
      
      // Treat Dashain/Tihar days as holidays for overtime calculation purposes
      const isHoliday = isOffDay || isCHD || isDashainDay || isTiharDay;
      const isNightDuty = nightDutyDays.includes(dayNumber);
      const isMorningShift = morningShiftDays.includes(dayNumber);

      // Check if winter applies for this day
      const isWinterDay = Boolean(
        isWinterEnabled && winterStartDay && dayNumber >= winterStartDay
      );

      // Check if next day is off day
      const nextDayIndex = (startDay + i + 1) % 7;
      const nextDayName = dayNames[nextDayIndex];
      const isDayBeforeOff = nextDayName.toLowerCase() === regularOffDay.toLowerCase();

      // Determine type of holiday
      const typeOfHoliday = isDashainDay 
        ? "DASHAIN" 
        : isTiharDay 
        ? "TIHAR" 
        : (isOffDay && isCHD 
          ? "OFF+CHD" 
          : isOffDay 
          ? "OFF" 
          : isCHD 
          ? "CHD" 
          : null);

      // Determine duty times based on shift type and winter settings
      let dutyStartTime: string;
      let dutyEndTime: string;
      
      const allowWinterOutOffset = !(isDayBeforeOff && !isHoliday);

      if (isNightDuty) {
        const adjusted = applyWinterAdjustments({
          baseStart: nightDutyStart,
          baseEnd: nightDutyEnd,
          inAdjustment: winterNightInAdjustment ?? undefined,
          outAdjustment: winterNightOutAdjustment ?? undefined,
          isWinterDay,
          allowOutAdjustment: allowWinterOutOffset,
          baseEndNextDay: true,
        });
        dutyStartTime = adjusted.start;
        dutyEndTime = adjusted.end;
        if (isDayBeforeOff && !isHoliday) {
          dutyEndTime = calculateTwoHoursBefore(dutyEndTime);
        }
      } else if (isMorningShift) {
        const adjusted = applyWinterAdjustments({
          baseStart: morningShiftStart,
          baseEnd: morningShiftEnd,
          inAdjustment: winterMorningInAdjustment ?? undefined,
          outAdjustment: winterMorningOutAdjustment ?? undefined,
          isWinterDay,
          allowOutAdjustment: allowWinterOutOffset,
        });
        dutyStartTime = adjusted.start;
        dutyEndTime = adjusted.end;
        if (isDayBeforeOff && !isHoliday) {
          dutyEndTime = calculateTwoHoursBefore(dutyEndTime);
        }
      } else {
        const adjusted = applyWinterAdjustments({
          baseStart: regularStart,
          baseEnd: regularEnd,
          inAdjustment: winterRegularInAdjustment ?? undefined,
          outAdjustment: winterRegularOutAdjustment ?? undefined,
          isWinterDay,
          allowOutAdjustment: allowWinterOutOffset,
        });
        dutyStartTime = adjusted.start;
        dutyEndTime = adjusted.end;
        if (isDayBeforeOff && !isHoliday) {
          dutyEndTime = calculateTwoHoursBefore(dutyEndTime);
        }
      }

      if (!record || record.inTime === "NA" || record.outTime === "NA") {
        results.push({
          day: dayNumber,
          currentMonth: name,
          totalHours: 0,
          totalNightHours: 0,
          totalDashainHours: 0,
          totalTiharHours: 0,
          isHolidayOvertime: isHoliday && !isDashainDay && !isTiharDay,
          isDashainOvertime: isDashainDay,
          isTiharOvertime: isTiharDay,
          typeOfHoliday: typeOfHoliday,
          hasBeforeDutyOvertime: false,
          hasAfterDutyOvertime: false,
          hasNightOvertime: false,
          hasMorningOvertime: false,
          totalChdHours: 0,
          totalOffHours: 0,
          totalRegularOvertimeHours: 0,
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
        dutyStartTime,
        dutyEndTime,
        isMorningShift
      );

      let total = 0;
      let nightTotal = 0;
      let dashainTotal = 0;
      let tiharTotal = 0;
      let totalChdHours = 0;
      let totalOffHours = 0;
      let totalRegularOvertimeHours = 0;

      const hasBeforeDutyOvertime = !!overtime.beforeDuty;
      const hasAfterDutyOvertime = !!overtime.afterDuty;
      const hasNightOvertime = !!overtime.night;
      const hasMorningOvertime = !!overtime.morning;
      const hasHolidayOvertime = !!overtime.holiday;

      const beforeDutyHours = hasBeforeDutyOvertime
        ? calculateDuration(...overtime.beforeDuty!)
        : 0;
      const afterDutyHours = hasAfterDutyOvertime
        ? calculateDuration(...overtime.afterDuty!)
        : 0;
      const nightHours = hasNightOvertime
        ? calculateDuration(...overtime.night!)
        : 0;
      const holidayHours = hasHolidayOvertime
        ? calculateDuration(...overtime.holiday!)
        : 0;

      // Calculate overtime based on whether it's a Dashain or Tihar day
      if (isDashainDay) {
        // For Dashain days, all overtime goes to Dashain total
        dashainTotal += beforeDutyHours + afterDutyHours + holidayHours;
        nightTotal += nightHours;
        // For Dashain/Tihar days, treat as CHD days - all hours go to CHD column (G)
        // Total hours = beforeDuty + afterDuty + holidayHours (all hours worked on the holiday)
        totalChdHours = beforeDutyHours + afterDutyHours + holidayHours;
        // No regular overtime hours for Dashain/Tihar days (I column should be 0)
        totalRegularOvertimeHours = 0;
        totalOffHours = 0;
      } else if (isTiharDay) {
        // For Tihar days, all overtime goes to Tihar total
        tiharTotal += beforeDutyHours + afterDutyHours + holidayHours;
        nightTotal += nightHours;
        // For Dashain/Tihar days, treat as CHD days - all hours go to CHD column (G)
        // Total hours = beforeDuty + afterDuty + holidayHours (all hours worked on the holiday)
        totalChdHours = beforeDutyHours + afterDutyHours + holidayHours;
        // No regular overtime hours for Dashain/Tihar days (I column should be 0)
        totalRegularOvertimeHours = 0;
        totalOffHours = 0;
      } else {
        // For non Dashain/Tihar days
        nightTotal += nightHours;

        if (typeOfHoliday?.includes("CHD") || typeOfHoliday?.includes("OFF")) {
          // Holiday (CHD or OFF) days: put ALL worked hours into the holiday bucket and ZERO regular
          const allWorkedOnHoliday = beforeDutyHours + afterDutyHours + holidayHours;
          totalRegularOvertimeHours = 0;
          if (typeOfHoliday?.includes("CHD")) {
            totalChdHours = allWorkedOnHoliday;
            totalOffHours = 0;
          } else {
            // OFF only
            totalOffHours = allWorkedOnHoliday;
            totalChdHours = 0;
          }
          total += allWorkedOnHoliday;
        } else {
          // Pure regular day
          total += beforeDutyHours + afterDutyHours + holidayHours;
          // Regular overtime is always before duty + after duty (excluding holiday hours)
          totalRegularOvertimeHours = beforeDutyHours + afterDutyHours;
          totalChdHours = 0;
          totalOffHours = 0;
        }
      }
      // For morning shift, overtime is only before/after the shift, not the main shift window

      results.push({
        day: dayNumber,
        currentMonth: name,
        ...overtime,
        totalHours: total, // Keep 0.5 hour increments
        totalNightHours: nightTotal, // Keep 0.5 hour increments
        totalDashainHours: dashainTotal, // Keep 0.5 hour increments
        totalTiharHours: tiharTotal, // Keep 0.5 hour increments
        isHolidayOvertime: hasHolidayOvertime && !isDashainDay && !isTiharDay,
        isDashainOvertime: isDashainDay,
        isTiharOvertime: isTiharDay,
        typeOfHoliday: typeOfHoliday,
        hasBeforeDutyOvertime,
        hasAfterDutyOvertime,
        hasNightOvertime,
        hasMorningOvertime,
        totalChdHours,
        totalOffHours,
        totalRegularOvertimeHours,
      });
    }

    return results;
  }
};

export default CalculateOvertime;
