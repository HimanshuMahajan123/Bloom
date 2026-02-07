-- DropIndex
DROP INDEX "User_username_key";

-- CreateIndex
CREATE INDEX "User_createdAt_idx" ON "User"("createdAt");
