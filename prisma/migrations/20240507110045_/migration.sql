-- CreateEnum
CREATE TYPE "CommunicationMethod" AS ENUM ('SLACK', 'EMAIL', 'WHATSAPP', 'SIGNAL', 'PHONE', 'TEAMS');

-- CreateTable
CREATE TABLE "CommunicationPreference" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "methods" "CommunicationMethod"[] DEFAULT ARRAY[]::"CommunicationMethod"[],

    CONSTRAINT "CommunicationPreference_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "CommunicationPreference" ADD CONSTRAINT "CommunicationPreference_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
