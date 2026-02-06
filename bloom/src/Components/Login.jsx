import React, { useEffect, useState } from "react";
import login_balloon from "../assets/login_balloon.png";
import heart_pattern from "../assets/heart_pattern.png";
import {Heart} from "lucide-react"
const Login = () => {
  const [showForm, setShowForm] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 300);
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      className="
        min-h-screen
        relative
        overflow-hidden
        bg-gradient-to-b
        from-[#923b42]
        via-[#e8afa8]
        to-[#d38f8c]
        flex
        flex-col
        items-center
        justify-center
        px-6
      "
    >
      {/* CONTENT */}
      <div className="relative z-10 max-w-md w-full text-center">

        {/* TITLE */}
        <h1 className="pt-8 text-3xl md:text-4xl font-playfair italic text-white/95 drop-shadow-md">
          Love, delivered by air
        </h1>

        <p className="mt-3 text-sm font-lora italic text-white/80">
          Some connections don’t need words.
        </p>

      {/* BALLOON */}
<div className="mt-10 flex justify-center">
  <img
    src={login_balloon}
    alt="Love balloon"
    className="
      w-32 md:w-32
      opacity-90
      drop-shadow-xl
      animate-[float_6s_ease-in-out_infinite]
    "
  />
</div>


        {/* HEART + FORM */}
        <div className="relative mt-8 flex justify-center">

          {/* HEART BACKDROP */}
          <div
            className="absolute inset-0 flex justify-center items-center pointer-events-none"
            style={{
              backgroundImage: `url(${heart_pattern})`,
              backgroundRepeat: "no-repeat",
              backgroundPosition: "center",
              backgroundSize: "220px",
              opacity: 0.12,
            }}
          />

          {/* FORM */}
          <div
            className={`
              relative
              z-10
              w-full
              max-w-sm
              flex
              flex-col
              gap-4
              transition-all
              duration-700
              ease-out
              ${showForm ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}
            `}
          >
            {/* MOTIVE TEXT */}
            <p className="text-xs font-lora italic text-white/80 px-4 leading-relaxed">
              Where should your spark begin?  
              We’ll only use this to let you know when someone nearby feels the same.
            </p>
<input
  type="email"
  placeholder="Your official email"
  className="
    w-full
    py-3
    px-4
    rounded-xl
    bg-white/90
    text-[#4a2c2a]
    font-lora
    text-sm
    text-center
    placeholder:text-[#4a2c2a]/60
    placeholder:italic
    outline-none
    focus:ring-2
    focus:ring-[#af323f]/40
    shadow-md
    transition
  "
/>


            <button
              className="
                w-full
                py-3
                rounded-xl
                bg-[#af323f]/90
                text-white/95
                font-lora
                text-sm
                tracking-wide
                shadow-[0_10px_30px_rgba(175,50,63,0.35)]
                hover:bg-[#af323f]
                hover:shadow-[0_14px_40px_rgba(175,50,63,0.45)]
                transition-all
                duration-300
                active:scale-95
              "
            >
               <div className=" group flex items-center justify-center gap-2">
  <span>Send my spark</span>
<Heart size={16} className="group-hover:rotate-0 rotate-[45deg] transition" />
</div>

            </button>
          </div>
        </div>
                
      </div>
    </div>
  );
};

export default Login;
