-- AlterTable: add the start date, back-filling existing rows from their creation date
ALTER TABLE `subscriptions` ADD COLUMN `start_date` DATE NULL AFTER `payment_method_id`;
UPDATE `subscriptions` SET `start_date` = DATE(`created_at`);
ALTER TABLE `subscriptions` MODIFY `start_date` DATE NOT NULL;

-- CreateTable
CREATE TABLE `subscription_amount_periods` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subscription_id` INTEGER NOT NULL,
    `amount` DECIMAL(12, 2) NOT NULL,
    `end_date` DATE NOT NULL,

    UNIQUE INDEX `subscription_amount_periods_subscription_id_end_date_key`(`subscription_id`, `end_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subscription_amount_periods` ADD CONSTRAINT `subscription_amount_periods_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
