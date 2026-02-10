import React, { useEffect, useState } from "react";
import login_balloon from "../assets/login_balloon.png";
import heart_pattern from "../assets/heart_pattern.png";
import { Heart } from "lucide-react";

const Login = () => {
  const [showForm, setShowForm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  // Show form animation
  useEffect(() => {
    const timer = setTimeout(() => setShowForm(true), 300);
    return () => clearTimeout(timer);
  }, []);

  const handleGoogleLogin = async () => {
    try {
      setError("");
      setLoading(true);
      window.location.href = `${import.meta.env.VITE_API_BASE_URL}/auth/google`;
    } catch (err) {
      console.log(err);
      setError("Something went wrong. Please try again.");
      setLoading(false);
    }
  };

  // Handle OAuth errors from backend
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const errorCode = params.get("error");

    if (errorCode) {
      handleOAuthError(errorCode);

      const cleanUrl = window.location.origin + window.location.pathname;
      window.history.replaceState({}, "", cleanUrl);
    }
  }, []);

  const handleOAuthError = (code) => {
    switch (code) {
      case "invalid_college_email":
        setError(
          "Please use your NITH college email (e.g., 25abc000@nith.ac.in).",
        );
        break;

      case "invalid_roll_format":
        setError("Your roll number format seems incorrect.");
        break;

      case "no_google_email":
        setError("Google account has no email associated.");
        break;

      case "auth_failed":
      default:
        setError("Google login failed. Please try again.");
        break;
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

          {!sent ? (
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
                ${
                  showForm
                    ? "opacity-100 translate-y-0"
                    : "opacity-0 translate-y-6"
                }
              `}
            >
              {/* BALLOON + GLASS PANEL */}
              <div className=" flex justify-center">
                <div className="relative flex justify-center items-center min-h-[220px] mb-4">
                  {/* BALLOON */}
                  <img
                    src={login_balloon}
                    alt="Love balloon"
                    className="
                      absolute
                      z-0
                      w-36
                      opacity-80
                      drop-shadow-xl
                      animate-[float_6s_ease-in-out_infinite]
                    "
                  />

                  {/* GLASS PANEL */}
                  <div className="relative z-20 mx-auto w-full max-w-sm px-3">
                    <div
                      className="
                        bg-white/1
                        rounded-3xl
                        p-5
                        sm:p-6
                        shadow-xl
                        text-center
                      "
                    >
                      <h3 className="font-playfair italic text-white text-lg sm:text-xl mb-3">
                        How Bloom Works ✨
                      </h3>

                      <ul className="space-y-2 mb-4">
                        <li className="text-xs sm:text-sm font-lora italic text-white/90">
                          Sign in with your NITH Google account
                        </li>
                        <li className="text-xs sm:text-sm font-lora italic text-white/90">
                          Answer a few gentle questions about yourself
                        </li>
                        <li className="text-xs sm:text-sm font-lora italic text-white/90">
                          Discover signals waiting nearby 💞
                        </li>
                      </ul>

                      <p className="text-xs sm:text-sm font-lora italic text-white/90 leading-relaxed">
                        We quietly look for people around you whose answers feel
                        close to yours. When someone appears, you can swipe
                        right to show interest — or left to drift past.
                        <br />
                        <br />
                        If both hearts move the same way…
                        <span className="font-semibold">
                          {" "}
                          that's resonance.
                        </span>{" "}
                        💫
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* MOTIVE */}
              <p className="text-xs font-lora italic text-white/80 px-4 leading-relaxed">
                Where should your spark begin? We'll only use this to let you
                know when someone nearby feels the same.
              </p>

              {/* ERROR MESSAGE */}
              {error && (
                <p className="text-xs text-white/90 bg-[#af323f]/60 rounded-lg py-1 px-3">
                  {error}
                </p>
              )}

              {/* GOOGLE BUTTON */}
              <button
                onClick={handleGoogleLogin}
                disabled={loading}
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
                  outline-none
                  active:scale-95
                  ${
                    loading
                      ? "bg-[#af323f]/40 cursor-not-allowed"
                      : "bg-[#af323f]/90 hover:bg-[#af323f] hover:shadow-[0_14px_40px_rgba(175,50,63,0.45)]"
                  }
                `}
              >
                {loading ? (
                  <>
                    <span>Connecting…</span>
                    <span className="w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  </>
                ) : (
                  <>
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                    <span>Continue with Google</span>
                    <Heart
                      size={16}
                      className="rotate-[45deg] group-hover:rotate-0 transition"
                    />
                  </>
                )}
              </button>

              <p className="text-[10px] font-lora italic text-white/60 px-4 leading-relaxed">
                Please use your college mail id (@nith.ac.in) email
              </p>
            </div>
          ) : (
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
                Welcome to Bloom ✨
              </p>

              <p className="font-lora text-sm text-white/80 leading-relaxed px-4">
                You're all set! Let's find your resonance.
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Login;
