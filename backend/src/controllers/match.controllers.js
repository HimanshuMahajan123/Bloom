import { prisma } from "../prismaClient.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";

export const rightSwipe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.body;

  if (!otherUserId || userId === otherUserId) {
    throw new ApiError(400, "Invalid target user");
  }

  /* 1. Record / update my like */
  await prisma.userInteraction.upsert({
    where: {
      fromUserId_toUserId: {
        fromUserId: userId,
        toUserId: otherUserId,
      },
    },
    update: {
      state: "LIKED",
    },
    create: {
      fromUserId: userId,
      toUserId: otherUserId,
      state: "LIKED",
    },
  });

  /* 2. Check reciprocal */
  const reciprocal = await prisma.userInteraction.findUnique({
    where: {
      fromUserId_toUserId: {
        fromUserId: otherUserId,
        toUserId: userId,
      },
    },
  });

  if (reciprocal?.state === "LIKED") {
    // ✅ MATCH
    // emit "match" notification to BOTH users
    // (socket / push / polling-friendly)

    return res.status(200).json(
      new ApiResponse(200, {
        matched: true,
        type: "MATCH",
      }, "It's a match")
    );
  }

  // 💫 ONE-SIDED LIKE → spark notification to other user
  return res.status(200).json(
    new ApiResponse(200, {
      matched: false,
      type: "SPARK",
    }, "Spark sent")
  );
});


export const leftSwipe = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.body;

  if (!otherUserId || userId === otherUserId) {
    throw new ApiError(400, "Invalid target user");
  }

  await prisma.userInteraction.upsert({
    where: {
      fromUserId_toUserId: {
        fromUserId: userId,
        toUserId: otherUserId,
      },
    },
    update: {
      state: "REJECTED",
    },
    create: {
      fromUserId: userId,
      toUserId: otherUserId,
      state: "REJECTED",
    },
  });

  return res.status(200).json(
    new ApiResponse(200, null, "Left swipe recorded")
  );
});
