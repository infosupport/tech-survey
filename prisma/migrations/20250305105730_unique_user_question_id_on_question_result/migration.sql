/*
  Warnings:

  - A unique constraint covering the columns `[userId,questionId]` on the table `QuestionResult` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "QuestionResult_userId_questionId_key" ON "QuestionResult"("userId", "questionId");
