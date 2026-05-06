import prisma from "@/app/lib/prisma";
import {
  AppSettings,
  DEFAULT_APP_SETTINGS,
  DayRange,
  ShiftPlaceholders,
} from "@/app/types/settings";
export type { AppSettings } from "@/app/types/settings";

let configColumnEnsured = false;

const ensureConfigColumn = async () => {
  if (configColumnEnsured) return;
  const rows = await prisma.$queryRawUnsafe<Array<{ count: number }>>(
    `SELECT COUNT(*) as count
     FROM information_schema.COLUMNS
     WHERE TABLE_SCHEMA = DATABASE()
       AND TABLE_NAME = 'settings'
       AND COLUMN_NAME = 'config'`
  );
  const exists = Number(rows?.[0]?.count ?? 0) > 0;
  if (!exists) {
    await prisma.$executeRawUnsafe("ALTER TABLE settings ADD COLUMN config JSON NULL");
  }
  configColumnEnsured = true;
};

const isValidDay = (value: unknown) =>
  Number.isInteger(Number(value)) && Number(value) >= 1 && Number(value) <= 31;

const normalizeRange = (value: unknown, fallback: DayRange): DayRange => {
  const candidate = (value as DayRange | undefined) ?? fallback;
  const startDay = isValidDay(candidate.startDay) ? Number(candidate.startDay) : fallback.startDay;
  const endRaw = isValidDay(candidate.endDay) ? Number(candidate.endDay) : fallback.endDay;
  const endDay = Math.max(startDay, endRaw);
  return { startDay, endDay };
};

const normalizeShiftPlaceholders = (
  value: unknown,
  fallback: ShiftPlaceholders
): ShiftPlaceholders => {
  const source = (value as Partial<ShiftPlaceholders> | undefined) ?? {};
  return {
    regularIn: String(source.regularIn ?? fallback.regularIn),
    regularOut: String(source.regularOut ?? fallback.regularOut),
    nightIn: String(source.nightIn ?? fallback.nightIn),
    nightOut: String(source.nightOut ?? fallback.nightOut),
    morningIn: String(source.morningIn ?? fallback.morningIn),
    morningOut: String(source.morningOut ?? fallback.morningOut),
  };
};

