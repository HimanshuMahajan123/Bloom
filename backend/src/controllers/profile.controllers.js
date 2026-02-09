import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import prisma from "../db/prisma.js";
import { Groq } from "groq-sdk";
import { response } from "express";
import axios from "axios";
const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const submitAnswersAndGenerateProfile = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const userId = req.user.id;
  const rollNumber = req.user.rollNumber;
  console.log("Received answers:", answers);
  console.log(answers.length);
  /* ---------------- VALIDATION ---------------- */

  if (!Array.isArray(answers) || answers.length !== 10) {
    throw new ApiError(400, "Exactly 10 answers are required");
  }

  for (const ans of answers) {
    if (
      typeof ans !== "object" ||
      typeof ans.answer !== "string" ||
      ans.answer.trim().length < 3
    ) {
      throw new ApiError(400, "Invalid answer format");
    }
  }

  /* ---------------- NORMALIZE ---------------- */

  const normalizedAnswers = answers.map((a) => a.answer.trim());

  const gender = normalizedAnswers[4].toUpperCase();
  if (gender !== "MALE" && gender !== "FEMALE") {
    throw new ApiError(400, "Invalid gender answer");
  }

  /* ---------------- USER CHECK ---------------- */

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(404, "User not found");
  if (user.onboardingCompleted) {
    throw new ApiError(400, "Profile already generated");
  }

  /* ---------------- SAVE ANSWERS ---------------- */

  const submission = await prisma.onboardingSubmission.upsert({
    where: { userId },
    update: { answers: normalizedAnswers },
    create: {
      userId,
      rollNumber,
      answers: normalizedAnswers,
    },
  });

  /* ---------------- EXTERNAL SERVICE (NON-BLOCKING) ---------------- */
  const data = {
    rollno: rollNumber,
    responses: normalizedAnswers,
  };
  console.log("Sending data to external service:", data);
  axios
    .post(process.env.FAISS_SERVICE_URL + "/user/register", data, {
      timeout: 5000,
    })
    .catch((err) => {
      console.error("External service error:", err.message);
    });

  /* ---------------- PROFILE GENERATION ---------------- */

  const prompt = `
  Write a romantic but natural dating profile for a college student using the answers below.

  Rules:
  - 100-150 words only
  - If the answers feel meaningless or random (spam) then no need to write 100-150 words , just write a simple profile which says something like "User is still discovering themselves and has not shared much about their personality yet."
  - warm and heartfelt, not cheesy and simple, everyday language
  - no fancy or dramatic metaphors
  - sound human, not AI-generated
  - do not mention questions, quizzes, or prompts
  - output only the final profile text
  - no names 

  Answers:
  ${normalizedAnswers.map((a, i) => `${i + 1}. ${a}`).join("\n")}
  `;

  let poem = "A mysterious romantic soul.";

  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    });

    poem = completion.choices?.[0]?.message?.content?.trim() || poem;
  } catch (err) {
    console.error("Groq error:", err);
    throw new ApiError(502, "Profile generation failed");
  }

  /* ---------------- USERNAME + AVATAR ---------------- */

  const [username] = await prisma.$transaction(async (tx) => {
    const usernames = await tx.usernamePool.findMany({
      where: { gender, taken: false },
    });

    if (!usernames.length) throw new Error("No usernames left");

    const chosen = usernames[Math.floor(Math.random() * usernames.length)];
    console.log("Chosen username:", chosen.name);
    console.log("Chosen username ID:", chosen.id);

    await tx.usernamePool.update({
      where: { id: chosen.id },
      data: { taken: true, userId },
    });

    return [chosen];
  });

  const avatarNumber =
    gender === "MALE"
      ? Math.floor(Math.random() * 19) + 1
      : Math.floor(Math.random() * 12) + 1;

  const avatarUrl = `/${gender.toLowerCase()}/${avatarNumber}.png`;

  /* ---------------- FINAL UPDATE ---------------- */
  console.log("username:", username.name);
  console.log("avatarUrl:", avatarUrl);
  console.log("poem:", poem);
  await prisma.user.update({
    where: { id: userId },
    data: {
      gender,
      username: username.name,
      avatarUrl,
      poem,
      onboardingCompleted: true,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, "Profile generated successfully", {
      poem,
      submissionId: submission.id,
      username: username.name,
      avatarUrl,
    }),
  );
});

