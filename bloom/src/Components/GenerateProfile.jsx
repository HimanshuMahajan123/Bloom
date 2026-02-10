import React, { useState } from "react";
import scroll_bg from "../assets/paper_g.png";
import multi_heart from "../assets/multi_heart.png";
import { NavLink } from "react-router-dom";
import { generateProfile } from "../api/generate";
import BloomGuideCard from "./BloomGuideCard";
const WhisperInput = ({ value, onChange, placeholder }) => {
  return (
    <div className="relative">
      {/* parchment glow */}
      <div className="absolute inset-0 rounded-2xl bg-[#af323f]/10 blur-lg" />

      <textarea
        rows={1}
        value={value}
        placeholder={placeholder}
        onChange={(e) => onChange(e.target.value)}
        onInput={(e) => {
          e.target.style.height = "auto";
          e.target.style.height = e.target.scrollHeight + "px";
        }}
        className="
          relative
          w-full
          resize-none
          px-6 py-4
          rounded-2xl
          bg-white/95
          font-lora
          text-sm
          text-[#4a2c2a]
          text-center
          placeholder:italic
          placeholder:text-center
          outline-none
          shadow-lg
          transition-all
          duration-300
          focus:ring-2
          focus:ring-[#af323f]/40
        "
      />
    </div>
  );
};

const questions = [
  {
    id: "1",
    question: "What makes you feel most alive these days?",
    placeholder: "Late-night study sessions, music, long walks…",
  },
  {
    id: "2",
    question:
      "If you had a free evening with no responsibilities, how would you spend it?",
    placeholder: "Quiet night in, friends, creating something…",
  },
  {
    id: "3",
    question: "What small thing can instantly brighten your day?",
    placeholder: "A message, a song, coffee, laughter…",
  },
  {
    id: "4",
    question:
      "Which three words would your closest friend use to describe you?",
    placeholder: "And why one of them fits you",
  },
  {
    id: "5",
    question: "Select your gender to help us find the right matches for you",
    placeholder: "Male",
  },
  {
    id: "6",
    question:
      "What are you secretly hoping college gives you before graduation?",
    placeholder: "Confidence, love, clarity, memories…",
  },
  {
    id: "7",
    question: "What do you value most in relationships?",
    placeholder: "Trust, friendship, loyalty, fun…",
  },
  {
    id: "8",
    question: "How do you usually show care or affection?",
    placeholder: "Words, time, gestures, presence…",
  },
  {
    id: "9",
    question: "What kind of person naturally catches your attention?",
    placeholder: "Calm, curious, expressive, thoughtful…",
  },
  {
    id: "10",
    question:
      "If someone wrote a short poem about you after meeting once, what would its mood be?",
    placeholder: "Playful, calm, mysterious, dreamy…",
  },
];

const GenerateProfile = () => {
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState(Array(questions.length).fill(""));
  const [revealed, setRevealed] = useState(false);
  const [username, setUsername] = useState("Gestalt");
  const [poem, setPoem] = useState(
    "Roses are red, violets are blue, I'm not great at poems, but hey, nice to meet you.",
  );
  const [showGuide , setShowGuide] = useState(false) ; 
  const [accepted , setAccepted] = useState(false)
  const [avatarUrl, setAvatarUrl] = useState("");
  const [showPrivacy, setShowPrivacy] = useState(true);
  const current = questions[step];

  const handleAnswer = (value) => {
    const updated = [...answers];
    updated[step] = value;
    setAnswers(updated);
  };

  const handleNext = async () => {
    if (!answers[step]) return;

    if (step === questions.length - 1) {
      try {
        const payload = {
          answers: answers.map((a, i = 0) => ({ id: i + 1, answer: a })),
        };

        const data = await generateProfile(payload);
        console.log("Profile generated:", data);
        setUsername(data.username);
        setPoem(data.poem);
        setAvatarUrl(data.avatarUrl);
        setRevealed(true);
        setShowPrivacy(false);
      } catch (err) {
                console.error("Error generating profile:", err);
        alert("Something went wrong. Please try again.");
      }
    } else {
      setStep(step + 1);
    }
  };

  return (
    <div
      className="min-h-screen  bg-gradient-to-b
       from-[#700912] via-[#c4505a] to-[#dd908c] flex items-center justify-center px-6"
    >
      {!revealed ? (
        /* QUESTION FLOW */
        <div className="max-w-md w-full text-center transition-all duration-700">
          <p className="text-sm font-lora italic text-[#5b2a2a]/70 mb-4">
            {step + 1} of {questions.length}
          </p>

          <h2 className="text-2xl font-playfair text-[#5b2a2a] mb-6">
            {current.question}
          </h2>

          {current.id === "5" ? (
            <div className="flex gap-4 justify-center">
              {["Male", "Female"].map((g) => (
                <button
                  key={g}
                  onClick={() => handleAnswer(g)}
                  className={`px-5 py-2 rounded-full outline-none ${
                    answers[step] === g ? "bg-[#af323f] text-white" : "bg-white"
                  }`}
                >
                  {g}
                </button>
              ))}
            </div>
          ) : (
            <WhisperInput
              placeholder={current.placeholder}
              value={answers[step]}
              onChange={(val) => handleAnswer(val)}
            />
          )}

          <button
            onClick={handleNext}
            className="
              mt-6
              px-8 py-3
              rounded-full
              bg-[#af323f]/90
              text-white
              font-lora
              shadow-lg
              hover:bg-[#af323f]
              transition
              active:scale-95
              outline-none
            "
          >
            {step === questions.length - 1
              ? "Unfold my profile ✨"
              : "Continue"}
          </button>
{/* Privacy reassurance */}
{showPrivacy && (
  <p className="mt-4 mb-2 text-xs font-lora italic text-[#5b2a2a]/60">
  Your answers aren’t saved as readable text — they’re used only to shape the feeling of your profile.
</p>
)
}



        </div>
      ) : (
        <div className="fixed inset-0 z-[100] overflow-hidden">
          {/* 🔹 Blurred background */}
          <div className="absolute inset-0 bg-black/40 backdrop-blur-md" />

          {/* 🔹 Centering wrapper */}
          <div className="relative h-full flex items-center justify-center px-4">
            {/* 🔹 Scroll container */}
            <div
              className="
          relative z-10
          w-full max-w-lg
          max-h-[85vh]
          rounded-3xl
          shadow-2xl
          flex flex-col
          overflow-hidden
          animate-[unfurl_1.2s_ease-out]
        "
              style={{
                backgroundImage: `
            radial-gradient(
              ellipse at center,
              rgba(255,248,237,0.9),
              rgba(255,248,237,0.75)
            ),
            url(${multi_heart})
          `,
                backgroundSize: "cover, 220px",
              }}
            >
              {/* Header */}
              <div className="px-8 py-6 shrink-0 text-center">
                <h2 className="text-3xl font-playfair italic text-[#5b2a2a]">
                  {username}
                </h2>
              </div>

              <div className="h-px bg-[#5b2a2a]/20 mx-8" />

              {/* 🔥 Scrollable poem */}
              <div className="flex-1 overflow-y-auto px-10 py-6">
                <p className="font-lora italic text-[#4a2c2a] leading-[1.9] tracking-wide whitespace-pre-line text-center">
                  {poem}
                </p>

                <p className="mt-8 text-center italic text-[#8c3037]">
                  ✨ This is how your presence feels ✨
                </p>
              </div>

              {/* CTA */}
              <div className="px-6 py-4 shrink-0 flex justify-center">
                <button
  onClick={() => setShowGuide(true)}
  className="
    text-sm
    py-3 px-6
    bg-[#b93d49]
    text-white
    rounded-xl
    font-lora italic
    hover:bg-[#a8323d]
    outline-none
  "
>
  Explore your matches
</button>

              </div>
            </div>
          </div>
        </div>
      )}
  <BloomGuideCard
  open={showGuide}
  accepted={accepted}
  setAccepted={setAccepted}
  onClose={() => setShowGuide(false)}
  onEnter={() => {
    setShowGuide(false);
    window.location.href = "/app";
  }}
/>


    </div>
  );
};

export default GenerateProfile;
