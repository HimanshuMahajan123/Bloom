import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import prisma from "../db/prisma.js";
/* ---------------- RIGHT SWIPE ---------------- */
export const rightSwipe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.body;

  if (!otherUserId || otherUserId === userId) {
    throw new ApiError(400, "Invalid target user");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: { verified: true, onboardingCompleted: true },
  });

  if (!otherUser || !otherUser.verified || !otherUser.onboardingCompleted) {
    throw new ApiError(404, "User not available");
  }

  const result = await prisma.$transaction(async (tx) => {
    // 1️⃣ Remove pending signal
    await tx.signal.deleteMany({
      where: {
        fromUserId: otherUserId,
        toUserId: userId,
      },
    });

    // 2️⃣ Check existing interaction
    const existing = await tx.userInteraction.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: otherUserId,
        },
      },
    });

    if (existing?.state === "REJECTED") {
      return { matched: false, type: "BLOCKED" };
    }

    // 3️⃣ Record LIKE
    await tx.userInteraction.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: otherUserId,
        },
      },
      update: { state: "LIKED" },
      create: {
        fromUserId: userId,
        toUserId: otherUserId,
        state: "LIKED",
      },
    });

    // 4️⃣ Check reciprocal
    const reciprocal = await tx.userInteraction.findUnique({
      where: {
        fromUserId_toUserId: {
          fromUserId: otherUserId,
          toUserId: userId,
        },
      },
    });

    if (reciprocal?.state === "LIKED") {
      return { matched: true, type: "MATCH" };
    }

    return { matched: false, type: "SPARK" };
  });

  return res.json(
    new ApiResponse(
      200,
      result,
      result.type === "MATCH" ? "It's a match" : "Spark sent",
    ),
  );
});

/* ---------------- LEFT SWIPE ---------------- */
export const leftSwipe = asyncHandler
(async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.body;

  if (!otherUserId || otherUserId === userId) {
    throw new ApiError(400, "Invalid target user");
  }

  await prisma.$transaction(async (tx) => {
    // remove signal
    await tx.signal.deleteMany({
      where: {
        fromUserId: otherUserId,
        toUserId: userId,
      },
    });

    // record rejection
    await tx.userInteraction.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: otherUserId,
        },
      },
      update: { state: "REJECTED" },
      create: {
        fromUserId: userId,
        toUserId: otherUserId,
        state: "REJECTED",
      },
    });
  });

  return res.json(new ApiResponse(200, null, "Left swipe recorded"));
})  ;

