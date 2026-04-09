-- Optional one-time SQL for MySQL: extends `settings` with columns used by app/lib/settings.ts.
-- Skip any statement that errors with "Duplicate column name" if columns already exist
-- (the app also attempts ADD COLUMN on startup via ensureSettingsColumns).

ALTER TABLE `settings` ADD COLUMN `inTimeThreshold` INTEGER NULL DEFAULT 30;
ALTER TABLE `settings` ADD COLUMN `outTimeThreshold` INTEGER NULL DEFAULT 30;
ALTER TABLE `settings` ADD COLUMN `oddShiftMinHours` DOUBLE NULL;
ALTER TABLE `settings` ADD COLUMN `doubleOffdayStartDay` INTEGER NULL DEFAULT 23;
ALTER TABLE `settings` ADD COLUMN `dayBeforeOffReductionHours` DOUBLE NULL;
ALTER TABLE `settings` ADD COLUMN `overtimeGraceMinutes` INTEGER NULL DEFAULT 40;
ALTER TABLE `settings` ADD COLUMN `specialWindowStart` VARCHAR(5) NULL;
ALTER TABLE `settings` ADD COLUMN `specialWindowEnd` VARCHAR(5) NULL;
ALTER TABLE `settings` ADD COLUMN `specialWindowLowerCutoff` VARCHAR(5) NULL;
ALTER TABLE `settings` ADD COLUMN `specialWindowUpperCutoff` VARCHAR(5) NULL;
