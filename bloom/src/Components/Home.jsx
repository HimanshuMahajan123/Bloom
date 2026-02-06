import React from "react";
import heart from "../assets/heart.svg";
import whisper_envelope from "../assets/whisper_envelope.png";
import flight_envelope from "../assets/flight_envelope.png";
import unfolding_flowers from "../assets/unfolding_flowers.png";
import hero_heart from "../assets/hero_heart.png";
const Divider = ()=>{
    return (
        <div className="relative mt-24">
          <div className="h-20 w-[120%] translate-x-[-8%] border-b-[#d38f8c] border-b-2 rounded-b-[100%]  bg-transparent/70 relative">
            <img
              src={heart}
              alt="heart"
              className="
                w-8 h-8
                absolute -bottom-4 left-1/2 -translate-x-1/2
                bg-[#d38f8c]
                p-1.5
                rounded-full
                shadow-md
              "
            />
          </div>
        </div>)
}
const Home = () => {
  return (
    <div
      className="
        min-h-screen
        relative
        overflow-hidden
        bg-gradient-to-b
        from-[##923b42]
        via-[#e8afa8]
        to-[#d38f8c]
        text-[#4a2c2a]
      "
    >
      {/* AMBIENT GLOWS */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute top-[15%] left-[10%] w-72 h-72 bg-pink-300/30 blur-[120px]" />
        <div className="absolute top-[45%] right-[10%] w-80 h-80 bg-rose-300/30 blur-[140px]" />
        <div className="absolute bottom-[10%] left-[20%] w-72 h-72 bg-red-300/20 blur-[160px]" />
      </div>

      {/* CONTENT */}
      <div className="relative z-10">
            {/* HERO */}
<div className="relative px-6 pt-24 pb-18 overflow-hidden">

  {/* SOFT HEART BACKDROP */}
  <img
    src={hero_heart}
    alt="Hero Heart"
    className="
      absolute
      top-24
      left-1/3
      -translate-x-1/2
      w-40 md:w-48
      opacity-20
      blur-[2px]
      pointer-events-none
    "
  />

  {/* TEXT CONTENT */}
  <div className="relative text-center">
    <h1
      className="
        text-5xl md:text-6xl
        italic
        font-semibold
        tracking-wide
        font-playfair
        text-white/95
        drop-shadow-[0_6px_18px_rgba(255,255,255,0.35)]
      "
    >
      Bloom
    </h1>

    <p
      className="
        mt-3
        text-sm md:text-base
        max-w-sm mx-auto
        font-lora italic
        text-white/80
        leading-relaxed
      "
    >
      Someone around you might be feeling the same.
    </p>
  </div>

</div>


     

        {/* WHISPER */}
        <div className="mt-18 px-8 md:px-16">
          <div className="flex flex-row items-center justify-between gap-12">
            <div className="max-w-sm">
              <h2
                className="text-2xl mb-1 font-playfair text-[#8c3037]/90 "
              
              >
                The Whisper
              </h2>
              <p
                className="opacity-85 leading-relaxed font-lora italic pl-2"
              >
                You arrive quietly.  
                Your presence is felt, not announced.
              </p>
            </div>

            <img
              src={whisper_envelope}
              alt="Whisper"
              className="w-28 md:w-28 -rotate-12 opacity-90 drop-shadow-xl"
            />
          </div>
        <Divider />
        </div>

        {/* FLIGHT */}
        <div className="mt-24 px-8 md:px-16 text-[#8c3037]/90">
          <div className="flex flex-row items-center justify-between gap-12">
            <div className="max-w-sm text-center md:text-left">
              <h2
                className="text-2xl mb-1 font-playfair translate-x-[-20%]  text-[#8c3037]/90 px-2 whitespace-nowrap overflow-hidden ellipsis"
              
              >
                The Flight
              </h2>
              <p
                className="leading-relaxed opacity-90 font-lora italic"
              >
                When the vibe is right, the heart takes flight.
              </p>

              <p
                className="mt-4 text-xs opacity-75 font-lora italic"
              >
                Radar works only while the app is open.
              </p>
            </div>

            <img
              src={flight_envelope}
              alt="Flight"
              className="w-36 md:w-36 rotate-12 opacity-95 drop-shadow-2xl translate-x-[-20%]"
            />
          </div>
             {/* HEART CURVE (SOFT TRANSITION, NOT A DIVIDER) */}
        <div className="relative mt-24">
          <div className="h-20 w-[120%] translate-x-[-8%] border-b-[#d38f8c] border-b-2 rounded-b-[100%]  bg-transparent/70 relative">
            <img
              src={heart}
              alt="heart"
              className="
                w-8 h-8
                absolute -bottom-4 left-1/2 -translate-x-1/2
                bg-[#d38f8c]
                p-1.5
                rounded-full
                shadow-md
              "
            />
          </div>
        </div>
        </div>

        {/* UNFOLDING */}
        <div className="mt-24 mb-32 px-8 md:px-16">
          <div className="flex flex-row items-center justify-between gap-12">
            <img
              src={unfolding_flowers}
              alt="Unfolding"
              className="w-48 md:w-48 -rotate-6  drop-shadow-xl"
            />

            <div className="max-w-sm">
              <h2
                className="text-2xl mb-3 font-playfair translate-x-[-50%] text-[#8c3037]/90 whitespace-nowrap overflow-hidden ellipsis" 
              >
                The Unfolding
              </h2>
              <p
                className="opacity-85 leading-relaxed font-lora italic translate-x-[-50%] px-2"
              >
                When paths cross, stories begin.
              </p>
            </div>
          </div>
        </div>

      </div>
     {/* FLOATING CTA */}
<div className="fixed bottom-6 right-6 z-50">
  <button
    className="
      group
      relative
      px-6 py-3
      rounded-xl
      font-lora
      text-sm
      tracking-wide
      text-white/95
      bg-[#af323f]/90
      backdrop-blur-md
      shadow-[0_10px_30px_rgba(175,50,63,0.35)]
      hover:bg-[#af323f]
      hover:shadow-[0_14px_40px_rgba(175,50,63,0.45)]
      transition-all
      duration-300
      active:scale-95
    "
  >
    Spark ✨
  </button>
</div>

    </div>
  );
};

export default Home;
