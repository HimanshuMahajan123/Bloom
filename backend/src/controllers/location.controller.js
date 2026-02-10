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
  const tag = `[LOC-API:${userId.slice(0, 6)}]`;

  if (typeof latitude !== "number" || typeof longitude !== "number") {
    console.log(`${tag} invalid coords`, { latitude, longitude });
    throw new ApiError(400, "Invalid coordinates");
  }

  updateUserLocation(userId, latitude, longitude);

  console.log(
    `${tag} updated → lat=${latitude.toFixed(6)} lng=${longitude.toFixed(6)}`,
  );

  return res.status(200).json(new ApiResponse(200, "Location updated"));
});

/* ---------------- LIVE SIGNAL CHECK ---------------- */

export const checkLiveSignals = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const myGender = req.user.gender;
  const myRoll = req.user.rollNumber;
  const now = new Date();
  const tag = `[SIGNALS:${userId.slice(0, 6)}]`;

  console.log(`${tag} START`);

  /* 1️⃣ Existing inbox signals */
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

  console.log(
    `${tag} existing inbox signals = ${existingSignals.length}`,
  );

  /* 2️⃣ Nearby users */
  const nearby = getNearbyUsers(userId, 400);

  console.log(`${tag} nearby users`, nearby.map((u) => u.slice(0, 6)));

  if (!nearby.length) {
    console.log(`${tag} EXIT → no nearby users`);
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

  /* 3️⃣ Interaction block */
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

  console.log(`${tag} blocked users`, [...blocked].map((u) => u.slice(0, 6)));

  /* 4️⃣ Candidate filtering */
  const candidates = nearby.filter(
    (uid) => uid !== userId && !blocked.has(uid),
  );

  console.log(
    `${tag} after block filter`,
    candidates.map((u) => u.slice(0, 6)),
  );

  if (!candidates.length) {
    console.log(`${tag} EXIT → no candidates after filtering`);
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

  console.log(
    `${tag} eligible users`,
    users.map((u) => u.id.slice(0, 6)),
  );

  /* 6️⃣ FAISS scoring */
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
          params: { maleRollNo: maleRoll, femaleRollNo: femaleRoll },
          timeout: 1500,
        })
        .then((r) => {
          const score = Number(r.data?.score || 0);
          console.log(
            `${tag} FAISS score → user=${u.id.slice(0, 6)} score=${score}`,
          );
          return { user: u, score };
        })
        .catch((err) => {
          console.log(
            `${tag} FAISS FAILED → user=${u.id.slice(0, 6)} err=${err.message}`,
          );
          throw err;
        });
    }),
  );

  const newSignals = [];
  const ops = [];

  for (const result of scored) {
    if (result.status !== "fulfilled") continue;
    if (result.value.score < CENTRAL_THRESHOLD) {
      console.log(
        `${tag} DROP → low score user=${result.value.user.id.slice(
          0,
          6,
        )} score=${result.value.score}`,
      );
      continue;
    }

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
  }

  console.log(
    `${tag} new signals generated`,
    newSignals.map((s) => ({
      id: s.id.slice(0, 6),
      score: s.score,
    })),
  );

  if (ops.length) {
    await prisma.$transaction(ops);
  }

  const finalSignals = await prisma.signal.findMany({
    where: {
      toUserId: userId,
      expiresAt: { gt: new Date() },
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

  console.log(
    `${tag} FINAL RESPONSE`,
    finalSignals.map((s) => ({
      id: s.fromUser.id.slice(0, 6),
      score: s.score,
    })),
  );

  console.log(`${tag} END`);

  return res.json(
    new ApiResponse(200, {
      signals: finalSignals.map((s) => ({
        id: s.fromUser.id,
        username: s.fromUser.username,
        avatarUrl: s.fromUser.avatarUrl,
        poem: s.fromUser.poem,
        source: s.source,
        score: s.score,
      })),
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
