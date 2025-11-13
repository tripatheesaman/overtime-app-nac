-- Add code column to Department table with a default value
ALTER TABLE `Department` ADD COLUMN `code` VARCHAR(191) NULL;

-- Update existing departments to have a default code based on their name
UPDATE `Department` SET `code` = LOWER(REGEXP_REPLACE(name, '[^a-zA-Z0-9]', ''));

-- Make code column required and unique after setting defaults
ALTER TABLE `Department` MODIFY `code` VARCHAR(191) NOT NULL;
ALTER TABLE `Department` ADD UNIQUE INDEX `Department_code_key` (`code`);