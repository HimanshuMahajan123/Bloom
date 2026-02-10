//@ts-nocheck
import React, { useEffect, useState, useRef } from "react";
import { Bell, X } from "lucide-react";
import multi_heart from "../assets/multi_heart.png";
import red_heart from "../assets/red_heart.png";
import physics_balloon from "../assets/physics_balloon.png";
import { fetchNotifications } from "../api/notifications";
import { fetchHome } from "../api/fetchHome";
import { updateUserLocation } from "../api/updateLocation";
import { checkNearbyUsers } from "../api/checkNearbyUsers";
import { rightSwipe, leftSwipe } from "../api/Swpie";
import { NavLink } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";
import ExpandedFeedCard from "./ExpandedFeedCard";
import RevealCard from "./RevealCard";
import SwipeCard from "./SwipeCard";

/* ---------- helpers ---------- */
const truncateWords = (text, limit = 80) => {
  if (!text) return "";
  const words = text.split(" ");
  return words.length <= limit ? text : words.slice(0, limit).join(" ") + "…";
};

/* ---------- FeedCard ---------- */
const FeedCard = ({ item, onExpand }) => (
  <div
    className="paper max-w-xl w-full mt-6 mb-6 px-8 py-6 relative rounded-3xl shadow-lg bg-white/10 animate-slide-up backdrop-blur-sm"
    style={{
      backgroundImage: `radial-gradient(ellipse at center, rgba(255,248,237,0.85) 0%, rgba(255,248,237,0.65) 75%), url(${multi_heart})`,
      backgroundSize: "cover, 220px",
      backgroundRepeat: "no-repeat, repeat",
    }}
    onClick={() => onExpand(item)}
  >
    <h2 className="text-center text-2xl font-playfair italic text-[#5b2a2a] mb-4">
      {item.username}
    </h2>
    <p className="font-lora italic text-sm text-[#4a2c2a] leading-relaxed">
      {truncateWords(item.poem, 40)}
    </p>
    <p className="mt-4 text-center text-xs italic text-[#8c3037]/60">
      Tap to open profile
    </p>
  </div>
);

