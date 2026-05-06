export type DayRange = {
  startDay: number;
  endDay: number;
};

export type ShiftPlaceholders = {
  regularIn: string;
  regularOut: string;
  nightIn: string;
  nightOut: string;
  morningIn: string;
  morningOut: string;
};

export type AppSettings = {
  normal: {
    dayBeforeOffReductionHours: number;
  };
  cutoffThresholds: {
    inTimeThreshold: number;
    outTimeThreshold: number;
    specialWindowStart: string;
    specialWindowEnd: string;
    specialWindowLowerCutoff: string;
    specialWindowUpperCutoff: string;
    oddShiftDayMinHours: number;
    oddShiftNightMinHours: number;
    afterDutyGraceMinutes: number;
  };
  shifts: {
    enableNightDuty: boolean;
    enableMorningShift: boolean;
  };
  winterOverlay: {
    enabled: boolean;
    range: DayRange;
  };
  doubleOffOverlay: {
    enabled: boolean;
    range: DayRange;
  };
  noFridayOverlay: {
    enabled: boolean;
    range: DayRange;
  };
  eightHourOverlay: {
    enabled: boolean;
    range: DayRange;
    defaults: ShiftPlaceholders;
  };
  placeholders: {
    normal: ShiftPlaceholders;
    winter: ShiftPlaceholders;
  };
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  normal: {
    dayBeforeOffReductionHours: 2,
  },
  cutoffThresholds: {
    inTimeThreshold: 30,
    outTimeThreshold: 30,
    specialWindowStart: "04:50",
    specialWindowEnd: "06:00",
    specialWindowLowerCutoff: "05:15",
    specialWindowUpperCutoff: "05:35",
    oddShiftDayMinHours: 0,
    oddShiftNightMinHours: 0,
    afterDutyGraceMinutes: 40,
  },
  shifts: {
    enableNightDuty: true,
    enableMorningShift: true,
  },
  winterOverlay: {
    enabled: false,
    range: { startDay: 1, endDay: 31 },
  },
  doubleOffOverlay: {
    enabled: false,
    range: { startDay: 23, endDay: 31 },
  },
  noFridayOverlay: {
    enabled: false,
    range: { startDay: 1, endDay: 31 },
  },
  eightHourOverlay: {
    enabled: false,
    range: { startDay: 1, endDay: 31 },
    defaults: {
      regularIn: "09:00",
      regularOut: "17:00",
      nightIn: "22:00",
      nightOut: "06:00",
      morningIn: "06:00",
      morningOut: "14:00",
    },
  },
  placeholders: {
    normal: {
      regularIn: "10:00",
      regularOut: "17:00",
      nightIn: "17:00",
      nightOut: "00:00",
      morningIn: "05:30",
      morningOut: "12:30",
    },
    winter: {
      regularIn: "10:00",
      regularOut: "17:00",
      nightIn: "17:00",
      nightOut: "00:00",
      morningIn: "05:30",
      morningOut: "12:30",
    },
  },
};
