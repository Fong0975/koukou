-- AlterTable
ALTER TABLE `payment_methods` ADD COLUMN `sort_order` INTEGER NOT NULL DEFAULT 0;

-- Keep the order users already see (type, then name) by numbering the existing rows in steps of 10.
UPDATE `payment_methods` AS `pm`
JOIN (
    SELECT
        `id`,
        ROW_NUMBER() OVER (ORDER BY FIELD(`type`, 'CREDIT_CARD', 'BANK_ACCOUNT', 'OTHER'), `name`, `id`) * 10 AS `position`
    FROM `payment_methods`
) AS `ranked` ON `ranked`.`id` = `pm`.`id`
SET `pm`.`sort_order` = `ranked`.`position`;
