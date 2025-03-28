import { AttendanceRecord } from "@/app/types/InputFormType";

const convertTo24HourFormat = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  if (hours === 0 && minutes === 0) return "24:00"; 
  if (hours < 12) return `${24 + hours}:${minutes.toString().padStart(2, "0")}`; 
  return time; 
};

const FormatNightTime = (
  attendanceData: AttendanceRecord[],
  nightDutyDays: number[]
) => {
  for (let i = 0; i < nightDutyDays.length; i++) {
    const index = nightDutyDays[i];

    if (i === 0) {
      if (attendanceData[index].inTime === "NA") {
        attendanceData[index].inTime = attendanceData[index].outTime;
      }
    } else {
      attendanceData[index].inTime = attendanceData[nightDutyDays[i - 1]].outTime;
    }

    if (i < nightDutyDays.length - 1) {
      attendanceData[index].outTime = convertTo24HourFormat(
        attendanceData[nightDutyDays[i + 1]].inTime
      );
    } else {
      attendanceData[index].outTime = convertTo24HourFormat(attendanceData[index].inTime);
    }
  }

  return attendanceData
};

export default FormatNightTime;
