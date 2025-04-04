import getCurrentMonthDetails from "@/app/services/DayDetails";
import { AttendanceRecord } from "@/app/types/InputFormType";
import { ErrorReturnType } from "@/app/types/ErrorReturnType";
const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];
const ProcessBlankTimes = async (
  attendanceData: AttendanceRecord[],
  regularInTime: string,
  regularOutTime: string,
  offDay: string
) => {
  const currentMonthDetails = await getCurrentMonthDetails();
  if (
    currentMonthDetails &&
    typeof currentMonthDetails === "object" &&
    "message" in currentMonthDetails &&
    "status" in currentMonthDetails
  ) {
    console.error("Month details error:", currentMonthDetails.message);
    return;
  }
const { startDay, holidays } = currentMonthDetails;
  const processedData = attendanceData.map((record, index) => {
    const dayOfWeekIndex = (startDay + index) % 7;
    const dayOfWeekName = daysOfWeek[dayOfWeekIndex];
    const dayOfMonth = index + 1;

    const isDayOff = dayOfWeekName.toLowerCase() === offDay.toLowerCase();
    const isHoliday = holidays.includes(dayOfMonth);
    const isOff = isDayOff || isHoliday;

    let inTime = record.inTime;
    let outTime = record.outTime;

    if (inTime === "NA" && outTime === "NA") {
      if (isOff) {
        return { inTime, outTime };
      } else {
        inTime = regularInTime;
        outTime = regularOutTime;
      }
    } else {
      if (inTime === "NA") {
        inTime = regularInTime;
      }
      if (outTime === "NA") {
        outTime = regularOutTime;
      }
    }

    return { inTime, outTime };
  });
  return processedData;
};

export default ProcessBlankTimes;
