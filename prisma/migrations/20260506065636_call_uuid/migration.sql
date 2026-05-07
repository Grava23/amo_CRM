/*
  Warnings:

  - The primary key for the `calls` table will be changed. If it partially fails, the table could be left without primary key constraint.
  - You are about to drop the column `id` on the `calls` table. All the data in the column will be lost.

*/
-- DropIndex
DROP INDEX "calls_uuid_key";

-- AlterTable
ALTER TABLE "calls" DROP CONSTRAINT "calls_pkey",
DROP COLUMN "id",
ADD CONSTRAINT "calls_pkey" PRIMARY KEY ("uuid");
