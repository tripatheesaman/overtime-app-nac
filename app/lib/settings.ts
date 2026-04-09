import prisma from "@/app/lib/prisma";

export type AppSettings = {
  isWinter: boolean;
  winterStartDay: number | null;
  winterEndDay: number | null;
  inTimeThreshold: number;
  outTimeThreshold: number;
  oddShiftMinHours: number;
  doubleOffdayStartDay: number;
  dayBeforeOffReductionHours: number;
  overtimeGraceMinutes: number;
  specialWindowStart: string;
  specialWindowEnd: string;
  specialWindowLowerCutoff: string;
  specialWindowUpperCutoff: string;
};

export const DEFAULT_APP_SETTINGS: AppSettings = {
  isWinter: false,
  winterStartDay: null,
  winterEndDay: null,
  inTimeThreshold: 30,
  outTimeThreshold: 30,
  oddShiftMinHours: 0,
  doubleOffdayStartDay: 23,
  dayBeforeOffReductionHours: 2,
  overtimeGraceMinutes: 40,
  specialWindowStart: "04:50",
  specialWindowEnd: "06:00",
  specialWindowLowerCutoff: "05:15",
  specialWindowUpperCutoff: "05:35",
};

let columnsEnsured = false;

async function ensureSettingsColumns() {
  if (columnsEnsured) return;
  const statements = [
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS inTimeThreshold INT NULL",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS outTimeThreshold INT NULL",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS oddShiftMinHours DOUBLE NULL",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS doubleOffdayStartDay INT NULL",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS dayBeforeOffReductionHours DOUBLE NULL",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS overtimeGraceMinutes INT NULL",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS specialWindowStart VARCHAR(5) NULL",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS specialWindowEnd VARCHAR(5) NULL",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS specialWindowLowerCutoff VARCHAR(5) NULL",
    "ALTER TABLE settings ADD COLUMN IF NOT EXISTS specialWindowUpperCutoff VARCHAR(5) NULL",
  ];
  for (const sql of statements) {
    try {
      await prisma.$executeRawUnsafe(sql);
    } catch {
      // Ignore to maintain compatibility with existing DB variants.
    }
  }
  columnsEnsured = true;
}

export async function getAppSettings(): Promise<AppSettings> {
  await ensureSettingsColumns();
  try {
    const rows = await prisma.$queryRawUnsafe<Array<Record<string, unknown>>>(
      `SELECT 
        isWinter, winterStartDay, winterEndDay,
        inTimeThreshold, outTimeThreshold, oddShiftMinHours,
        doubleOffdayStartDay, dayBeforeOffReductionHours, overtimeGraceMinutes,
        specialWindowStart, specialWindowEnd, specialWindowLowerCutoff, specialWindowUpperCutoff
       FROM settings WHERE id = 1 LIMIT 1`
    );
    const row = rows?.[0];
    if (!row) return DEFAULT_APP_SETTINGS;
    return {
      isWinter: Boolean(row.isWinter ?? DEFAULT_APP_SETTINGS.isWinter),
      winterStartDay:
        row.winterStartDay == null
          ? DEFAULT_APP_SETTINGS.winterStartDay
          : Number(row.winterStartDay),
      winterEndDay:
        row.winterEndDay == null
          ? DEFAULT_APP_SETTINGS.winterEndDay
          : Number(row.winterEndDay),
      inTimeThreshold: Number(
        row.inTimeThreshold ?? DEFAULT_APP_SETTINGS.inTimeThreshold
      ),
      outTimeThreshold: Number(
        row.outTimeThreshold ?? DEFAULT_APP_SETTINGS.outTimeThreshold
      ),
      oddShiftMinHours: Number(
        row.oddShiftMinHours ?? DEFAULT_APP_SETTINGS.oddShiftMinHours
      ),
      doubleOffdayStartDay: Number(
        row.doubleOffdayStartDay ?? DEFAULT_APP_SETTINGS.doubleOffdayStartDay
      ),
      dayBeforeOffReductionHours: Number(
        row.dayBeforeOffReductionHours ??
          DEFAULT_APP_SETTINGS.dayBeforeOffReductionHours
      ),
      overtimeGraceMinutes: Number(
        row.overtimeGraceMinutes ?? DEFAULT_APP_SETTINGS.overtimeGraceMinutes
      ),
      specialWindowStart:
        String(row.specialWindowStart ?? DEFAULT_APP_SETTINGS.specialWindowStart),
      specialWindowEnd: String(
        row.specialWindowEnd ?? DEFAULT_APP_SETTINGS.specialWindowEnd
      ),
      specialWindowLowerCutoff: String(
        row.specialWindowLowerCutoff ??
          DEFAULT_APP_SETTINGS.specialWindowLowerCutoff
      ),
      specialWindowUpperCutoff: String(
        row.specialWindowUpperCutoff ??
          DEFAULT_APP_SETTINGS.specialWindowUpperCutoff
      ),
    };
  } catch {
    return DEFAULT_APP_SETTINGS;
  }
}

export async function upsertAppSettings(
  input: Partial<AppSettings>
): Promise<void> {
  await ensureSettingsColumns();
  const merged: AppSettings = { ...DEFAULT_APP_SETTINGS, ...(await getAppSettings()), ...input };
  const exists = await prisma.$queryRawUnsafe<Array<{ id: number }>>(
    "SELECT id FROM settings WHERE id = 1 LIMIT 1"
  );
  if (exists.length > 0) {
    await prisma.$executeRawUnsafe(
      `UPDATE settings SET
        isWinter = ?, winterStartDay = ?, winterEndDay = ?,
        inTimeThreshold = ?, outTimeThreshold = ?, oddShiftMinHours = ?,
        doubleOffdayStartDay = ?, dayBeforeOffReductionHours = ?, overtimeGraceMinutes = ?,
        specialWindowStart = ?, specialWindowEnd = ?, specialWindowLowerCutoff = ?, specialWindowUpperCutoff = ?
       WHERE id = 1`,
      merged.isWinter ? 1 : 0,
      merged.winterStartDay,
      merged.winterEndDay,
      merged.inTimeThreshold,
      merged.outTimeThreshold,
      merged.oddShiftMinHours,
      merged.doubleOffdayStartDay,
      merged.dayBeforeOffReductionHours,
      merged.overtimeGraceMinutes,
      merged.specialWindowStart,
      merged.specialWindowEnd,
      merged.specialWindowLowerCutoff,
      merged.specialWindowUpperCutoff
    );
  } else {
    await prisma.$executeRawUnsafe(
      `INSERT INTO settings (
        id, isWinter, winterStartDay, winterEndDay,
        inTimeThreshold, outTimeThreshold, oddShiftMinHours,
        doubleOffdayStartDay, dayBeforeOffReductionHours, overtimeGraceMinutes,
        specialWindowStart, specialWindowEnd, specialWindowLowerCutoff, specialWindowUpperCutoff
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      1,
      merged.isWinter ? 1 : 0,
      merged.winterStartDay,
      merged.winterEndDay,
      merged.inTimeThreshold,
      merged.outTimeThreshold,
      merged.oddShiftMinHours,
      merged.doubleOffdayStartDay,
      merged.dayBeforeOffReductionHours,
      merged.overtimeGraceMinutes,
      merged.specialWindowStart,
      merged.specialWindowEnd,
      merged.specialWindowLowerCutoff,
      merged.specialWindowUpperCutoff
    );
  }
}
