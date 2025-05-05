export interface AttendanceRecord {
  inTime: string;
  outTime: string;
}

export type dayOfWeek =
  | "Sunday"
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday";

export interface FormData {
  name: string;
  designation: string;
  staffId: string;
  regularOffDay: dayOfWeek;
  dutyStartTime: string;
  dutyEndTime: string;
  nightDutyStartTime: string;
  nightDutyEndTime: string;
  inOutTimes: AttendanceRecord[];
  nightDutyDays: number[];
}
