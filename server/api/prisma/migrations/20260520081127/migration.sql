/*
  Warnings:

  - A unique constraint covering the columns `[name]` on the table `Genre` will be added. If there are existing duplicate values, this will fail.

*/
-- DropIndex
DROP INDEX "Genre_name_idx";

-- CreateIndex
CREATE UNIQUE INDEX "Genre_name_key" ON "Genre"("name");
