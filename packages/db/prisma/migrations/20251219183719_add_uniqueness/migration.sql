/*
  Warnings:

  - A unique constraint covering the columns `[userId,contractId]` on the table `Position` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Position_userId_contractId_key" ON "Position"("userId", "contractId");
