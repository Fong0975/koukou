-- AlterTable
ALTER TABLE `subscriptions` ADD COLUMN `amortize` BOOLEAN NOT NULL DEFAULT false AFTER `amount`;
