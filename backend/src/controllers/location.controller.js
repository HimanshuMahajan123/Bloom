const MAX_SIGNALS = 20;
const CENTRAL_THRESHOLD = 0.35;
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

  /* 1️⃣ Fetch inbox signals ONLY */
  //select user details from USER and signal details from SIGNAL where toUserId = userId and expiresAt > now order by createdAt desc limit MAX_SIGNALS
  const existingSignals = await prisma.signal.findMany({
    where: {
      toUserId: userId,
      expiresAt: { gt: now },
    },
    select: {
      score: true,
      source: true,
      fromUser: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          poem: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_SIGNALS,
  });

  /* 2️⃣ Nearby users */
  const nearby = getNearbyUsers(userId, 300);
  if (!nearby.length) {
    return res.json(
      new ApiResponse(
        200,
        {
          signals: existingSignals.map((s) => ({
            id: s.fromUser.id,
            username: s.fromUser.username,
            avatarUrl: s.fromUser.avatarUrl,
            poem: s.fromUser.poem,
            score: s.score,
            source: s.source,
          })),
        },
        "no nearby users found",
      ),
    );
  }

  /* 3️⃣ Block users with any interaction */
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
  interactions.forEach((i) => {
    blocked.add(i.fromUserId);
    blocked.add(i.toUserId);
  });

  /* 4️⃣ Remove already-signaled users */
  // const alreadySignaled = new Set(existingSignals.map((s) => s.fromUserId));

  const candidates = nearby.filter(
    (uid) => uid !== userId && !blocked.has(uid),
  );

  if (!candidates.length) {
    return res.json(
      new ApiResponse(200, {
        signals: existingSignals.map((s) => ({
          id: s.fromUser.id,
          username: s.fromUser.username,
          avatarUrl: s.fromUser.avatarUrl,
          poem: s.fromUser.poem,
          score: s.score,
          source: s.source,
        })),
      }),
    );
  }

  /* 5️⃣ Fetch candidate profiles */
  const users = await prisma.user.findMany({
    where: {
      id: { in: candidates },
      gender: { not: myGender },
      verified: true,
      onboardingCompleted: true,
    },
    select: {
      id: true,
      rollNumber: true,
      username: true,
      avatarUrl: true,
      poem: true,
    },
  });

  /* 6️⃣ Score via FAISS */
  const scored = await Promise.allSettled(
    users.map((u) => {
      let maleRoll, femaleRoll;

      if (myGender === "MALE") {
        maleRoll = myRoll;
        femaleRoll = u.rollNumber;
      } else {
        maleRoll = u.rollNumber;
        femaleRoll = myRoll;
      }

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

  const newSignals = [];
  const ops = [];

  for (const result of scored) {
    if (result.status !== "fulfilled") continue;
    if (result.value.score < CENTRAL_THRESHOLD) continue;

    const { user, score } = result.value;
    const expiresAt = new Date(Date.now() + 86400000);

    ops.push(
      prisma.signal.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: user.id,
            toUserId: userId,
          },
        },
        update: { expiresAt, score },
        create: {
          fromUserId: user.id,
          toUserId: userId,
          score,
          source: "PROXIMITY",
          expiresAt,
        },
      }),
      prisma.signal.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: userId,
            toUserId: user.id,
          },
        },
        update: { expiresAt, score },
        create: {
          fromUserId: userId,
          toUserId: user.id,
          score,
          source: "PROXIMITY",
          expiresAt,
        },
      }),
    );

    newSignals.push({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      poem: user.poem,
      score,
      source: "PROXIMITY",
    });
    if (existingSignals.length + newSignals.length >= MAX_SIGNALS) break;
  }

  if (ops.length) {
    await prisma.$transaction(ops);
  }

  return res.json(
    new ApiResponse(200, {
      signals: [
        ...existingSignals.map((s) => ({
          id: s.fromUser.id,
          username: s.fromUser.username,
          avatarUrl: s.fromUser.avatarUrl,
          poem: s.fromUser.poem,
          source: s.source,
          score: s.score,
        })),
        ...newSignals,
      ],
    }),
  );
});

/* ---------------- GET SIGNAL SCORE ---------------- */

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

  if (me.gender === other.gender) {
    return res.json(new ApiResponse(200, { score: 0 }));
  }

  const male = me.gender === "MALE" ? me : other;
  const female = me.gender === "FEMALE" ? me : other;

  let score = 0;

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

  return res.json(new ApiResponse(200, { score }));
});
