-- AlterTable
ALTER TABLE `notification_dispatches`
    DROP PRIMARY KEY,
    ADD COLUMN `kind` ENUM('SUMMARY', 'DAILY') NOT NULL DEFAULT 'DAILY',
    ADD PRIMARY KEY (`date`, `kind`);
