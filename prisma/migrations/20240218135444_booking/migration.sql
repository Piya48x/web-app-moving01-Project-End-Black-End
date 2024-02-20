-- CreateTable
CREATE TABLE `Booking` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `vehicle` VARCHAR(191) NOT NULL,
    `bookingStatus` VARCHAR(191) NOT NULL,
    `pickupLocation` JSON NOT NULL,
    `dropoffLocation` JSON NOT NULL,
    `selectedDateTime` DATETIME(3) NULL,
    `totalDistance` DOUBLE NULL,
    `totalCost` DOUBLE NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