const homePageContent = asyncHandler(async (req, res) => {
  const limit = Math.min(parseInt(req.query.limit) || 10, 30);

  const cursorCreatedAt = req.query.cursor;
  const cursorId = req.query.id;

  let whereClause = {
    verified: true,
    poem: {
      not: "",
    },
    id: {
      not: req.user.id,
    },
  };

  if (cursorCreatedAt && cursorId) {
    whereClause = {
      ...whereClause,
      OR: [
        {
          createdAt: {
            lt: new Date(cursorCreatedAt),
          },
        },
        {
          createdAt: new Date(cursorCreatedAt),
          id: {
            lt: cursorId,
          },
        },
      ],
    };
  }

  const users = await prisma.user.findMany({
    where: whereClause,

    orderBy: [{ createdAt: "desc" }, { id: "desc" }],

    take: limit + 1,
    select: {
      id: true,
      createdAt: true,
      username: true,
      poem: true,
    },
  });

  const hasMore = users.length > limit;

  const results = hasMore ? users.slice(0, limit) : users;

  let nextCursor = null;

  if (hasMore) {
    const last = results[results.length - 1];
    nextCursor = {
      cursor: last.createdAt.toISOString(),
      id: last.id,
    };
  }

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        items: results.map((u) => ({
          id: u.id,
          username: u.username,
          poem: u.poem,
        })),
        nextCursor,
      },
      "Home page content fetched successfully",
    ),
  );
});

const notificationsPanel = asyncHandler(async (req, res) => {
  const userId = req.user.id;

  /* ---------------- 1️⃣ Fetch ALL interactions involving me ---------------- */

  const interactions = await prisma.userInteraction.findMany({
    where: {
      OR: [{ fromUserId: userId }, { toUserId: userId }],
    },
    include: {
      fromUser: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          poem: true,
          verified: true,
          onboardingCompleted: true,
        },
      },
      toUser: {
        select: {
          id: true,
          username: true,
          avatarUrl: true,
          poem: true,
          verified: true,
          onboardingCompleted: true,
        },
      },
    },
  });

  /* ---------------- 2️⃣ Group by other user ---------------- */

  const map = new Map();

  for (const i of interactions) {
    const other = i.fromUserId === userId ? i.toUser : i.fromUser;

    if (!other || !other.verified || !other.onboardingCompleted) continue;

    if (!map.has(other.id)) {
      map.set(other.id, {
        user: other,
        meToThem: null,
        themToMe: null,
        timestamps: [],
      });
    }

    const entry = map.get(other.id);

    if (i.fromUserId === userId) {
      entry.meToThem = i.state;
    } else {
      entry.themToMe = i.state;
    }

    entry.timestamps.push(i.updatedAt);
  }

  /* ---------------- 3️⃣ Classify ---------------- */

  const likes = [];
  const resonance = [];

  for (const entry of map.values()) {
    const { user, meToThem, themToMe, timestamps } = entry;

    // ❌ Any rejection kills the entry
    if (meToThem === "REJECTED" || themToMe === "REJECTED") {
      continue;
    }

    // ❤️ Mutual like
    if (meToThem === "LIKED" && themToMe === "LIKED") {
      resonance.push({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        poem: user.poem,
        matchedAt: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
      });
      continue;
    }

    // 💌 One-sided like
    if (meToThem === "LIKED" || themToMe === "LIKED") {
      likes.push({
        id: user.id,
        username: user.username,
        avatarUrl: user.avatarUrl,
        poem: user.poem,
        receivedAt: new Date(Math.max(...timestamps.map((t) => t.getTime()))),
      });
    }
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { likes, resonance },
        "Notifications fetched successfully",
      ),
    );
});

