const MAX_SIGNALS = 20;

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

export const checkSignals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const myGender = req.user.gender;
  const myRoll = req.user.rollNumber;

  const now = new Date();

  const LIVE_THRESHOLD = 0.4;
  const PERFECT_THRESHOLD = 0.7;

  const TTL_MS = 24 * 60 * 60 * 1000;

  /* ----------------------------------
     1️⃣ Existing inbox signals
  ---------------------------------- */

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
          poem: true,
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: MAX_SIGNALS,
  });

  /* ----------------------------------
     2️⃣ Candidate pools
  ---------------------------------- */

  const nearbyIds = getNearbyUsers(userId, 50);

  const globalCandidates = await prisma.user.findMany({
    where: {
      id: { not: userId },
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

  const globalIds = globalCandidates.map((u) => u.id);

  const candidatePool = new Set([...nearbyIds, ...globalIds]);

  if (!candidatePool.size) {
    return res.json(
      new ApiResponse(200, {
        signals: existingSignals.map((s) => ({
          id: s.fromUser.id,
          username: s.fromUser.username,
          avatarUrl: s.fromUser.avatarUrl,
          poem: s.fromUser.poem,
          score: s.score,
        })),
      }),
    );
  }

  /* ----------------------------------
     3️⃣ Block interacted users
  ---------------------------------- */

  const interactions = await prisma.userInteraction.findMany({
    where: {
      OR: [
        { fromUserId: userId, toUserId: { in: [...candidatePool] } },
        { toUserId: userId, fromUserId: { in: [...candidatePool] } },
      ],
    },
    select: { fromUserId: true, toUserId: true },
  });

  const blocked = new Set();

  interactions.forEach((i) => {
    blocked.add(i.fromUserId);
    blocked.add(i.toUserId);
  });

  /* ----------------------------------
     4️⃣ Remove fully-signaled pairs
  ---------------------------------- */

  const activeSignals = await prisma.signal.findMany({
    where: {
      expiresAt: { gt: now },
      OR: [
        { fromUserId: userId, toUserId: { in: [...candidatePool] } },
        { toUserId: userId, fromUserId: { in: [...candidatePool] } },
      ],
    },
    select: { fromUserId: true, toUserId: true },
  });

  const signalCount = new Map();

  for (const s of activeSignals) {
    const other = s.fromUserId === userId ? s.toUserId : s.fromUserId;

    signalCount.set(other, (signalCount.get(other) || 0) + 1);
  }

  const fullySignaled = new Set();
  for (const [id, count] of signalCount.entries()) {
    if (count >= 2) fullySignaled.add(id);
  }

  /* ----------------------------------
     5️⃣ Final candidate objects
  ---------------------------------- */

  const finalCandidates = globalCandidates.filter(
    (u) => !blocked.has(u.id) && !fullySignaled.has(u.id),
  );

  /* ----------------------------------
     6️⃣ FAISS scoring
  ---------------------------------- */

  const scored = await Promise.allSettled(
    finalCandidates.map((u) => {
      const maleRoll = myGender === "MALE" ? myRoll : u.rollNumber;

      const femaleRoll = myGender === "FEMALE" ? myRoll : u.rollNumber;

      return axios
        .get(process.env.FAISS_SERVICE_URL + "/score", {
          params: {
            maleRollNo: maleRoll,
            femaleRollNo: femaleRoll,
          },
          timeout: 2000,
        })
        .then((r) => ({
          user: u,
          score: Number(r.data?.score || 0),
        }));
    }),
  );

  /* ----------------------------------
     7️⃣ Insert signals
  ---------------------------------- */

  const newSignals = [];

  for (const r of scored) {
    if (existingSignals.length + newSignals.length >= MAX_SIGNALS) break;

    if (r.status !== "fulfilled") continue;

    const { user, score } = r.value;

    let source = null;

    if (score >= PERFECT_THRESHOLD) source = "PERFECT_MATCH";
    else if (score >= LIVE_THRESHOLD) source = "PROXIMITY";

    if (!source) continue;

    const expiresAt = new Date(Date.now() + TTL_MS);

    // ME inbox
    await prisma.signal.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: user.id,
          toUserId: userId,
        },
      },
      update: { score, expiresAt, source },
      create: {
        fromUserId: user.id,
        toUserId: userId,
        score,
        expiresAt,
        source,
      },
    });

    // THEM inbox
    await prisma.signal.upsert({
      where: {
        fromUserId_toUserId: {
          fromUserId: userId,
          toUserId: user.id,
        },
      },
      update: { score, expiresAt, source },
      create: {
        fromUserId: userId,
        toUserId: user.id,
        score,
        expiresAt,
        source,
      },
    });

    newSignals.push({
      id: user.id,
      username: user.username,
      avatarUrl: user.avatarUrl,
      poem: user.poem,
      score,
      source,
    });
  }

  /* ----------------------------------
     8️⃣ Response
  ---------------------------------- */

  return res.json(
    new ApiResponse(200, {
      signals: [
        ...existingSignals.map((s) => ({
          id: s.fromUser.id,
          username: s.fromUser.username,
          avatarUrl: s.fromUser.avatarUrl,
          poem: s.fromUser.poem,
          score: s.score,
          source: s.source,
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
