import cron from "node-cron";
import prisma from "../db/prisma.js";
import { findPerfectMatches } from "../controllers/profile.controllers.js";
const PERFECT_THRESHOLD = 0.7; // Adjust this threshold as needed
const TTL_MINUTES = 24*60; // Time-to-live for perfect matches in minutes
//cron format is "minute hour dayOfMonth month dayOfWeek"
cron.schedule("* * * * *", async () => { // Runs at every minute
  console.log("✅ Perfect match job started");

  try {
    const users = await prisma.user.findMany({
      where: {
        verified: true,
        onboardingCompleted: true,
      },
      select: { id: true },
    });

   await Promise.allSettled(
  users.map(u => findPerfectMatches(u.id))
);


    console.log(" Perfect match job finished");
  } catch (err) {
    console.error(" Cron job failed:", err);
  }
});