/* ---------- Dashboard ---------- */
export default function Dashboard() {
  const { user } = useAuth();

  const [feedData, setFeedData] = useState([]);
  const [nextCursor, setNextCursor] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);

  const [signals, setSignals] = useState([]);
  const [likes, setLikes] = useState([]);
  const [resonance, setResonance] = useState([]);
  const [expandedProfile, setExpandedProfile] = useState(null);
  const [swipeClass, setSwipeClass] = useState("");
  const [notifPanelOpen, setNotifPanelOpen] = useState(false);
  const [notifTab, setNotifTab] = useState("signals");

  const nearbyCheckIntervalRef = useRef(null);
  const observerTarget = useRef(null);
  const [isTouch, setIsTouch] = useState(false);

  useEffect(() => {
    setIsTouch("ontouchstart" in window || navigator.maxTouchPoints > 0);
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) return;

    // ---- send location ----
    const sendLocation = () => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          updateUserLocation(pos.coords.latitude, pos.coords.longitude);
        },
        (err) => {
          console.error("Location error:", err);
        },
        {
          enableHighAccuracy: true,
          maximumAge: 10_000,
          timeout: 10_000,
        },
      );
    };
    // run once immediately
    sendLocation();

    // every 60 seconds
    const locationInterval = setInterval(sendLocation, 60_000);

    // ---- check nearby every 15s ----
    nearbyCheckIntervalRef.current = setInterval(async () => {
      try {
        const res = await checkNearbyUsers();

        setSignals((prev) =>
          res?.signals && res.signals.length > 0 ? res.signals : prev,
        );
      } catch (e) {
        console.error("Nearby check failed:", e);
      }
    }, 15_000);

    return () => {
      clearInterval(locationInterval);
      clearInterval(nearbyCheckIntervalRef.current);
    };
  }, []);

  /* ---------- INITIAL FEED LOAD ---------- */
  useEffect(() => {
    const loadInitialFeed = async () => {
      try {
        setInitialLoading(true);
        const res = await fetchHome();
        setFeedData(res?.data?.items || []);
        setNextCursor(res?.data?.nextCursor || null);
        setHasMore(res?.data?.nextCursor !== null);
      } catch (error) {
        console.error("Failed to load feed:", error);
      } finally {
        setInitialLoading(false);
      }
    };

    loadInitialFeed();
  }, []);

  /* ---------- LOAD MORE FUNCTION ---------- */
  const loadMoreFeed = async () => {
    if (!nextCursor || loadingMore) return;

    try {
      setLoadingMore(true);
      const res = await fetchHome(nextCursor.cursor, nextCursor.id);

      setFeedData((prev) => [...prev, ...(res?.data?.items || [])]);
      setNextCursor(res?.data?.nextCursor || null);
      setHasMore(res?.data?.nextCursor !== null);
    } catch (error) {
      console.error("Failed to load more feed:", error);
    } finally {
      setLoadingMore(false);
    }
  };

  /* ---------- INFINITE SCROLL OBSERVER ---------- */
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (
          entries[0].isIntersecting &&
          hasMore &&
          !loadingMore &&
          !initialLoading
        ) {
          loadMoreFeed();
        }
      },
      { threshold: 0.5 },
    );

    if (observerTarget.current) {
      observer.observe(observerTarget.current);
    }

    return () => {
      if (observerTarget.current) {
        observer.unobserve(observerTarget.current);
      }
    };
  }, [hasMore, loadingMore, nextCursor, initialLoading]);

  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;

    if (Math.abs(diff) < 60) return; // ignore small swipes

    if (diff > 0) {
      handleSwipe("left");
    } else {
      handleSwipe("right");
    }
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  /* ---------- NOTIFICATIONS ---------- */
  const openNotifications = async () => {
    setNotifPanelOpen(true);
    const res = await fetchNotifications();
    setLikes(res?.data?.likes || []);
    setResonance(res?.data?.resonance || []);
    setNotifTab("signals");
  };

  /* ---------- SWIPE ---------- */
  const handleSwipe = async (direction) => {
    if (!expandedProfile) return;

    setSwipeClass(direction === "right" ? "swipe-right" : "swipe-left");

    setTimeout(async () => {
      if (direction === "right") {
        await rightSwipe(expandedProfile.id);
      } else {
        await leftSwipe(expandedProfile.id);
      }

      setSignals((prev) => prev.filter((s) => s.id !== expandedProfile.id));
      setExpandedProfile(null);
      setSwipeClass("");
    }, 450);
  };

  return (
<div className="h-screen bg-linear-to-b from-[#700912] via-[#c4505a] to-[#dd908c] relative overflow-hidden">
      {/* Ambient hearts & balloons */}
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
        ))}
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
<div className="relative z-10 h-full min-h-0 overflow-y-auto no-scrollbar px-6 py-4">

      {/* Top Bar */}
