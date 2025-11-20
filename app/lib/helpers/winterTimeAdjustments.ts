export type WinterAdjustment =
  | { type: "offset"; value: number }
  | { type: "absolute"; value: string };

const normalizeTimeString = (time: string): string | null => {
  const parts = time.split(":");
  if (parts.length !== 2) return null;
  const hours = Number(parts[0]);
  const minutes = Number(parts[1]);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return null;
  if (hours < 0 || hours > 23 || minutes < 0 || minutes > 59) return null;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

const timeStringToMinutes = (time: string): number => {
  const [hourStr, minuteStr] = time.split(":");
  const hours = Number(hourStr);
  const minutes = Number(minuteStr);
  if (!Number.isFinite(hours) || !Number.isFinite(minutes)) return 0;
  return hours * 60 + minutes;
};

const minutesToTimeString = (totalMinutes: number): string => {
  const normalizedMinutes = ((totalMinutes % 1440) + 1440) % 1440;
  const hours = Math.floor(normalizedMinutes / 60);
  const minutes = normalizedMinutes % 60;
  return `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}`;
};

export const parseWinterAdjustment = (
  value?: string | null
): WinterAdjustment | null => {
  if (value === null || value === undefined) return null;
  const trimmed = value.toString().trim();
  if (!trimmed) return null;

  if (trimmed.includes(":")) {
    const normalized = normalizeTimeString(trimmed);
    if (normalized) {
      return { type: "absolute", value: normalized };
    }
  }

  const parsed = Number(trimmed);
  if (Number.isFinite(parsed)) {
    return { type: "offset", value: parsed };
  }

  return null;
};

const shiftTimeByHours = (time: string, hoursDelta: number): string => {
  if (!time || typeof time !== "string" || !time.includes(":")) return time;
  const [hourStr, minuteStr] = time.split(":");
  const baseHours = Number(hourStr);
  const baseMinutes = Number(minuteStr);
  if (!Number.isFinite(baseHours) || !Number.isFinite(baseMinutes)) return time;

  const totalMinutes = baseHours * 60 + baseMinutes + hoursDelta * 60;
  const minutesInDay = 24 * 60;
  const normalizedMinutes =
    ((totalMinutes % minutesInDay) + minutesInDay) % minutesInDay;

  const newHours = Math.floor(normalizedMinutes / 60);
  const newMinutes = Math.round(normalizedMinutes % 60);

  return `${newHours.toString().padStart(2, "0")}:${newMinutes
    .toString()
    .padStart(2, "0")}`;
};

interface WinterAdjustmentOptions {
  baseStart: string;
  baseEnd: string;
  inAdjustment?: WinterAdjustment | null;
  outAdjustment?: WinterAdjustment | null;
  isWinterDay: boolean;
  allowOutAdjustment?: boolean;
  baseEndNextDay?: boolean;
}

export const applyWinterAdjustments = ({
  baseStart,
  baseEnd,
  inAdjustment,
  outAdjustment,
  isWinterDay,
  allowOutAdjustment = true,
  baseEndNextDay,
}: WinterAdjustmentOptions): { start: string; end: string; endNextDay: boolean } => {
  const baseStartMinutes = timeStringToMinutes(baseStart);
  let startMinutes = baseStartMinutes;

  let endMinutes = timeStringToMinutes(baseEnd);
  const computedBaseEndNextDay =
    typeof baseEndNextDay === "boolean"
      ? baseEndNextDay
      : endMinutes <= baseStartMinutes;
  if (computedBaseEndNextDay) {
    endMinutes += 1440;
  }

  if (!isWinterDay) {
    return {
      start: minutesToTimeString(startMinutes),
      end: minutesToTimeString(endMinutes),
      endNextDay: endMinutes >= 1440,
    };
  }

  if (inAdjustment) {
    if (inAdjustment.type === "absolute") {
      startMinutes = timeStringToMinutes(inAdjustment.value);
    } else {
      startMinutes += inAdjustment.value * 60;
    }
  }

  let adjustedEndMinutes = endMinutes;
  if (allowOutAdjustment && outAdjustment) {
    if (outAdjustment.type === "absolute") {
      adjustedEndMinutes = timeStringToMinutes(outAdjustment.value);
      if (adjustedEndMinutes <= startMinutes) {
        adjustedEndMinutes += 1440;
      }
    } else {
      adjustedEndMinutes -= outAdjustment.value * 60;
    }
  }

  const endNextDay = adjustedEndMinutes >= 1440;

  return {
    start: minutesToTimeString(startMinutes),
    end: minutesToTimeString(adjustedEndMinutes),
    endNextDay,
  };
};

export const adjustTimeByHours = shiftTimeByHours;

