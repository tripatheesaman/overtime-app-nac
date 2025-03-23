-- CreateTable
CREATE TABLE `OverTimeDetails` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `designation` VARCHAR(191) NOT NULL,
    `staffid` VARCHAR(191) NOT NULL,
    `totalovertimehours` INTEGER NOT NULL,
    `nightovertime` INTEGER NOT NULL,
    `beforedutyhours` INTEGER NOT NULL,
    `afterdutyhours` INTEGER NOT NULL,
    `numberofoddshifts` INTEGER NOT NULL,
    `holidayhours` INTEGER NOT NULL,
    `monthname` VARCHAR(191) NOT NULL,
    `regularoffday` VARCHAR(191) NOT NULL,
    `regulardutyhoursfrom` VARCHAR(191) NOT NULL,
    `regulardutyhoursto` VARCHAR(191) NOT NULL,
    `attendancedata` JSON NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
