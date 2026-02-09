import { useState } from "react";
import { X } from "lucide-react";
import api from "../api/api";
import multi_heart from "../assets/multi_heart.png";
import login_balloon from "../assets/login_balloon.png";

const RevealCard = ({ expandedProfile, onClose }) => {
  const [phase, setPhase] = useState("idle");
  const [privateInfo, setPrivateInfo] = useState(null);

  if (!expandedProfile) return null;

  const handleReveal = async () => {
    if (phase !== "idle") return;

    setPhase("lifting");

    try {
      const res = await api.get(`/profile/match-info/${expandedProfile.id}`);
      setPrivateInfo(res.data?.data.privateInfo);
    } catch (err) {
      console.error("Reveal failed", err);
    }

    setTimeout(() => setPhase("impact"), 1400);
    setTimeout(() => setPhase("revealed"), 1900);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-lg rounded-3xl shadow-2xl
                   max-h-[85vh] flex flex-col"
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
        <div className="flex justify-between items-center pt-6 px-8">
          <h2 className="font-playfair italic text-2xl text-[#5b2a2a]">
            {expandedProfile.username}
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-black/5"
          >
            <X />
          </button>
        </div>
        <div className="my-4 h-px bg-[#5b2a2a]/20" />
        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-6 relative">
          {/* Poem */}
          <p className="font-lora text-sm text-[#4a2c2a] leading-relaxed">
            {expandedProfile.poem}
          </p>

          {/* 🎈 Reveal sequence */}
          {phase !== "revealed" && (
            <div className="mt-12 flex flex-col items-center gap-4 relative">
              <div className="text-xs uppercase tracking-widest font-semibold opacity-80">
                {phase === "idle" && "Tap to reveal"}
                {phase === "lifting" && "Revealing…"}
                {phase === "impact" && "Almost there"}
              </div>

              <button
                onClick={handleReveal}
                disabled={phase !== "idle"}
                className={`
                  relative transition-transform duration-[1400ms] ease-in-out
                  ${phase === "lifting" ? "-translate-y-56 scale-110" : ""}
                  ${phase === "impact" ? "scale-150 opacity-0" : ""}
                `}
              >
                <img
                  src={login_balloon}
                  alt="Reveal"
                  className="h-36 select-none pointer-events-none"
                />
              </button>
            </div>
          )}

          {/* 🔓 Final reveal */}
          {phase === "revealed" && privateInfo && (
            <div className="mt-8 text-center space-y-2 animate-fade-in">
              <div className="text-xs tracking-widest uppercase opacity-70">
                Connection Unlocked
              </div>

              <div className="text-lg font-semibold">
                {(privateInfo.rollNumber || "DUMMY").toUpperCase()}
              </div>

              <div className="mt-4 text-xs italic opacity-60">
                This moment only happens once ✨
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RevealCard;
