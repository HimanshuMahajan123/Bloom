import { X } from "lucide-react";
import multi_heart from "../assets/multi_heart.png";

const SwipeCard = ({
  expandedProfile,
  swipeClass,
  isTouch,
  handleTouchStart,
  handleTouchMove,
  handleTouchEnd,
  handleSwipe,
  onClose,
  source,
}) => {
  if (!expandedProfile) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center px-6">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card container (fixed height) */}
      <div
        className={`relative z-10 w-full max-w-lg rounded-3xl shadow-2xl
                    max-h-[85vh] flex flex-col transition-transform duration-300 ${swipeClass}`}
        style={{
          backgroundImage: `
            radial-gradient(
              ellipse at center,
              rgba(255,248,237,0.9),
              rgba(255,248,237,0.7)
            ),
            url(${multi_heart})
          `,
          backgroundSize: "cover, 220px",
          backgroundColor: source === "PROXIMITY" ? "#ffe4e1" : "#fff8ed",
        }}
        onTouchStart={isTouch ? handleTouchStart : undefined}
        onTouchMove={isTouch ? handleTouchMove : undefined}
        onTouchEnd={isTouch ? handleTouchEnd : undefined}
      >
        {/* 🔽 SCROLLABLE CONTENT */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6">

          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="font-playfair italic text-2xl text-[#5b2a2a]">
              {expandedProfile.username}
            </h2>

            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 transition"
            >
              <X />
            </button>
          </div>

          {/* Divider */}
          <div className="my-4 h-px bg-[#5b2a2a]/20" />

          {/* Poem (this can now be LONG) */}
          <p className="font-lora text-sm text-[#4a2c2a] leading-relaxed whitespace-pre-line">
            {expandedProfile.poem || "No profile text"}
          </p>

          {/* Desktop swipe buttons */}
          {!isTouch && (
            <div className="mt-8 flex justify-between items-center">
              <button
                onClick={() => handleSwipe("left")}
                className="h-12 w-12 rounded-full bg-white/80 hover:bg-white shadow flex items-center justify-center text-xl transition"
                title="Not my spark"
              >
                💔
              </button>

              <button
                onClick={() => handleSwipe("right")}
                className="h-12 w-12 rounded-full bg-[#af323f] hover:bg-[#922733] shadow flex items-center justify-center text-xl transition"
                title="Feel the spark"
              >
                ❤️
              </button>
            </div>
          )}

          {/* Touch hint */}
          {isTouch && (
            <div className="mt-6 text-center text-xs italic text-[#5b2a2a]/60">
              Swipe left or right
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SwipeCard;
