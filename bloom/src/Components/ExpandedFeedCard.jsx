import { X } from "lucide-react";
import multi_heart from "../assets/multi_heart.png";

export default function ExpandedFeedCard({ profile, onClose }) {
  if (!profile) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-6">

      {/* 🔹 Blurred background overlay */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-md"
        onClick={onClose}
      />

      {/* 🔹 Modal card */}
      <div
        className="relative z-10 max-w-lg w-full rounded-3xl px-8 py-6 shadow-2xl animate-scale-in"
        style={{
          backgroundImage: `radial-gradient(
            ellipse at center,
            rgba(255,248,237,0.9),
            rgba(255,248,237,0.75)
          ), url(${multi_heart})`,
          backgroundSize: "cover, 220px",
        }}
      >
        {/* Header */}
        <div className="flex justify-between items-center">
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
        <div className="my-4 h-px bg-[#5b2a2a]/20" />

        {/* Poem / Bio */}
        <p className="font-lora text-sm text-[#4a2c2a] leading-relaxed whitespace-pre-line">
          {profile.poem || "No profile text"}
        </p>
      </div>
    </div>
  );
}
