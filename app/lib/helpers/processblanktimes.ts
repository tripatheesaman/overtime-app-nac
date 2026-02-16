interface AttendanceRecord {
  inTime: string;
  outTime: string;
}

const isMissingTime = (value?: string | null) => {
  const normalized = (value ?? "").toString().trim().toUpperCase();
  return !normalized || normalized === "NA" || normalized === "--";
};

const isValidHHMM = (value: string) => /^([01]\d|2[0-3]):([0-5]\d)$/.test(value);

const ProcessBlankTimes = async (
  attendanceData: AttendanceRecord[],
  _regularInTime: string,
  _regularOutTime: string,
  _offDay: string,
  _morningShiftStartTime?: string,
  _morningShiftEndTime?: string,
  _morningShiftDays?: number[],
  _nightDutyStartTime?: string,
  _nightDutyEndTime?: string,
  _nightDutyDays?: number[]
) => {
  void [
    _regularInTime,
    _regularOutTime,
    _offDay,
    _morningShiftStartTime,
    _morningShiftEndTime,
    _morningShiftDays,
    _nightDutyStartTime,
    _nightDutyEndTime,
    _nightDutyDays,
  ];

  const processedData = attendanceData.map((record, index) => {
    const dayNumber = index + 1;
    const inTime = (record.inTime ?? "").toString().trim();
    const outTime = (record.outTime ?? "").toString().trim();
    const hasInTime = !isMissingTime(inTime);
    const hasOutTime = !isMissingTime(outTime);

    // Never auto-create duty times for missing/blank records.
    // If either side is missing, treat the whole day as absent so overtime is not generated.
    if (!hasInTime && !hasOutTime) {
      return { inTime: "NA", outTime: "NA" };
    }
    if (!hasInTime || !hasOutTime) {
      return { inTime: "NA", outTime: "NA" };
    }

    if (!isValidHHMM(inTime) || !isValidHHMM(outTime)) {
      console.warn(
        `Ignoring invalid time pair for day ${dayNumber}: in="${inTime}", out="${outTime}".`
      );
      return { inTime: "NA", outTime: "NA" };
    }

    return { inTime, outTime };
  });

  return processedData;
};

export default ProcessBlankTimes;
