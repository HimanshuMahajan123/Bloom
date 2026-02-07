import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/api-error.js";
import { ApiResponse } from "../utils/api-response.js";
import prisma from "../db/prisma.js";
import { Groq } from "groq-sdk";

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

const submitAnswersAndGenerateProfile = asyncHandler(async (req, res) => {
  const { answers } = req.body;
  const userId = req.user.id;
  const rollNumber = req.user.rollNumber;

  if (!Array.isArray(answers) || answers.length !== 10) {
    throw new ApiError(400, "Exactly 10 answers are required");
  }

  for (const ans of answers) {
    if (typeof ans !== "string" || ans.trim().length < 3) {
      throw new ApiError(400, "Invalid answer format");
    }
  }

  const gender = answers[4].toUpperCase();
  if (gender !== "MALE" && gender !== "FEMALE") {
    throw new ApiError(400, "Invalid gender answer");
  }

  const submission = await prisma.onboardingSubmission.upsert({
    where: { userId },
    update: {
      answers,
    },
    create: {
      userId,
      rollNumber,
      answers,
    },
  });

  const prompt = `
    Write a romantic but natural dating profile for a college student using the answers below.

    Rules:
    - 150–200 words
    - warm and heartfelt, not cheesy
    - simple, everyday language
    - no fancy or dramatic metaphors
    - sound human, not AI-generated
    - do not mention questions, quizzes, or prompts
    - output only the final profile text

    Answers:
    ${answers.map((a, i) => `${i + 1}. ${a}`).join("\n")}
    `;
  try {
    const completion = await groq.chat.completions.create({
      model: "llama-3.1-8b-instant",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.9,
    });

    poem =
      completion.choices?.[0]?.message?.content ||
      "A mysterious romantic soul.";
  } catch (err) {
    console.error("Groq error:", err);
    throw new ApiError(502, "Profile generation failed");
  }

  const [username, avatar] = await prisma.$transaction(async (tx) => {
    const usernames = await tx.usernamePool.findMany({
      where: {
        gender: gender,
        taken: false,
      },
    });

    if (!usernames.length) throw new Error("No usernames left");

    const chosen = usernames[Math.floor(Math.random() * usernames.length)];

    await tx.usernamePool.update({
      where: { id: chosen.id },
      data: {
        taken: true,
        userId: userId,
      },
    });

    const avatars = await tx.avatarPool.findMany({
      where: {
        gender: gender,
        taken: false,
      },
    });

    if (!avatars.length) throw new Error("No avatars left");

    const chosenAvatar = avatars[Math.floor(Math.random() * avatars.length)];

    await tx.avatarPool.update({
      where: { id: chosenAvatar.id },
      data: {
        taken: true,
        userId: userId,
      },
    });

    return [chosen, chosenAvatar];
  });

  await prisma.user.update({
    where: { id: userId },
    data: {
      gender: gender,
      username: username.name,
      avatar: avatar.url,
      poem: poem,
    },
  });

  return res.status(200).json(
    new ApiResponse(200, "Profile generated successfully", {
      poem,
      submissionId: submission.id,
      username: username.name,
      avatar: avatar.url,
    }),
  );
});

export { submitAnswersAndGenerateProfile };
