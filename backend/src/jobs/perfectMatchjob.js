import cron from "node-cron";
import prisma from "../db/prisma.js";
import { findPerfectMatches } from "../controllers/profile.controllers.js";
const PERFECT_THRESHOLD = 0.95; // Minimum score for a perfect match
const TTL = 3 * 60; // 3 hours in milliseconds
//cron format is "minute hour dayOfMonth month dayOfWeek
//every 3 hrs  fetch location of all users and calculate signals
cron.schedule("0 */3 * * *", async () => {
  // Runs every 3 hours
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
      users.map((u) => findPerfectMatches(u.id, PERFECT_THRESHOLD, TTL)),
    );

    console.log(" Perfect match job finished");
  } catch (err) {
    console.error(" Cron job failed:", err);
  }
});