const normalizeSettings = (value: unknown): AppSettings => {
  const source = (value as Partial<AppSettings> | undefined) ?? {};
  return {
    normal: {
      dayBeforeOffReductionHours: Number(
        source.normal?.dayBeforeOffReductionHours ??
          DEFAULT_APP_SETTINGS.normal.dayBeforeOffReductionHours
      ),
    },
    cutoffThresholds: {
      inTimeThreshold: Number(
        source.cutoffThresholds?.inTimeThreshold ??
          DEFAULT_APP_SETTINGS.cutoffThresholds.inTimeThreshold
      ),
      outTimeThreshold: Number(
        source.cutoffThresholds?.outTimeThreshold ??
          DEFAULT_APP_SETTINGS.cutoffThresholds.outTimeThreshold
      ),
      specialWindowStart: String(
        source.cutoffThresholds?.specialWindowStart ??
          DEFAULT_APP_SETTINGS.cutoffThresholds.specialWindowStart
      ),
      specialWindowEnd: String(
        source.cutoffThresholds?.specialWindowEnd ??
          DEFAULT_APP_SETTINGS.cutoffThresholds.specialWindowEnd
      ),
      specialWindowLowerCutoff: String(
        source.cutoffThresholds?.specialWindowLowerCutoff ??
          DEFAULT_APP_SETTINGS.cutoffThresholds.specialWindowLowerCutoff
      ),
      specialWindowUpperCutoff: String(
        source.cutoffThresholds?.specialWindowUpperCutoff ??
          DEFAULT_APP_SETTINGS.cutoffThresholds.specialWindowUpperCutoff
      ),
      oddShiftDayMinHours: Number(
        source.cutoffThresholds?.oddShiftDayMinHours ??
          DEFAULT_APP_SETTINGS.cutoffThresholds.oddShiftDayMinHours
      ),
      oddShiftNightMinHours: Number(
        source.cutoffThresholds?.oddShiftNightMinHours ??
          DEFAULT_APP_SETTINGS.cutoffThresholds.oddShiftNightMinHours
      ),
      afterDutyGraceMinutes: Number(
        source.cutoffThresholds?.afterDutyGraceMinutes ??
          DEFAULT_APP_SETTINGS.cutoffThresholds.afterDutyGraceMinutes
      ),
    },
    shifts: {
      enableNightDuty: Boolean(
        source.shifts?.enableNightDuty ?? DEFAULT_APP_SETTINGS.shifts.enableNightDuty
      ),
      enableMorningShift: Boolean(
        source.shifts?.enableMorningShift ?? DEFAULT_APP_SETTINGS.shifts.enableMorningShift
      ),
    },
    winterOverlay: {
      enabled: Boolean(
        source.winterOverlay?.enabled ?? DEFAULT_APP_SETTINGS.winterOverlay.enabled
      ),
      range: normalizeRange(
        source.winterOverlay?.range,
        DEFAULT_APP_SETTINGS.winterOverlay.range
      ),
    },
    doubleOffOverlay: {
      enabled: Boolean(
        source.doubleOffOverlay?.enabled ?? DEFAULT_APP_SETTINGS.doubleOffOverlay.enabled
      ),
      range: normalizeRange(
        source.doubleOffOverlay?.range,
        DEFAULT_APP_SETTINGS.doubleOffOverlay.range
      ),
    },
    noFridayOverlay: {
      enabled: Boolean(
        source.noFridayOverlay?.enabled ?? DEFAULT_APP_SETTINGS.noFridayOverlay.enabled
      ),
      range: normalizeRange(
        source.noFridayOverlay?.range,
        DEFAULT_APP_SETTINGS.noFridayOverlay.range
      ),
    },
    eightHourOverlay: {
      enabled: Boolean(
        source.eightHourOverlay?.enabled ?? DEFAULT_APP_SETTINGS.eightHourOverlay.enabled
      ),
      range: normalizeRange(
        source.eightHourOverlay?.range,
        DEFAULT_APP_SETTINGS.eightHourOverlay.range
      ),
      defaults: normalizeShiftPlaceholders(
        source.eightHourOverlay?.defaults,
        DEFAULT_APP_SETTINGS.eightHourOverlay.defaults
      ),
    },
    placeholders: {
      normal: normalizeShiftPlaceholders(
        source.placeholders?.normal,
        DEFAULT_APP_SETTINGS.placeholders.normal
      ),
      winter: normalizeShiftPlaceholders(
        source.placeholders?.winter,
        DEFAULT_APP_SETTINGS.placeholders.winter
      ),
    },
  };
};

export async function getAppSettings(): Promise<AppSettings> {
  try {
    await ensureConfigColumn();
    const rows = await prisma.$queryRawUnsafe<Array<{ config: unknown }>>(
      "SELECT config FROM settings WHERE id = 1 LIMIT 1"
    );
    const row = rows?.[0];
    if (!row || !row.config) return DEFAULT_APP_SETTINGS;
    return normalizeSettings(row.config);
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function upsertAppSettings(input: Partial<AppSettings>): Promise<void> {
  await ensureConfigColumn();
  const merged = normalizeSettings({ ...(await getAppSettings()), ...input });
  const exists = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
    "SELECT id FROM settings WHERE id = 1 LIMIT 1"
  );
  if (exists.length > 0) {
    await prisma.$executeRawUnsafe(
      "UPDATE settings SET config = ? WHERE id = 1",
      JSON.stringify(merged)
    );
    return;
  }
  await prisma.$executeRawUnsafe(
    "INSERT INTO settings (id, config) VALUES (?, ?)",
    1,
    JSON.stringify(merged)
  );
}
