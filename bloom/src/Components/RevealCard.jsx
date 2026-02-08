import { useState } from "react";
import { X } from "lucide-react";
import api from "../api/api";
import multi_heart from "../assets/multi_heart.png";
import login_balloon from "../assets/login_balloon.png";

const RevealCard = ({ expandedProfile, onClose }) => {
  const [revealing, setRevealing] = useState(false);
  const [revealed, setRevealed] = useState(false);
  const [privateInfo, setPrivateInfo] = useState(null);

  if (!expandedProfile) return null;

  const handleReveal = async () => {
    if (revealing || revealed) return;

    setRevealing(true);

    try {
      const res = await api.get(
        `/profile/match-info/${expandedProfile.id}`
      );

      setPrivateInfo(res.data?.data?.matches);
    } catch (err) {
      console.error("Reveal failed", err);
    }

    // allow animation to complete
    setTimeout(() => {
      setRevealed(true);
      setRevealing(false);
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">
      
      {/* Blurred background */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative z-10 max-w-lg w-full rounded-3xl px-8 py-6 shadow-2xl"
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
        <div className="flex justify-between items-center">
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

        {/* Divider */}
        <div className="my-4 h-px bg-[#5b2a2a]/20" />

        {/* Poem */}
        <p className="font-lora text-sm text-[#4a2c2a] leading-relaxed">
          {expandedProfile.poem}
        </p>

        {/* 🎈 Balloon Reveal */}
        {!revealed && (
          <div className="mt-8 flex justify-center">
            <button
              onClick={handleReveal}
              className={`relative transition-transform duration-[1200ms] ease-in-out
                ${revealing ? "-translate-y-40 opacity-0" : ""}
              `}
            >
              <img
                src={login_balloon}
                alt="Reveal"
                className="h-32 select-none"
              />
              <div className="absolute inset-0 flex items-center justify-center text-xs italic text-white">
                Tap to reveal
              </div>
            </button>
          </div>
        )}

        {/* 🔓 Revealed Info */}
        {revealed && privateInfo && (
          <div className="mt-8 space-y-2 text-center animate-fade-in">
            <div className="text-sm font-semibold text-[#5b2a2a]">
              Roll No
            </div>
            <div className="text-sm text-[#4a2c2a]">
              {privateInfo.rollNumber}
            </div>

            <div className="mt-3 text-sm font-semibold text-[#5b2a2a]">
              Email
            </div>
            <div className="text-sm text-[#4a2c2a]">
              {privateInfo.email}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default RevealCard;
