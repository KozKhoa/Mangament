/*
  Warnings:

  - Made the column `number_of_children` on table `Story` required. This step will fail if there are existing NULL values in that column.

*/
-- AlterTable
ALTER TABLE "public"."Story" ALTER COLUMN "number_of_children" SET NOT NULL,
ALTER COLUMN "number_of_children" SET DEFAULT 0;
