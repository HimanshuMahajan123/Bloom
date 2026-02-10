import { X } from "lucide-react";
import multi_heart from "../assets/multi_heart.png";

const BloomGuideCard = ({ open, accepted, setAccepted, onClose, onEnter }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-6">

      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Card */}
      <div
        className="relative z-10 w-full max-w-lg rounded-3xl shadow-2xl
                   max-h-[85vh] flex flex-col overflow-hidden"
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
        }}
      >
        {/*  Scrollable content */}
        <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-6">

          {/* Header */}
          <div className="flex justify-between items-center">
            <h2 className="font-playfair italic text-2xl text-[#5b2a2a]">
              Before you step into Bloom 
            </h2>

         
          </div>

          {/* Divider */}

          {/* Content */}
          <div className="font-lora text-sm text-[#4a2c2a] leading-relaxed space-y-4">
            <p>
              Bloom is a quiet place to discover people who resonate with you.
            </p>

            <p>
              <b> Landing</b><br />
              You’ll arrive at the home page where profiles appear one by one.
            </p>

            <p>
              <b> Navigation</b><br />
              Left button shows your profile.<br />
              Right button opens notifications.
            </p>

            <p>
              <b> Signals</b><br />
              Nearby presence creates signals.<br />
              Rare alignments appear as{" "}
              <span className="text-yellow-600 font-semibold">
                golden signals ✨
              </span>
              .
            </p>

            <p>
              <b> Likes</b><br />
              People who have swiped right on you.
            </p>

            <p>
              <b> Resonance</b><br />
              When both swipe right, resonance forms.<br />
              Only then is the roll number revealed.
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4">

            <label className="flex items-center gap-3 text-sm italic text-[#4a2c2a]">
              <input
                type="checkbox"
                checked={accepted}
                onChange={(e) => setAccepted(e.target.checked)}
                className="accent-[#af323f]"
              />
              I’ve read and understood how Bloom works
            </label>

            <button
              disabled={!accepted}
              onClick={onEnter}
              className={`
                mt-4 w-full py-3 rounded-xl text-white italic transition outline-none
                ${
                  accepted
                    ? "bg-[#af323f] hover:bg-[#992a34]"
                    : "bg-gray-400 cursor-not-allowed"
                }
              `}
            >
              Enter Bloom
            </button>
        </div>
      </div>
    </div>
  );
};

export default BloomGuideCard;
