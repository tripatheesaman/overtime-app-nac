import { AttendanceRecord } from "@/app/types/InputFormType";

// Get thresholds from environment variables with fallback to 30 minutes
const IN_TIME_THRESHOLD = Number(process.env.NEXT_PUBLIC_IN_TIME_THRESHOLD) || 30;
const OUT_TIME_THRESHOLD = Number(process.env.NEXT_PUBLIC_OUT_TIME_THRESHOLD) || 30;

const convertDecimalToRoundedTime = (
  decimalTime: number,
  isInTime: boolean = true,
  dutyTime: string
): string => {
  if (decimalTime === null || decimalTime === undefined) return "--"; // Handle missing values

  const totalMinutes = decimalTime * 24 * 60; // Convert fraction to total minutes
  let hours = Math.floor(totalMinutes / 60); // Extract hours
  let minutes = Math.round(totalMinutes % 60); // Extract minutes
  const timeInMinutes = hours * 60 + minutes;

  // Special morning window handling between 04:50 and 06:00 (applies to any in-time)
  // If in-time falls into this window and we're processing an in-time, apply special rules:
  // - if > 05:15 and < 05:35 => 05:30
  // - if <= 05:15 => 05:00
  // - if >= 05:35 => 06:00
  const specialWindowStart = 4 * 60 + 50; // 04:50
  const specialWindowEnd = 6 * 60; // 06:00
  const fiveFifteen = 5 * 60 + 15; // 05:15
  const fiveThirtyFive = 5 * 60 + 35; // 05:35
  if (isInTime && timeInMinutes >= specialWindowStart && timeInMinutes <= specialWindowEnd) {
    if (timeInMinutes > fiveFifteen && timeInMinutes < fiveThirtyFive) {
      return "05:30";
    }
    if (timeInMinutes <= fiveFifteen) {
      return "05:00";
    }
    return "06:00";
  }

  // Parse duty time to get the threshold (used only when very close to duty time)
  const [dutyHours, dutyMinutes] = dutyTime.split(":").map(Number);
  const dutyTimeInMinutes = dutyHours * 60 + dutyMinutes;

  // Calculate time difference in minutes
  const timeDiff = Math.abs(timeInMinutes - dutyTimeInMinutes);

  // If within configured threshold of duty time, snap to duty time
  const threshold = isInTime ? IN_TIME_THRESHOLD : OUT_TIME_THRESHOLD;
  if (timeDiff < threshold) {
    hours = dutyHours;
    minutes = dutyMinutes;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  // General rounding rules (no :30 here) — use thresholds to decide direction
  if (isInTime) {
    // For in time: if minutes > IN_TIME_THRESHOLD => round up, else round down
    if (minutes > IN_TIME_THRESHOLD) {
      minutes = 0;
      hours += 1;
    } else {
      minutes = 0;
    }
  } else {
    // For out time: if minutes >= OUT_TIME_THRESHOLD => round up, else round down
    if (minutes >= OUT_TIME_THRESHOLD) {
      minutes = 0;
      hours += 1;
    } else {
      minutes = 0;
    }
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

const processRawTime = (attendanceRecords: AttendanceRecord[], dutyStartTime: string, dutyEndTime: string): AttendanceRecord[] => {
  if (!attendanceRecords.length || !Array.isArray(attendanceRecords)) {
    return [];
  }

  return attendanceRecords.map((record) => {
    // First, convert both times normally
    const inTime = record.inTime
      ? convertDecimalToRoundedTime(Number(record.inTime), true, dutyStartTime)
      : "NA";
    let outTime = record.outTime
      ? convertDecimalToRoundedTime(Number(record.outTime), false, dutyEndTime)
      : "NA";

    // Only force outTime to :30 when inTime is the special 05:30 case and
    // out minutes are between 15 and 45 inclusive. Otherwise keep normal rounding.
    if (inTime !== "NA" && inTime === "05:30" && outTime !== "NA") {
      const outMinutes = parseInt(outTime.split(":")[1], 10);
      const outHours = parseInt(outTime.split(":")[0], 10);
      if (outMinutes >= 15 && outMinutes <= 45) {
        outTime = `${outHours.toString().padStart(2, "0")}:30`;
      }
    }

    return { inTime, outTime };
  });
};

export default processRawTime;
