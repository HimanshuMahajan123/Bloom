import { X } from "lucide-react";
import multi_heart from "../assets/multi_heart.png";

export default function ExpandedFeedCard({ profile, onClose }) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden">
      
      {/* 🔹 Blurred background overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* 🔹 Centered container */}
      <div className="relative h-full flex items-center justify-center px-4">
        
        {/* 🔹 Modal card */}
        <div
          className="
            relative z-10
            w-full max-w-lg
            bg-white/95
            rounded-3xl shadow-2xl
            flex flex-col
            max-h-[85vh]
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
          {/* 🔒 Header (fixed) */}
          <div className="px-6 py-4 flex justify-between items-center shrink-0">
            <h2 className="font-playfair italic text-2xl text-[#5b2a2a]">
              {profile.username}
            </h2>
            <button
              onClick={onClose}
              className="p-2 rounded-full hover:bg-black/5 transition"
            >
              <X />
            </button>
          </div>

          {/* Divider */}
          <div className="h-px bg-[#5b2a2a]/20 mx-6" />

          {/* 🔥 SCROLLABLE CONTENT */}
          <div className="flex-1 overflow-y-auto px-6 py-4">
            <p className="font-lora text-sm text-[#4a2c2a] leading-relaxed whitespace-pre-line">
              {profile.poem || "No profile text"}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