<div className="
  sticky top-0 z-20
  flex justify-between items-center
   px-2
  bg-linear-to-b from-[#700912]/90 to-[#700912]/40
  backdrop-blur-md
  rounded-full
  p-0.5
">
        <NavLink to="/profile" className="flex items-center gap-3">
          <img
            src={user?.avatarUrl || "/males/1.png"}
            className="h-9 w-9 rounded-full object-cover ring-2 ring-white/30"
          />
          <p className="font-playfair italic text-white">{user?.username}</p>
        </NavLink>

        <button
          onClick={openNotifications}
          className="relative p-2.5 rounded-full bg-white/20 backdrop-blur-md"
        >
          <Bell size={18} className="text-white" />
          {signals.length > 0 && (
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-[#ff6b6b]" />
          )}
        </button>
      </div>

      {/* Feed */}
      <div className="flex flex-col items-center relative z-10">
        {initialLoading ? (
          <div className="text-white text-center py-10">Loading feed...</div>
        ) : (
          <>
            {feedData.map((item) => (
              <FeedCard
                key={item.id}
                item={item}
                onExpand={(item) =>
                  setExpandedProfile({ ...item, source: "feed" })
                }
              />
            ))}

            {/* Infinite scroll trigger */}
            {hasMore && (
              <div ref={observerTarget} className="w-full py-6 text-center">
                {loadingMore && (
                  <div className="text-white/80 text-sm">Loading more...</div>
                )}
              </div>
            )}

            {!hasMore && feedData.length > 0 && (
              <div className="text-white/60 text-sm py-6 text-center">
                No more poems to show
              </div>
            )}

            {!hasMore && feedData.length === 0 && (
              <div className="text-white/60 text-sm py-6 text-center">
                No poems available
              </div>
            )}
          </>
        )}
      </div>

      {/* ---------- Expanded Cards ---------- */}
      {/* Feed → Read-only */}
      {expandedProfile?.source === "feed" && (
        <ExpandedFeedCard
          profile={expandedProfile}
          onClose={() => setExpandedProfile(null)}
        />
      )}

      {/* Signals & Likes → Swipe */}
      {expandedProfile &&
        (expandedProfile.source === "signals" ||
          expandedProfile.source === "likes") && (
          <SwipeCard
            expandedProfile={expandedProfile}
            swipeClass={swipeClass}
            isTouch={isTouch}
            handleTouchStart={handleTouchStart}
            handleTouchMove={handleTouchMove}
            handleTouchEnd={handleTouchEnd}
            handleSwipe={handleSwipe}
            onClose={() => setExpandedProfile(null)}
          />
        )}

      {/* Resonance → Reveal */}
      {expandedProfile?.source === "resonance" && (
        <RevealCard
          expandedProfile={expandedProfile}
          onClose={() => setExpandedProfile(null)}
        />
      )}

      {/* Notifications Panel */}
      {notifPanelOpen && (
        <div className="fixed inset-0 z-50 flex justify-center bg-black/20 backdrop-blur-sm px-4 pt-6 pb-6 overflow-hidden">
          <div className="w-full max-w-md bg-white/95 rounded-3xl shadow-2xl flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex items-start justify-between px-4 py-4 shrink-0">
              <div className="flex gap-2">
                {["signals", "likes", "resonance"].map((t) => (
                  <button
                    key={t}
                    className={`px-3 py-2 rounded-full text-sm capitalize transition ${
                      notifTab === t
                        ? "bg-[#f9e8e8] text-[#5b2a2a]"
                        : "bg-white text-[#5b2a2a]/60 hover:bg-[#f9e8e8]/60"
                    }`}
                    onClick={() => setNotifTab(t)}
                  >
                    {t}
                  </button>
                ))}
              </div>

              <button
                onClick={() => setNotifPanelOpen(false)}
                className="p-2 rounded-full hover:bg-black/5 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* Content */}
<div className="flex-1 min-h-0 overflow-y-auto no-scrollbar px-2 py-3 space-y-3">
              {(notifTab === "signals"
                ? signals
                : notifTab === "likes"
                  ? likes
                  : resonance
              ).length ? (
                (notifTab === "signals"
                  ? signals
                  : notifTab === "likes"
                    ? likes
                    : resonance
                ).map((s) => (
                  <button
                    key={notifTab + s.id}
                    onClick={() => {
                      setExpandedProfile({
                        ...s,
                        source: notifTab, // "signals" | "likes" | "resonance"
                      });
                    }}
                    className="
    w-full text-left rounded-2xl px-4 py-4
    hover:bg-[#fdeeee]
    transition
    shadow-sm
    flex flex-col gap-1
  "
                    style={{
                      backgroundColor:
                        (s?.source || "PROXIMITY") === "PROXIMITY"
                          ? "#fff7f6"
                          : "rgba(187,151,35,1)",
                    }}
                  >
                    {/* Username */}
                    <div className="font-playfair italic text-base text-[#5b2a2a] truncate flex items-center justify-between">
                      <span>{s.username || "Someone nearby"}</span>

                      {/* 🔥 Score for likes & signals */}
                      {(notifTab === "likes" || notifTab === "signals") &&
                        typeof s.similarity === "number" && (
                          <span className="ml-2 text-xs font-lora text-[#8c3037]">
                            {Math.round(s.similarity * 100)}%
                          </span>
                        )}
                    </div>

                    {/* Subtitle */}
                    <div className="font-lora text-xs text-[#5b2a2a]/70">
                      {notifTab === "signals" && "A signal crossed your path | Click to view profile"}
                      {notifTab === "likes" && "They felt a spark"}
                      {notifTab === "resonance" && "A mutual bloom | Click to reveal"}
                    </div>
                  </button>
                ))
              ) : (
                <div className="text-sm text-center py-10 text-[#5b2a2a]/60">
                  {notifTab === "signals" && "No signals nearby right now."}
                  {notifTab === "likes" && "No sparks yet."}
                  {notifTab === "resonance" && "No blooms yet."}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      </div>
    </div>
  );
}
