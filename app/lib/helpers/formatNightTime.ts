import { AttendanceRecord } from "@/app/types/InputFormType";

const FormatNightTime = (
  attendanceData: AttendanceRecord[],
  nightDutyDays: number[]
) => {
  const sortedNightDays = [...nightDutyDays].sort((a, b) => a - b);
  if (JSON.stringify(sortedNightDays) !== JSON.stringify(nightDutyDays)) {
    return attendanceData;
  }
  for (let i = 0; i < nightDutyDays.length - 1; i++) {
    const currentIndex = nightDutyDays[i] - 1;
    const nextIndex = nightDutyDays[i + 1] - 1;

    // First day's inTime remains unchanged
    if (i === 0) {
      attendanceData[currentIndex].outTime = attendanceData[nextIndex].inTime;
    } else {
      attendanceData[currentIndex].inTime =
        attendanceData[currentIndex].outTime;
      attendanceData[currentIndex].outTime = attendanceData[nextIndex].inTime;
    }
  }

  // Last day's inTime becomes its outTime
  const lastIndex = nightDutyDays[nightDutyDays.length - 1] - 1;
  attendanceData[lastIndex].inTime = attendanceData[lastIndex].outTime;
  attendanceData[lastIndex].outTime = attendanceData[lastIndex + 1].inTime;
  attendanceData[lastIndex + 1].inTime = "NA";

  return attendanceData;
};

export default FormatNightTime;
