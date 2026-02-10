//@ts-nocheck
import React, { useEffect } from "react";
import { useAuth } from "../contexts/AuthContext";
import multi_heart from "../assets/multi_heart.png";
import red_heart from "../assets/red_heart.png";
import physics_balloon from "../assets/physics_balloon.png";
import { Link, Navigate } from "react-router";
import { ArrowLeft } from "lucide-react";
const MyProfile = () => {
  const { user, logout } = useAuth();

  // Optional: ESC logout (remove if you don't want it)
  useEffect(() => {
    const handler = (e) => {
      if (e.key === "Escape") logout();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [logout]);

  if (!user) return null;

  return (
    <div className="fixed inset-0 z-50 flex  md:items-center bg-linear-to-b from-[#700912] via-[#c4505a] to-[#dd908c] justify-center items-center px-6 py-12 overflow-hidden no-scrollbar">
      {/* Modal */}
            <div className="pointer-events-none absolute inset-0 overflow-hidden z-0">
              {[...Array(150)].map((_, i) => (
                <img
                  key={`h-${i}`}
                  src={red_heart}
                  className="absolute w-6 opacity-50"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animation: `floatUp ${12 + Math.random() * 12}s linear infinite`,
                  }}
                />
              ))}{" "}
              {[...Array(76)].map((_, i) => (
                <img
                  key={`b-${i}`}
                  src={physics_balloon}
                  className="absolute w-16 opacity-40"
                  style={{
                    left: `${Math.random() * 100}%`,
                    animation: `drift ${18 + Math.random() * 18}s linear infinite`,
                  }}
                />
              ))}
            </div>
     <div
  className="
    relative z-10
    max-w-lg w-full
    rounded-3xl
    flex flex-col
    max-h-[85vh]
  "
  style={{
    backgroundImage: `
      radial-gradient(
        ellipse at center,
        rgba(255,248,237,0.85) 0%,
        rgba(255,248,237,0.65) 75%
      ),
      url(${multi_heart})
    `,
    backgroundSize: "cover, 220px",
    backgroundRepeat: "no-repeat, repeat",
  }}
>

        {/* Header */}
       <div className="px-8 py-6 flex justify-between items-center shrink-0">
  <Link to="/app">
    <ArrowLeft />
  </Link>

  <h2 className="text-2xl font-playfair italic font-medium text-[#5b2a2a] truncate">
    {user.username}
  </h2>

  <button onClick={logout} className="px-4 py-2 rounded-full bg-[#ca4343] text-white text-sm hover:bg-[#ec1b1b] outline-none">
    Logout
  </button>
</div>


        {/* Content */}
    <div className="flex-1 overflow-y-auto no-scrollbar px-8 py-4">
  <p className="font-lora text-sm text-[#4a2c2a] whitespace-pre-wrap leading-relaxed italic tracking-wide">
    {user.poem || user.text || "No profile text available."}
  </p>
</div>

      </div>
    </div>
  );
};

export default MyProfile;
