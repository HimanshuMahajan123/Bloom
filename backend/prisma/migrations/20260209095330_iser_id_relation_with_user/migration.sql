-- AddForeignKey
ALTER TABLE "UsernamePool" ADD CONSTRAINT "UsernamePool_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
