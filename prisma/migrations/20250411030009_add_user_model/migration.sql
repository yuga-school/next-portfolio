/*
  Warnings:

  - You are about to drop the column `parentUserId` on the `User` table. All the data in the column will be lost.

*/
-- DropForeignKey
ALTER TABLE "User" DROP CONSTRAINT "User_parentUserId_fkey";

-- AlterTable
ALTER TABLE "User" DROP COLUMN "parentUserId";
