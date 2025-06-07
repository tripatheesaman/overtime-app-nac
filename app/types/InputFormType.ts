export interface AttendanceRecord {
  inTime: string;
  outTime: string;
  isMorningShift?: boolean;
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
  morningShiftStartTime: string;
  morningShiftEndTime: string;
  inOutTimes: AttendanceRecord[];
  nightDutyDays: number[];
  morningShiftDays: number[];
}
