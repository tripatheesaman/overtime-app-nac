import { AttendanceRecord } from "@/app/types/InputFormType";

// Get thresholds from environment variables with fallback to 30 minutes
const IN_TIME_THRESHOLD = Number(process.env.NEXT_PUBLIC_IN_TIME_THRESHOLD) || 30;
const OUT_TIME_THRESHOLD = Number(process.env.NEXT_PUBLIC_OUT_TIME_THRESHOLD) || 30;

const convertDecimalToRoundedTime = (decimalTime: number, isInTime: boolean = true, dutyTime: string, isMorningShift: boolean = false): string => {
  if (decimalTime === null || decimalTime === undefined) return "--"; // Handle missing values

  const totalMinutes = decimalTime * 24 * 60; // Convert fraction to total minutes
  let hours = Math.floor(totalMinutes / 60); // Extract hours
  let minutes = Math.round(totalMinutes % 60); // Extract minutes

  // For morning shift with specific conditions
  if (isMorningShift) {
    const timeInMinutes = hours * 60 + minutes;
    const fiveAMInMinutes = 5 * 60; // 5:00 AM
    const twelvePMInMinutes = 12 * 60; // 12:00 PM
    const twelveFortyPMInMinutes = 12 * 60 + 40; // 12:40 PM

    if (timeInMinutes > fiveAMInMinutes) {
      if (isInTime) {
        return "05:30"; // Fixed in-time for morning shift
      } else if (timeInMinutes >= twelvePMInMinutes && timeInMinutes <= twelveFortyPMInMinutes) {
        return "12:30"; // Fixed out-time for morning shift within 12:00-12:40
      }
    }
  }

  // Parse duty time to get the threshold
  const [dutyHours, dutyMinutes] = dutyTime.split(":").map(Number);
  const dutyTimeInMinutes = dutyHours * 60 + dutyMinutes;

  // Calculate time difference in minutes
  const timeInMinutes = hours * 60 + minutes;
  const timeDiff = Math.abs(timeInMinutes - dutyTimeInMinutes);

  // Use different thresholds for in and out times
  const threshold = isInTime ? IN_TIME_THRESHOLD : OUT_TIME_THRESHOLD;

  // Round based on the threshold and duty time
  if (timeDiff < threshold) {
    // If within threshold, round to duty time
    hours = dutyHours;
    minutes = dutyMinutes;
  } else {
    // If outside threshold, round to nearest hour
    if (minutes < threshold) {
    minutes = 0; // Round down
  } else {
    minutes = 0; // Reset minutes
    hours += 1; // Round up to next hour
    }
  }

  return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

const processRawTime = (attendanceRecords: AttendanceRecord[], dutyStartTime: string, dutyEndTime: string): AttendanceRecord[] => {
  if (!attendanceRecords.length || !Array.isArray(attendanceRecords)) {
    return [];
  }

  return attendanceRecords.map((record) => {
    const isMorningShift = record.isMorningShift || false; // Get morning shift status from record
    return {
    inTime: record.inTime
        ? convertDecimalToRoundedTime(Number(record.inTime), true, dutyStartTime, isMorningShift)
      : "NA",
    outTime: record.outTime
        ? convertDecimalToRoundedTime(Number(record.outTime), false, dutyEndTime, isMorningShift)
      : "NA",
    };
  });
};

export default processRawTime;
