import React, { useState } from "react";
import { Bell, X, HeartHandshake } from "lucide-react";
import multi_heart from "../assets/multi_heart.png";
import red_heart from "../assets/red_heart.png";
import physics_balloon from "../assets/physics_balloon.png";

/* ---------- helpers ---------- */

const truncateWords = (text, limit = 80) => {
  const words = text.split(" ");
  return words.length <= limit
    ? text
    : words.slice(0, limit).join(" ") + "…";
};

/* ---------- feed card (NO SWIPE) ---------- */

const FeedCard = ({ item, onExpand }) => {
  return (
    <div
      onClick={() => onExpand(item)}
      className="
        paper
        max-w-xl
        w-full
        mt-6
        mb-6
        px-12
        py-8
        rounded-3xl
        shadow-lg
      "
      style={{
        backgroundImage: `
          radial-gradient(
            ellipse at center,
            rgba(255,248,237,0.85) 0%,
            rgba(255,248,237,0.65) 75%,
            rgba(255,248,237,0.35) 100%
          ),
          url(${multi_heart})
        `,
        backgroundSize: "cover, 220px",
        backgroundRepeat: "no-repeat, repeat",
      }}
    >
      <h2 className="text-center text-2xl font-playfair italic text-[#5b2a2a] mb-6">
        {item.username}
      </h2>

      <p className="font-lora italic text-sm text-[#4a2c2a] leading-relaxed">
        {truncateWords(item.text)}
      </p>

      <p className="mt-4 text-center text-xs italic text-[#8c3037]/60">
        Tap to read more
      </p>
    </div>
  );
};

/* ---------- signal card (SWIPE ENABLED) ---------- */

const SignalCard = ({ item, onAccept, onReject, onExpand }) => {
  const [startX, setStartX] = useState(null);
  const [deltaX, setDeltaX] = useState(0);
  const [isSwiping, setIsSwiping] = useState(false);

  const onTouchStart = (e) => setStartX(e.touches[0].clientX);

  const onTouchMove = (e) => {
    if (!startX) return;
    const moveX = e.touches[0].clientX - startX;
    if (Math.abs(moveX) > 10) setIsSwiping(true);
    if (isSwiping) setDeltaX(moveX);
  };

  const onTouchEnd = () => {
    if (deltaX > 90) onAccept(item);
    else if (deltaX < -90) onReject(item);
    else onExpand(item);

    setDeltaX(0);
    setStartX(null);
    setIsSwiping(false);
  };

  return (
    <div
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      className="
        paper
        max-w-xl
        w-full
        mt-6
        mb-6
        px-12
        py-8
        rounded-3xl
        shadow-lg
      "
      style={{
        transform: `translateX(${deltaX}px)`,
        transition: isSwiping ? "none" : "transform 0.25s ease",
        backgroundImage: `
          radial-gradient(
            ellipse at center,
            rgba(255,248,237,0.9) 0%,
            rgba(255,248,237,0.6) 75%,
            rgba(255,248,237,0.35) 100%
          ),
          url(${multi_heart})
        `,
        backgroundSize: "cover, 220px",
        backgroundRepeat: "no-repeat, repeat",
      }}
    >
      <h2 className="text-center text-2xl font-playfair italic text-[#5b2a2a] mb-6">
        {item.username}
      </h2>

      <p className="font-lora italic text-sm text-[#4a2c2a] leading-relaxed">
        {truncateWords(item.text)}
      </p>

      <p className="mt-4 text-center text-xs italic text-[#8c3037]/60">
        Swipe ← / → to respond
      </p>
    </div>
  );
};

/* ---------- dashboard ---------- */

const Dashboard = () => {
  const [expanded, setExpanded] = useState(null);
  const [activeTab, setActiveTab] = useState("feed");

  const feedData = [
    {
      profileID: "p1",
      username: "Someone Nearby",
      text:
        "Late-night walks, soft music, and the comfort of quiet moments. They enjoy being present, observing the world slowly, finding meaning in silence.",
    },
    {
      profileID: "p2",
      username: "A Familiar Presence",
      text:
        "Calm conversations over warm coffee. Someone who values emotional depth and shared routines.",
    },
  ];

  const [signals, setSignals] = useState([
    {
      profileID: "p3",
      username: "A Gentle Spark",
      text:
        "A reassuring presence with thoughtful energy. They listen carefully and leave you feeling lighter.",
    },
  ]);

  const [matches, setMatches] = useState([]);

  const acceptSignal = (item) => {
    setSignals((s) => s.filter((i) => i.profileID !== item.profileID));
    setMatches((m) => [...m, item]);
  };

  const rejectSignal = (item) => {
    setSignals((s) => s.filter((i) => i.profileID !== item.profileID));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#700912] via-[#c4505a] to-[#dd908c] px-6 py-8 relative">
      {/* ambient */}
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        {[...Array(80)].map((_, i) => (
          <img
            key={i}
            src={red_heart}
            className="absolute w-6 opacity-40"
            style={{
              left: `${Math.random() * 100}%`,
              animation: `floatUp ${10 + Math.random() * 14}s linear infinite`,
            }}
          />
        ))}
      </div>

      {/* top bar */}
      <div className="flex justify-between items-center mb-6 relative z-10">
        <div>
          <p className="font-playfair italic text-[#cacaca]">Hello</p>
          <p className="font-lora text-sm text-[#cacaca]/80">
            Your spark is live
          </p>
        </div>

        <button
          onClick={() => setActiveTab("signals")}
          className="p-2 rounded-full bg-white/70"
        >
          <Bell size={18} />
        </button>
      </div>

      {/* tabs */}
      <div className="flex justify-center gap-6 mb-6 relative z-10">
        {["feed", "signals", "matches"].map((t) => (
          <button
            key={t}
            onClick={() => setActiveTab(t)}
            className={`font-playfair italic ${
              activeTab === t
                ? "text-white underline"
                : "text-white/60"
            }`}
          >
            {t === "feed"
              ? "Feed"
              : t === "signals"
              ? "Signals"
              : "Resonance"}
          </button>
        ))}
      </div>

      {/* content */}
      <div className="flex flex-col items-center relative z-10">
        {activeTab === "feed" &&
          feedData.map((i) => (
            <FeedCard key={i.profileID} item={i} onExpand={setExpanded} />
          ))}

        {activeTab === "signals" &&
          signals.map((i) => (
            <SignalCard
              key={i.profileID}
              item={i}
              onAccept={acceptSignal}
              onReject={rejectSignal}
              onExpand={setExpanded}
            />
          ))}

        {activeTab === "matches" &&
          matches.map((i) => (
            <FeedCard key={i.profileID} item={i} onExpand={setExpanded} />
          ))}
      </div>

      {/* expanded */}
      {expanded && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-md"
            onClick={() => setExpanded(null)}
          />
          <div className="relative z-10 max-w-xl w-[92%] paper px-12 py-8 rounded-3xl shadow-2xl">
            <h2 className="text-center text-3xl font-playfair italic text-[#5b2a2a] mb-6">
              {expanded.username}
            </h2>
            <p className="font-lora italic text-sm text-[#4a2c2a] leading-relaxed">
              {expanded.text}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
