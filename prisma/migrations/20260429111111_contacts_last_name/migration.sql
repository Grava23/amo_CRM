/*
  Warnings:

  - You are about to drop the column `calls_limit` on the `outbound_sync_config` table. All the data in the column will be lost.

*/
-- AlterTable
ALTER TABLE "contacts" ALTER COLUMN "last_name" DROP NOT NULL;

-- AlterTable
ALTER TABLE "outbound_sync_config" DROP COLUMN "calls_limit";
