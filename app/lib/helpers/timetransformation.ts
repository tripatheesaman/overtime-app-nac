import { AttendanceRecord } from "@/app/types/InputFormType";

// Get thresholds from environment variables with fallback to 30 minutes
const IN_TIME_THRESHOLD = Number(process.env.NEXT_PUBLIC_IN_TIME_THRESHOLD) || 30;
const OUT_TIME_THRESHOLD = Number(process.env.NEXT_PUBLIC_OUT_TIME_THRESHOLD) || 30;

const convertDecimalToRoundedTime = (decimalTime: number, isInTime: boolean = true, dutyTime: string, isMorningShift: boolean = false): string => {
  if (decimalTime === null || decimalTime === undefined) return "--"; // Handle missing values

  const totalMinutes = decimalTime * 24 * 60; // Convert fraction to total minutes
  let hours = Math.floor(totalMinutes / 60); // Extract hours
  let minutes = Math.round(totalMinutes % 60); // Extract minutes

  // For morning shift in-time: if before 5:15, count as 5:30
  if (isMorningShift && isInTime) {
    const timeInMinutes = hours * 60 + minutes;
    const fiveFifteenInMinutes = 5 * 60 + 15; // 5:15 AM
    
    if (timeInMinutes < fiveFifteenInMinutes) {
      return "05:30"; // Fixed in-time for morning shift before 5:15
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
    
    // First, convert both times normally
    let inTime = record.inTime
      ? convertDecimalToRoundedTime(Number(record.inTime), true, dutyStartTime, isMorningShift)
      : "NA";
    let outTime = record.outTime
      ? convertDecimalToRoundedTime(Number(record.outTime), false, dutyEndTime, isMorningShift)
      : "NA";

    // Apply 30-minute rounding logic if both times are valid
    if (inTime !== "NA" && outTime !== "NA") {
      const inMinutes = parseInt(inTime.split(":")[1]);
      const outMinutes = parseInt(outTime.split(":")[1]);
      
      // Check if both times have minutes between 15-45
      if ((inMinutes > 14 && inMinutes < 45) && (outMinutes > 14 && outMinutes < 45)) {
        // Round both to 30 minutes
        const inHours = parseInt(inTime.split(":")[0]);
        const outHours = parseInt(outTime.split(":")[0]);
        
        inTime = `${inHours.toString().padStart(2, "0")}:30`;
        outTime = `${outHours.toString().padStart(2, "0")}:30`;
      }
    }

    return { inTime, outTime };
  });
};

export default processRawTime;
