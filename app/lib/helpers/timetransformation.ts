import { AttendanceRecord } from "@/app/types/InputFormType";

type TimeTransformationConfig = {
  inTimeThreshold?: number;
  outTimeThreshold?: number;
  specialWindowStart?: string;
  specialWindowEnd?: string;
  specialWindowLowerCutoff?: string;
  specialWindowUpperCutoff?: string;
};

const parseHHMMToMinutes = (value: string, fallback: number) => {
  const [h, m] = value.split(":").map(Number);
  if (!Number.isFinite(h) || !Number.isFinite(m)) return fallback;
  return h * 60 + m;
};

const convertDecimalToRoundedTime = (
  decimalTime: number,
  isInTime: boolean = true,
  dutyTime: string,
  config: TimeTransformationConfig = {}
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
  const specialWindowStart = parseHHMMToMinutes(config.specialWindowStart ?? "04:50", 4 * 60 + 50);
  const specialWindowEnd = parseHHMMToMinutes(config.specialWindowEnd ?? "06:00", 6 * 60);
  const fiveFifteen = parseHHMMToMinutes(config.specialWindowLowerCutoff ?? "05:15", 5 * 60 + 15);
  const fiveThirtyFive = parseHHMMToMinutes(config.specialWindowUpperCutoff ?? "05:35", 5 * 60 + 35);
  if (isInTime && timeInMinutes >= specialWindowStart && timeInMinutes < specialWindowEnd) {
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
  const inThreshold = Number(config.inTimeThreshold ?? 30);
  const outThreshold = Number(config.outTimeThreshold ?? 30);
  const threshold = isInTime ? inThreshold : outThreshold;
  if (timeDiff < threshold) {
    hours = dutyHours;
    minutes = dutyMinutes;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
  }

  // General rounding rules (no :30 here) — use thresholds to decide direction
  if (isInTime) {
    // For in time: if minutes > IN_TIME_THRESHOLD => round up, else round down
    if (minutes > inThreshold) {
      minutes = 0;
      hours += 1;
    } else {
      minutes = 0;
    }
  } else {
    // For out time: if minutes >= OUT_TIME_THRESHOLD => round up, else round down
    if (minutes >= outThreshold) {
      minutes = 0;
      hours += 1;
    } else {
      minutes = 0;
    }
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

const processRawTime = (
  attendanceRecords: AttendanceRecord[],
  dutyStartTime: string,
  dutyEndTime: string,
  config: TimeTransformationConfig = {}
): AttendanceRecord[] => {
  if (!attendanceRecords.length || !Array.isArray(attendanceRecords)) {
    return [];
  }

  return attendanceRecords.map((record) => {
    // First, convert in-time normally
    const inTime = record.inTime
      ? convertDecimalToRoundedTime(Number(record.inTime), true, dutyStartTime, config)
      : "NA";
    
    // For out-time, check if we need special handling first
    let outTime = "NA";
    if (record.outTime) {
      const outDecimalTime = Number(record.outTime);
      const totalMinutes = outDecimalTime * 24 * 60;
      const outHours = Math.floor(totalMinutes / 60);
      const outMinutes = Math.round(totalMinutes % 60);
      
      // Special case: If in-time is 5:30, apply special out-time logic
      if (inTime === "05:30" && outMinutes >= 15 && outMinutes <= 45) {
        outTime = `${outHours.toString().padStart(2, "0")}:30`;
      } else {
        // Use normal rounding logic
        outTime = convertDecimalToRoundedTime(outDecimalTime, false, dutyEndTime, config);
      }
    }

    return { inTime, outTime };
  });
};

export default processRawTime;
