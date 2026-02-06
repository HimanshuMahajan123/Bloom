import React, { useState } from "react";
import { Bell, X } from "lucide-react";
import multi_heart from "../assets/multi_heart.png";
import red_heart from "../assets/red_heart.png";
import physics_balloon from "../assets/physics_balloon.png";
/* ---------------- FEED CARD ---------------- */

const FeedCard = ({ username, avatar, profileID, text }) => {
  return (
    <div
      className="
        paper
        max-w-xl
        w-full
        mt-6
        min-h-98
        mb-6
        px-12
        py-8
        relative
        rounded-3xl
        shadow-lg
      "
      style={{
        backgroundImage: `
          radial-gradient(
            ellipse at center,
            rgba(255,248,237,0.85) 0%,
            rgba(255,248,237,0.75) 55%,
            rgba(255,248,237,0.55) 75%,
            rgba(255,248,237,0.35) 100%
          ),
          linear-gradient(
            to bottom,
            rgba(255,248,237,0.65),
            rgba(243,227,205,0.65)
          ),
          url(${multi_heart})
        `,
        backgroundSize: "cover, cover, 220px",
        backgroundPosition: "center, center, center",
        backgroundRepeat: "no-repeat, no-repeat, repeat",
      }}
    >
      {/* USERNAME */}
      <h2 className="text-center text-2xl font-playfair italic text-[#5b2a2a] mb-6">
        {username}
      </h2>

      {/* TEXT */}
      <p
        className="font-lora italic text-sm text-[#4a2c2a] leading-relaxed"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(140,48,55,0.35) 60%, rgba(140,48,55,0.12) 75%, rgba(140,48,55,0.35) 90%)",
          backgroundPosition: "0 95%",
          backgroundSize: "100% 1px",
          backgroundRepeat: "no-repeat",
          paddingBottom: "2px",
        }}
      >
        {text}
      </p>
    </div>
  );
};

/* ---------------- DASHBOARD ---------------- */

const Dashboard = () => {
  const [showNotifications, setShowNotifications] = useState(false);

  /* -------- DUMMY DATA -------- */

  const feedData = [
    {
      profileID: "p1",
      username: "Someone Nearby",
      avatar: "A",
      text: "Late-night walks, soft music, and the comfort of quiet moments.",
    },
    {
      profileID: "p2",
      username: "A Familiar Presence",
      avatar: "M",
      text: "You share a love for calm conversations and warm coffee.",
    },
    {
      profileID: "p3",
      username: "A Gentle Spark",
      avatar: "S",
      text: "There’s a presence around you that feels reassuring and kind.",
    },
  ];

  const notifications = [
    "A spark passed near you a few minutes ago 🌸",
    "Someone with a familiar vibe is nearby",
    "Your presence resonated with someone today",
  ];

  return (
    <div
      className="
        min-h-screen
         bg-gradient-to-b
        from-[#700912]
        from-[1%]
        via-[#c4505a]
        from-[5%]      
        to-[#dd908c]
        px-6
        py-8
        relative
      "
    >

{/* 🌸 AMBIENT FLOATING LAYER (FLOODED) */}
<div className="pointer-events-none absolute inset-0 overflow-hidden z-0">

  {/* ❤️ HEARTS */}
  {[...Array(200)].map((_, i) => {
    const size = 24 + (i % 4) * 4; // 6–18px
    return (
      <img
        key={`heart-${i}`}
        src={red_heart}
        alt=""
        className="absolute opacity-60"
        style={{
          width: `${size}px`,
          left: `${Math.random() * 100}%`,
          animation: `floatUp ${14 + Math.random() * 14}s linear infinite`,
        //   animationDelay: `${Math.random() * 10}s`,
          filter:
            i % 3 === 0
              ? "hue-rotate(-15deg) saturate(130%)"
              : i % 3 === 1
              ? "hue-rotate(10deg) brightness(1.1)"
              : "sepia(20%) saturate(120%)",
        }}
      />
    );
  })}

  {/* 🎈 BALLOONS */}
  {[...Array(120)].map((_, i) => {
    const size = 48 + (i % 5) * 18; // 48–108px
    return (
      <img
        key={`balloon-${i}`}
        src={physics_balloon}
        alt=""
        className="absolute opacity-50"
        style={{
          width: `${size}px`,
          left: `${Math.random() * 100}%`,
          animation: `drift ${20 + Math.random() * 18}s linear infinite`,
        //   animationDelay: `${Math.random() * 12}s`,
          filter:
            i % 2 === 0
              ? "sepia(25%) saturate(140%)"
              : "hue-rotate(330deg) brightness(1.05)",
        }}
      />
    );
  })}
</div>


      {/* TOP BAR */}
      <div className="flex items-center justify-around mb-8">
        {/* AVATAR */}
        <div className="flex items-center gap-3">
          <div
            className="
              w-12
              h-12
              rounded-full
              bg-[#af323f]/90
              flex
              items-center
              justify-center
              text-white
              font-playfair
              italic
              shadow-lg
            "
          >
            A
          </div>

          <div>
            <p className="font-playfair italic text-[#cacaca]">
              Hello,
            </p>
            <p className="font-lora text-sm text-[#cacaca]/80">
              Your spark is live
            </p>
          </div>
        </div>

        {/* NOTIFICATION BUTTON */}
        <button
          onClick={() => setShowNotifications(true)}
          className="
            relative
            p-2
            rounded-full
            bg-white/70
            backdrop-blur
            shadow
            hover:bg-white/90
            transition
          "
        >
          <Bell size={18} className="text-[#5b2a2a]" />
          <span className="absolute top-1 right-1 w-2 h-2 bg-[#af323f] rounded-full" />
        </button>
      </div>

      

      {/* FEED */}
      <div className="space-y-5 flex flex-col items-center">
        {feedData.map((item) => (
          <FeedCard
            key={item.profileID}
            username={item.username}
            avatar={item.avatar}
            profileID={item.profileID}
            text={item.text}
          />
        ))}
      </div>

      {/* ---------------- NOTIFICATION PANEL ---------------- */}

      {showNotifications && (
        <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/20 backdrop-blur-sm">
          <div
            className="
              mt-6
              w-[92%]
              max-w-md
              bg-white/90
              rounded-3xl
              px-6
              py-6
              shadow-2xl
              animate-[unfurl_0.6s_ease-out]
            "
          >
            {/* HEADER */}
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-playfair italic text-[#5b2a2a] text-lg">
                Notifications
              </h3>
              <button onClick={() => setShowNotifications(false)}>
                <X size={18} className="text-[#5b2a2a]" />
              </button>
            </div>

            {/* LIST */}
            <div className="space-y-3">
              {notifications.map((note, idx) => (
                <div
                  key={idx}
                  className="
                    px-4
                    py-3
                    rounded-xl
                    bg-[#f9ebe6]
                    font-lora
                    text-sm
                    italic
                    text-[#4a2c2a]
                    shadow
                  "
                >
                  {note}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
