/*
  Warnings:

  - The values [SIGNAL] on the enum `InteractionState` will be removed. If these variants are still used in the database, this will fail.

*/
-- CreateEnum
CREATE TYPE "SignalSource" AS ENUM ('PROXIMITY');

-- AlterEnum
BEGIN;
CREATE TYPE "InteractionState_new" AS ENUM ('LIKED', 'REJECTED');
ALTER TABLE "UserInteraction" ALTER COLUMN "state" TYPE "InteractionState_new" USING ("state"::text::"InteractionState_new");
ALTER TYPE "InteractionState" RENAME TO "InteractionState_old";
ALTER TYPE "InteractionState_new" RENAME TO "InteractionState";
DROP TYPE "public"."InteractionState_old";
COMMIT;

-- CreateTable
CREATE TABLE "Signal" (
    "id" TEXT NOT NULL,
    "fromUserId" TEXT NOT NULL,
    "toUserId" TEXT NOT NULL,
    "score" DOUBLE PRECISION NOT NULL,
    "source" "SignalSource" NOT NULL DEFAULT 'PROXIMITY',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Signal_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "Signal_toUserId_expiresAt_idx" ON "Signal"("toUserId", "expiresAt");

-- CreateIndex
CREATE UNIQUE INDEX "Signal_fromUserId_toUserId_key" ON "Signal"("fromUserId", "toUserId");

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_fromUserId_fkey" FOREIGN KEY ("fromUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Signal" ADD CONSTRAINT "Signal_toUserId_fkey" FOREIGN KEY ("toUserId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
