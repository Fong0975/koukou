-- CreateTable
CREATE TABLE `subscription_reminders` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `subscription_id` INTEGER NOT NULL,
    `kind` ENUM('CHARGE', 'EXPIRY') NOT NULL,
    `days_before` TINYINT NOT NULL,

    UNIQUE INDEX `subscription_reminders_subscription_id_kind_days_before_key`(`subscription_id`, `kind`, `days_before`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_settings` (
    `id` INTEGER NOT NULL DEFAULT 1,
    `enabled` BOOLEAN NOT NULL DEFAULT false,
    `monthly_summary_enabled` BOOLEAN NOT NULL DEFAULT true,
    `send_time` VARCHAR(5) NOT NULL DEFAULT '09:00',
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `notification_dispatches` (
    `date` DATE NOT NULL,
    `status` ENUM('SENT', 'SKIPPED', 'FAILED') NOT NULL,
    `attempts` INTEGER NOT NULL DEFAULT 0,
    `last_error` VARCHAR(255) NULL,
    `updated_at` DATETIME(3) NOT NULL,

    PRIMARY KEY (`date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `subscription_reminders` ADD CONSTRAINT `subscription_reminders_subscription_id_fkey` FOREIGN KEY (`subscription_id`) REFERENCES `subscriptions`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
