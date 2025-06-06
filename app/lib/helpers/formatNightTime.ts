interface AttendanceRecord {
  inTime: string;
  outTime: string;
}

const FormatNightTime = (attendanceData: AttendanceRecord[]) => {
  // No longer need to swap times, just return the data as is
  return attendanceData;
};

export default FormatNightTime;