const findPerfectMatches = async (userId, PERFECT_THRESHOLD, TTL_MINUTES) => {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      gender: true,
      rollNumber: true,
    },
  });

  if (!user) {
    throw new Error("User not found");
  }

  const myGender = user.gender;
  const myRoll = user.rollNumber;

  /* --------------------------------------------------
  Fetch all eligible opposite-gender users
  -------------------------------------------------- */

  const allCandidates = await prisma.user.findMany({
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
    },
  });

  if (!allCandidates.length) {
    throw new Error("No candidates found");
  }

  const candidateIds = allCandidates.map((u) => u.id);

  /* --------------------------------------------------
     2️⃣ Remove anyone with ANY past interaction
  -------------------------------------------------- */

  const interactions = await prisma.userInteraction.findMany({
    where: {
      OR: [
        { fromUserId: userId, toUserId: { in: candidateIds } },
        { toUserId: userId, fromUserId: { in: candidateIds } },
      ],
    },
    select: {
      fromUserId: true,
      toUserId: true,
    },
  });

  const blocked = new Set();
  interactions.forEach((i) => {
    blocked.add(i.fromUserId);
    blocked.add(i.toUserId);
  });

  const interactionFiltered = allCandidates.filter((u) => !blocked.has(u.id));

  if (!interactionFiltered.length) {
    throw new Error("No interaction candidates found");
  }

  const interactionIds = interactionFiltered.map((u) => u.id);

  /* --------------------------------------------------
    Remove users with existing unexpired signals
  -------------------------------------------------- */
  const activeSignals = await prisma.signal.findMany({
    where: {
      expiresAt: { gt: new Date() },
      OR: [
        {
          fromUserId: userId,
          toUserId: { in: interactionIds },
        },
        {
          toUserId: userId,
          fromUserId: { in: interactionIds },
        },
      ],
    },
    select: {
      fromUserId: true,
      toUserId: true,
    },
  });

  // count directions per pair
  const signalCount = new Map();

  for (const s of activeSignals) {
    const other = s.fromUserId === userId ? s.toUserId : s.fromUserId;

    signalCount.set(other, (signalCount.get(other) || 0) + 1);
  }

  // exclude only if both directions exist
  const fullySignaled = new Set();
  for (const [otherId, count] of signalCount.entries()) {
    if (count >= 2) fullySignaled.add(otherId);
  }

  const signalFiltered = interactionFiltered.filter(
    (u) => !fullySignaled.has(u.id),
  );

  if (!signalFiltered.length) {
    return "No signal candidates found";
  }

  /* --------------------------------------------------
     4️⃣ FAISS scoring (parallel)
  -------------------------------------------------- */

  const scored = await Promise.allSettled(
    signalFiltered.map((u) => {
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
          timeout: 2000,
        })
        .then((r) => ({
          user: u,
          score: Number(r.data?.score || 0),
        }));
    }),
  );

  const qualified = [];

  for (const r of scored) {
    if (r.status === "fulfilled" && r.value.score >= PERFECT_THRESHOLD) {
      qualified.push(r.value);
    }
  }

  if (!qualified.length) {
    throw new Error("No qualified candidates found");
  }

  /* --------------------------------------------------
     5️⃣ Insert signals atomically
  -------------------------------------------------- */

  /* --------------------------------------------------
   5️⃣ Insert signals atomically (TWO-WAY)
-------------------------------------------------- */

  const expiresAt = new Date(Date.now() + TTL_MINUTES * 60 * 1000);

  await prisma.$transaction(
    qualified.flatMap((q) => [
      // me → them
      prisma.signal.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: userId,
            toUserId: q.user.id,
          },
        },
        update: {
          score: q.score,
          expiresAt,
        },
        create: {
          fromUserId: userId,
          toUserId: q.user.id,
          score: q.score,
          expiresAt,
          source: "PERFECT_MATCH",
        },
      }),

      // them → me
      prisma.signal.upsert({
        where: {
          fromUserId_toUserId: {
            fromUserId: q.user.id,
            toUserId: userId,
          },
        },
        update: {
          score: q.score,
          expiresAt,
        },
        create: {
          fromUserId: q.user.id,
          toUserId: userId,
          score: q.score,
          expiresAt,
          source: "PERFECT_MATCH",
        },
      }),
    ]),
  );

  console.log(
    `Perfect matches for user ${userId}:`,
    qualified.map((q) => q.user.id),
  );
};
const matchInfo = asyncHandler(async (req, res) => {
  const userId = req.user.id;
  const otherUserId = req.params.userId;

  if (!otherUserId) {
    throw new ApiError(400, "Target user ID is required");
  }

  // Check mutual LIKE
  const [a, b] = await prisma.userInteraction.findMany({
    where: {
      OR: [
        { fromUserId: userId, toUserId: otherUserId, state: "LIKED" },
        { fromUserId: otherUserId, toUserId: userId, state: "LIKED" },
      ],
    },
  });

  if (!a || !b) {
    throw new ApiError(403, "Not a mutual match");
  }

  const otherUser = await prisma.user.findUnique({
    where: { id: otherUserId },
    select: {
      rollNumber: true,
    },
  });

  if (!otherUser) {
    throw new ApiError(404, "User not found");
  }
  const privateInfo = {
    rollNumber: otherUser.rollNumber,
  };
  return res.json(
    new ApiResponse(200, { privateInfo }, "Match info fetched successfully"),
  );
});

export {
  submitAnswersAndGenerateProfile,
  homePageContent,
  notificationsPanel,
  findPerfectMatches,
  matchInfo,
};
