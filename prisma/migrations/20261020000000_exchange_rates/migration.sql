-- CreateTable
CREATE TABLE `exchange_rates` (
    `base` ENUM('TWD', 'USD') NOT NULL,
    `quote` ENUM('TWD', 'USD') NOT NULL,
    `date` DATE NOT NULL,
    `rate` DECIMAL(14, 6) NOT NULL,

    PRIMARY KEY (`base`, `quote`, `date`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `exchange_rate_syncs` (
    `base` ENUM('TWD', 'USD') NOT NULL,
    `quote` ENUM('TWD', 'USD') NOT NULL,
    `year` SMALLINT NOT NULL,
    `synced_on` DATE NOT NULL,
    `complete` BOOLEAN NOT NULL DEFAULT false,

    PRIMARY KEY (`base`, `quote`, `year`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
