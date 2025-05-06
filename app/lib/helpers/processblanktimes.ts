import getCurrentMonthDetails from "@/app/services/DayDetails";
import dayjs from "dayjs";

const daysOfWeek = [
  "Sunday",
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
];

const calculateTwoHoursBefore = (time: string): string => {
  const [hours, minutes] = time.split(":").map(Number);
  const date = dayjs().hour(hours).minute(minutes);
  const twoHoursBefore = date.subtract(2, "hour");
  return twoHoursBefore.format("HH:mm");
};

interface AttendanceRecord {
  inTime: string;
  outTime: string;
}

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

    const nextDayIndex = (startDay + index + 1) % 7;
    const nextDayName = daysOfWeek[nextDayIndex];
    const isDayBeforeOff = nextDayName.toLowerCase() === offDay.toLowerCase();

    let inTime = record.inTime;
    let outTime = record.outTime;

    if (inTime === "NA" && outTime === "NA") {
      if (isOff) {
        return { inTime, outTime };
      } else {
        inTime = regularInTime;
        outTime = isDayBeforeOff && !isHoliday ? calculateTwoHoursBefore(regularOutTime) : regularOutTime;
      }
    } else {
      if (inTime === "NA") {
        inTime = regularInTime;
      }
      if (outTime === "NA") {
        outTime = isDayBeforeOff && !isHoliday ? calculateTwoHoursBefore(regularOutTime) : regularOutTime;
      }
    }

    return { inTime, outTime };
  });

  return processedData;
};

export default ProcessBlankTimes;
