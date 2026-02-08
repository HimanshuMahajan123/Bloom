import React, { useEffect, useState } from "react";
import login_balloon from "../assets/login_balloon.png";
import heart_pattern from "../assets/heart_pattern.png";
import { Heart } from "lucide-react";
import { requestMagicLink} from "../api/login";

const Login = () => {
  const [showForm, setShowForm] = useState(false);
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const isValidEmail = (email) => {
    return email.endsWith("@nith.ac.in");
  };

  const handleLogin = async () => {
    if (!email) return;

    if (!isValidEmail(email)) {
      setError("Please use your official NITH email ❤️");
      return;
    }

    try {
      setError("");
      setLoading(true);
      await requestMagicLink(email); // your API call
      setSent(true);
      // success flow handled by backend / navigation
    } catch (err) {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="
        min-h-screen
        relative
        overflow-hidden
        bg-gradient-to-b
       from-[#700912] via-[#c4505a] to-[#dd908c]
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


        

        {/* FORM AREA */}
        <div className="relative mt-10 flex justify-center">

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

          {!sent ?
          (
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
            {/* BALLOON */}
        <div className=" flex justify-center">
          <img
            src={login_balloon}
            alt="Love balloon"
            className="
              w-32
              opacity-90
              drop-shadow-xl
              animate-[float_6s_ease-in-out_infinite]
            "
          />
        </div>
            {/* MOTIVE TEXT */}
            <p className="text-xs font-lora italic text-white/80 px-4 leading-relaxed">
              Where should your spark begin?  
              We’ll only use this to let you know when someone nearby feels the same.
            </p>

            {/* EMAIL INPUT */}
            <input
              type="email"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setError("");
              }}
              placeholder="Your official email"
              className={`
                w-full
                py-3
                px-4
                rounded-xl
                bg-white/90
                text-[#4a2c2a]
                text-center
                font-lora
                text-sm
                outline-none
                shadow-md
                transition
                focus:ring-2
                focus:ring-[#af323f]/40
                 placeholder:italic
                placeholder:text-[#4a2c2a]/60
              `}
            />

            {/* ERROR MESSAGE */}
            {error && (
              <p className="text-xs text-white/90 bg-[#af323f]/60 rounded-lg py-1 px-3">
                {error}
              </p>
            )}

            {/* BUTTON */}
            <button
              onClick={handleLogin}
              disabled={loading || !email}
              className={`
                w-full
                group
                py-3
                rounded-xl
                font-lora
                text-sm
                tracking-wide
                text-white/95
                flex
                items-center
                justify-center
                gap-2
                shadow-[0_10px_30px_rgba(175,50,63,0.35)]
                transition-all
                duration-300
                active:scale-95
                ${
                  loading || !email
                    ? "bg-[#af323f]/40 cursor-not-allowed"
                    : "bg-[#af323f]/90 hover:bg-[#af323f] hover:shadow-[0_14px_40px_rgba(175,50,63,0.45)]"
                }
              `}
            >
              {loading ? (
                <>
                  <span>Sending your spark…</span>
                  <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                </>
              ) : (
                <>
                  <span>Send my spark</span>
                  <Heart size={16} className="rotate-[45deg] group-hover:rotate-0  transition" />
                </>
              )}
            </button>

          </div>
          )
          :  (
  /* SUCCESS STATE */
  <div
    className="
      relative
      z-10
      w-full
      max-w-sm
      flex
      flex-col
      items-center
      gap-4
      text-center
      animate-fade-in
    "
  >
    <div className="w-14 h-14 rounded-full bg-white/90 flex items-center justify-center shadow-lg">
      <Heart className="text-[#af323f]" size={24} />
    </div>

    <p className="font-playfair italic text-lg text-white/95">
      Your spark is on its way
    </p>

    <p className="font-lora text-sm text-white/80 leading-relaxed px-4">
      We’ve sent a little something to <br />
      <span className="font-medium">{email}</span>  
      <br />
      Open your inbox to let it glow ✨
    </p>

    <p className="text-xs font-lora italic text-white/60">
      Didn’t see it? Check your spam folder.
    </p>
  </div>
)}

            
        </div>

      </div>
    </div>
  );
};

export default Login;
