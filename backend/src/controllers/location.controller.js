const CENTRAL_THRESHOLD = 0.6;
const MAX_SIGNALS = 5;
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import prisma from "../db/prisma.js";
import axios from "axios";

import { updateUserLocation, getNearbyUsers } from "../store/locationStore.js";

import { hasSeenSignal, markSignalSeen } from "../store/signalCache.js";

/* ---------------- UPDATE LOCATION ---------------- */

export const updateLocation = asyncHandler(async (req, res) => {
  const { latitude, longitude } = req.body;
  const userId = req.user.id;
  console.log(
    `Received location update from user ${userId}: (${latitude}, ${longitude})`,
  );
  if (typeof latitude !== "number" || typeof longitude !== "number") {
    throw new ApiError(400, "Invalid coordinates");
  }

  updateUserLocation(userId, latitude, longitude);
  return res.status(200).json(new ApiResponse(200, "Location updated"));
});

/* ---------------- LIVE SIGNAL CHECK ---------------- */

export const checkLiveSignals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const myGender = req.user.gender;
  const myRoll = req.user.rollNumber;

  /* 1. Nearby users (memory-only) */
  const nearby = getNearbyUsers(userId, 50);
  if (!nearby.length) {
    return res.json(new ApiResponse(200, { signals: [] }));
  }

  /* 2. Remove already-delivered signals */
  const unseen = nearby.filter(
    (uid) => uid !== userId && !hasSeenSignal(userId, uid),
  );
  if (!unseen.length) {
    return res.json(new ApiResponse(200, { signals: [] }));
  }

  /* 3. Remove users with ANY past interaction */
  const interactions = await prisma.userInteraction.findMany({
    where: {
      OR: [
        { fromUserId: userId, toUserId: { in: unseen } },
        { toUserId: userId, fromUserId: { in: unseen } },
      ],
    },
    select: { fromUserId: true, toUserId: true },
  });

  const blocked = new Set();
  interactions.forEach((i) => {
    blocked.add(i.fromUserId);
    blocked.add(i.toUserId);
  });

  const candidates = unseen.filter((uid) => !blocked.has(uid));
  if (!candidates.length) {
    return res.json(new ApiResponse(200, { signals: [] }));
  }

  /* 4. Fetch opposite-gender profiles */
  const users = await prisma.user.findMany({
    where: {
      id: { in: candidates },
      gender: { not: myGender },
    },
    select: {
      id: true,
      rollNumber: true,
      username: true,
      avatarUrl: true,
    },
  });

  if (!users.length) {
    return res.json(new ApiResponse(200, { signals: [] }));
  }

  /* 5. Score + threshold filter */
  const qualified = [];

  const scored = await Promise.allSettled(
    users.map((u) => {
      const maleRoll = myGender === "MALE" ? myRoll : u.rollNumber;
      const femaleRoll = myGender === "FEMALE" ? myRoll : u.rollNumber;

      return axios
        .get(process.env.FAISS_SERVICE_URL + "/score", {
          params: {
            maleRollNo: maleRoll,
            femaleRollNo: femaleRoll,
          },
          timeout: 1500,
        })
        .then((r) => ({
          user: u,
          score: Number(r.data?.score || 0),
        }));
    }),
  );
  console.log("FAISS scoring results:", scored);

  for (const result of scored) {
    if (
      result.status === "fulfilled" &&
      result.value.score >= CENTRAL_THRESHOLD
    ) {
      qualified.push({
        id: result.value.user.id,
        username: result.value.user.username,
        avatarUrl: result.value.user.avatarUrl,
        score: result.value.score,
      });

      markSignalSeen(userId, result.value.user.id);

      if (qualified.length >= MAX_SIGNALS) break;
    }
   

    if (result.status === "rejected") {
      console.error("FAISS score failed:", result.reason?.message);
    }
  }

  return res.json(new ApiResponse(200, { signals: qualified }));
});

export const getSignalScore = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const { otherUserId } = req.params;

  const users = await prisma.user.findMany({
    where: { id: { in: [userId, otherUserId] } },
    select: {
      id: true,
      rollNumber: true,
      gender: true,
    },
  });

  if (users.length !== 2) {
    throw new ApiError(404, "User not found");
  }

  const me = users.find((u) => u.id === userId);
  const other = users.find((u) => u.id === otherUserId);

  if (!me || !other) {
    throw new ApiError(404, "User not found");
  }

  if (me.gender === other.gender) {
    return res.json(new ApiResponse(200, { score: 0 }));
  }

  const male = me.gender === "MALE" ? me : other;
  const female = me.gender === "FEMALE" ? me : other;

  try {
    const { data } = await axios.get(process.env.FAISS_SERVICE_URL + "/score", {
      params: {
        maleRollNo: male.rollNumber,
        femaleRollNo: female.rollNumber,
      },
      timeout: 2000,
    });

    score = Number(data?.score || 0);
  } catch (err) {
    console.error("FAISS score error:", err.message);
  }

  return res.json(
    new ApiResponse(200, {
      score,
    }),
  );
});
