/*
  Warnings:

  - You are about to drop the column `destination` on the `order` table. All the data in the column will be lost.
  - You are about to drop the column `selectedVehicle` on the `order` table. All the data in the column will be lost.
  - You are about to alter the column `pickupLocation` on the `order` table. The data in that column could be lost. The data in that column will be cast from `VarChar(191)` to `Json`.
  - You are about to drop the `resettoken` table. If the table is not empty, all the data it contains will be lost.
  - Added the required column `bookingStatus` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `dropoffLocation` to the `Order` table without a default value. This is not possible if the table is not empty.
  - Added the required column `vehicle` to the `Order` table without a default value. This is not possible if the table is not empty.

*/
-- AlterTable
ALTER TABLE `order` DROP COLUMN `destination`,
    DROP COLUMN `selectedVehicle`,
    ADD COLUMN `bookingStatus` VARCHAR(191) NOT NULL,
    ADD COLUMN `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    ADD COLUMN `dropoffLocation` JSON NOT NULL,
    ADD COLUMN `selectedDateTime` DATETIME(3) NULL,
    ADD COLUMN `vehicle` VARCHAR(191) NOT NULL,
    MODIFY `pickupLocation` JSON NOT NULL;

-- DropTable
DROP TABLE `resettoken`;
