const CENTRAL_THRESHOLD = 0.6;
const MAX_SIGNALS = 5;
import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import prisma from "../db/prisma.js";
import axios from "axios";

import { updateUserLocation, getNearbyUsers } from "../store/locationStore.js";


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
  const now = new Date();

  /* 1️⃣ Existing active signals */
  const existingSignals = await prisma.signal.findMany({
    where: {
      toUserId: userId,
      expiresAt: { gt: now },
    },
    include: {
      fromUser: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  if (existingSignals.length >= MAX_SIGNALS) {
    return res.json(
      new ApiResponse(200, {
        signals: existingSignals.map(s => ({
          id: s.fromUser.id,
          username: s.fromUser.username,
          avatarUrl: s.fromUser.avatarUrl,
          score: s.score,
        })),
      }),
    );
  }

  /* 2️⃣ Nearby users */
  const nearby = getNearbyUsers(userId, 50);
  if (!nearby.length) {
    return res.json(new ApiResponse(200, { signals: [] }));
  }

  const alreadySignaled = new Set(existingSignals.map(s => s.fromUserId));

  /* 3️⃣ Remove users with interactions */
  const interactions = await prisma.userInteraction.findMany({
    where: {
      OR: [
        { fromUserId: userId, toUserId: { in: nearby } },
        { toUserId: userId, fromUserId: { in: nearby } },
      ],
    },
    select: { fromUserId: true, toUserId: true },
  });

  const blocked = new Set();
  interactions.forEach(i => {
    blocked.add(i.fromUserId);
    blocked.add(i.toUserId);
  });

  const candidates = nearby.filter(
    uid =>
      uid !== userId &&
      !alreadySignaled.has(uid) &&
      !blocked.has(uid),
  );

  if (!candidates.length) {
    return res.json(
      new ApiResponse(200, {
        signals: existingSignals.map(s => ({
          id: s.fromUser.id,
          username: s.fromUser.username,
          avatarUrl: s.fromUser.avatarUrl,
          score: s.score,
        })),
      }),
    );
  }

  /* 4️⃣ Fetch profiles */
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

  /* 5️⃣ Score via FAISS */
  const scored = await Promise.allSettled(
    users.map(u => {
      const maleRoll = myGender === "MALE" ? myRoll : u.rollNumber;
      const femaleRoll = myGender === "FEMALE" ? myRoll : u.rollNumber;

      return axios
        .get(process.env.FAISS_SERVICE_URL + "/score", {
          params: { maleRollNo: maleRoll, femaleRollNo: femaleRoll },
          timeout: 1500,
        })
        .then(r => ({
          user: u,
          score: Number(r.data?.score || 0),
        }));
    }),
  );

  const newSignals = [];

  for (const result of scored) {
    if (
      result.status === "fulfilled" &&
      result.value.score >= CENTRAL_THRESHOLD
    ) {
      const { user, score } = result.value;

      await prisma.signal.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: user.id,
            toUserId: userId,
          },
        },
        update: {},
        create: {
          fromUserId: user.id,
          toUserId: userId,
          score,
          expiresAt: new Date(Date.now() + 10 * 60 * 1000), // 10 min
        },
      });

      newSignals.push({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        score,
      });

      if (existingSignals.length + newSignals.length >= MAX_SIGNALS) break;
    }
  }

  return res.json(
    new ApiResponse(200, {
      signals: [
        ...existingSignals.map(s => ({
          id: s.fromUser.id,
          username: s.fromUser.username,
          avatarUrl: s.fromUser.avatarUrl,
          score: s.score,
          poem: s.fromUser.poem,
        })),
        ...newSignals,
      ],
    }),
  );
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
