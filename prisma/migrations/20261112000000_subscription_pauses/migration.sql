-- CreateTable
CREATE TABLE `subscription_pauses` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subscription_id` INTEGER NOT NULL,
    `start_date` DATE NOT NULL,
    `end_date` DATE NOT NULL,

    UNIQUE INDEX `subscription_pauses_subscription_id_start_date_key`(`subscription_id`, `start_date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subscription_pauses` ADD CONSTRAINT `subscription_pauses_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
