// src/pages/Dashboard.jsx
import { useState, useEffect, useRef, useContext } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import TripForm from "../components/TripForm/TripForm";
import Sidebar from "../components/Sidebar";
import { AuthContext } from "../context/AuthContext";

const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";
const WS_URL = API_URL.replace("https://", "wss://").replace("http://", "ws://");

// ─── Mini Expert Chat Widget ──────────────────────────────────────────────────

function MiniExpertChat() {
  const { user, token, handleUnauthorized } = useContext(AuthContext);
  const navigate = useNavigate();

  const [rooms, setRooms] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return;
    fetch(`${API_URL}/chat/rooms`, {
      headers: { Authorization: `Bearer ${token}` },
    })
      .then((r) => {
        if (r.status === 401) {
          handleUnauthorized();
          return [];
        }
        if (!r.ok) throw new Error(`HTTP ${r.status}`);
        return r.json();
      })
      .then((data) => {
        setRooms(Array.isArray(data) ? data : []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, [token, handleUnauthorized]);

  const openChats = rooms.filter((r) => r.status === "open");

  return (
    <div>
      <p className="xp-label mb-3">Expert Chat</p>

      {/* ── Featured glowing Expert Chat card ── */}
      <div
        className="xp-expert-card rounded-2xl p-5 cursor-pointer relative overflow-hidden"
        onClick={() => navigate("/expert-chat")}
      >
        {/* Animated glow ring */}
        <div className="xp-glow-ring" />

        {/* FEATURED badge */}
        <div className="xp-featured-badge">
          <span className="xp-featured-dot" />
          FEATURED
        </div>

        {/* Icon + title row */}
        <div className="flex items-center gap-3 mb-3 mt-1">
          <div className="xp-chat-icon-wrap">
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="#0a0805" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-bold leading-tight" style={{ fontFamily: "'Playfair Display', serif", fontSize: "15px", color: "#fff" }}>
              Talk to an Expert
            </p>
            {openChats.length > 0 && (
              <span className="xp-open-badge">
                {openChats.length} OPEN
              </span>
            )}
          </div>
          <svg className="w-4 h-4 shrink-0 xp-arrow-icon" fill="none" viewBox="0 0 24 24" stroke="rgba(201,169,110,0.8)" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
          </svg>
        </div>

        <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.65)", lineHeight: "1.6" }}>
          Get personalised advice from our travel specialists — itineraries, budgets, hidden gems & more.
        </p>

        {/* Bottom CTA bar */}
        <div className="xp-cta-bar mt-4">
          <span style={{ fontSize: "11px", fontWeight: 700, letterSpacing: "0.08em", color: "#0a0805" }}>
            ✦ START A CONVERSATION
          </span>
          <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="#0a0805" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
          </svg>
        </div>
      </div>

      {/* Recent chats (if any) */}
      {!loading && rooms.length > 0 && (
        <div className="flex flex-col gap-1.5 mt-3">
          {rooms.slice(0, 2).map((room) => (
            <button
              key={room.uuid}
              onClick={() => navigate("/expert-chat")}
              className="w-full text-left px-3 py-2.5 rounded-xl transition-all duration-200 flex items-center justify-between gap-2"
              style={{
                background: "rgba(255,255,255,0.05)",
                border: "1px solid rgba(255,255,255,0.08)",
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.09)")}
              onMouseLeave={(e) => (e.currentTarget.style.background = "rgba(255,255,255,0.05)")}
            >
              <div className="flex items-center gap-2 min-w-0">
                <div className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: room.status === "open" ? "#6ee7b7" : "rgba(255,255,255,0.2)" }} />
                <p className="text-xs truncate" style={{ color: "rgba(255,255,255,0.70)" }}>
                  {room.topic || "Travel Question"}
                </p>
              </div>
              <span
                className="shrink-0 px-1.5 py-0.5 rounded-full"
                style={{
                  fontSize: "9px",
                  fontWeight: 600,
                  background: room.status === "open" ? "rgba(110,231,183,0.10)" : "rgba(255,255,255,0.05)",
                  color: room.status === "open" ? "rgba(110,231,183,0.75)" : "rgba(255,255,255,0.25)",
                }}
              >
                {room.status.toUpperCase()}
              </span>
            </button>
          ))}
          {rooms.length > 2 && (
            <button
              onClick={() => navigate("/expert-chat")}
              className="text-center py-1"
              style={{ fontSize: "10px", color: "rgba(201,169,110,0.60)" }}
            >
              + {rooms.length - 2} more conversation{rooms.length - 2 > 1 ? "s" : ""}
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Shared panel content (used in both desktop left panel and mobile bottom) ──
function PanelContent() {
  const navigate = useNavigate();

  return (
    <>
      {/* Trending Destinations */}
      <div>
        <p className="xp-label mb-4">Trending Destinations</p>
        <div className="flex flex-col gap-2">
          {[
            { name: "Goa, India",    tag: "Beach",     temp: "31°C" },
            { name: "Manali, HP",    tag: "Mountain",  temp: "12°C" },
            { name: "Jaipur, RJ",   tag: "Heritage",  temp: "28°C" },
            { name: "Kerala",        tag: "Nature",    temp: "29°C" },
            { name: "Ladakh, JK",   tag: "Adventure", temp: "4°C"  },
          ].map((dest, i) => (
            <div
              key={i}
              className="flex items-center justify-between px-3 py-2.5 rounded-xl cursor-default transition-all duration-200"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
              onMouseEnter={e => e.currentTarget.style.background = "rgba(201,169,110,0.18)"}
              onMouseLeave={e => e.currentTarget.style.background = "rgba(255,255,255,0.08)"}
            >
              <div className="min-w-0">
                <p className="xp-body-sm font-medium truncate" style={{ color: "rgba(255,255,255,0.90)" }}>{dest.name}</p>
                <p className="xp-caption" style={{ color: "rgba(201,169,110,0.85)" }}>{dest.tag}</p>
              </div>
              <span className="xp-caption shrink-0 ml-2" style={{ color: "rgba(255,255,255,0.60)" }}>{dest.temp}</span>
            </div>
          ))}
        </div>
      </div>

      <MiniExpertChat />

      {/* Pro Tip */}
      <div
        className="rounded-xl p-4"
        style={{
          background: "rgba(201,169,110,0.2)",
          border: "1px solid rgba(201,169,110,0.35)",
        }}
      >
        <p className="xp-label mb-2" style={{ color: "#c9a96e" }}>✦ Pro Tip</p>
        <p className="xp-body-sm leading-relaxed" style={{ color: "rgba(255,255,255,0.75)" }}>
          Book flights at least 6–8 weeks in advance for domestic routes to get the best fares.
        </p>
      </div>

      {/* Platform Stats */}
      <div>
        <p className="xp-label mb-4">Platform Stats</p>
        <div className="grid grid-cols-2 gap-2">
          {[
            { value: "10K+", label: "Trips Planned" },
            { value: "150+", label: "Destinations" },
            { value: "4.9★", label: "Avg Rating" },
            { value: "98%",  label: "Accuracy" },
          ].map((stat, i) => (
            <div
              key={i}
              className="rounded-xl px-3 py-3 text-center"
              style={{
                background: "rgba(255,255,255,0.08)",
                border: "1px solid rgba(255,255,255,0.15)",
              }}
            >
              <p className="xp-stat-val">{stat.value}</p>
              <p className="xp-caption mt-0.5" style={{ color: "rgba(255,255,255,0.55)" }}>{stat.label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Best Travel Months */}
      <div>
        <p className="xp-label mb-4">Best Travel Months</p>
        <div className="flex flex-col gap-2">
          {[
            { region: "North India", months: "Oct — Mar", dot: "#7db8f7" },
            { region: "South India", months: "Nov — Feb", dot: "#6ee7b7" },
            { region: "Himalaya",    months: "May — Sep", dot: "#c9a96e" },
            { region: "Beaches",     months: "Nov — Apr", dot: "#fbbf60" },
          ].map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.dot }} />
              <p className="xp-body-sm flex-1 truncate" style={{ color: "rgba(255,255,255,0.75)" }}>{item.region}</p>
              <p className="xp-caption" style={{ color: "rgba(255,255,255,0.50)" }}>{item.months}</p>
            </div>
          ))}
        </div>
      </div>
    </>
  );
}

// ─── Left Panel (desktop only) ────────────────────────────────────────────────
const LeftPanel = () => (
  <aside
    className="hidden xl:flex w-72 flex-col gap-7 px-5 py-8 overflow-y-auto"
    style={{
      background: "rgba(255, 255, 255, 0.07)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderRight: "1px solid rgba(255,255,255,0.15)",
    }}
  >
    <PanelContent />
  </aside>
);

// ─── Mobile Bottom Panel ──────────────────────────────────────────────────────
const MobileBottomPanel = () => (
  <div
    className="xl:hidden flex flex-col gap-7 px-4 py-8"
    style={{
      background: "rgba(8,6,4,0.75)",
      backdropFilter: "blur(20px)",
      WebkitBackdropFilter: "blur(20px)",
      borderTop: "1px solid rgba(255,255,255,0.10)",
    }}
  >
    <div className="max-w-lg mx-auto w-full flex flex-col gap-7">
      <div className="flex items-center gap-3">
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
        <p className="xp-label" style={{ color: "rgba(201,169,110,0.60)" }}>✦ EXPLORE MORE</p>
        <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.08)" }} />
      </div>
      <PanelContent />
    </div>
  </div>
);

// ─── Dashboard ────────────────────────────────────────────────────────────────
const Dashboard = () => {
  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,700;0,900;1,400&family=Outfit:wght@300;400;500;600&display=swap');

        .xp-wallpaper {
          position: fixed;
          inset: 0;
          z-index: 0;
          background-image: url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85');
          background-size: cover;
          background-position: center 35%;
        }
        .xp-wallpaper::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(
            160deg,
            rgba(4,3,2,0.72) 0%,
            rgba(8,6,4,0.60) 50%,
            rgba(4,3,2,0.75) 100%
          );
        }

        .xp-page {
          position: relative;
          z-index: 1;
          min-height: 100vh;
        }

        .xp-label {
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          font-weight: 600;
          letter-spacing: 0.18em;
          text-transform: uppercase;
          color: rgba(255,255,255,0.45);
        }
        .xp-body-sm {
          font-family: 'Outfit', sans-serif;
          font-size: 12px;
          font-weight: 400;
          color: rgba(255,255,255,0.85);
        }
        .xp-caption {
          font-family: 'Outfit', sans-serif;
          font-size: 10px;
          color: rgba(255,255,255,0.45);
        }
        .xp-stat-val {
          font-family: 'Playfair Display', serif;
          font-size: 18px;
          font-weight: 700;
          color: #c9a96e;
          line-height: 1;
        }

        /* ── Expert Chat featured card ── */
        .xp-expert-card {
          background: linear-gradient(135deg, rgba(201,169,110,0.22) 0%, rgba(201,169,110,0.10) 60%, rgba(139,103,48,0.18) 100%);
          border: 1px solid rgba(201,169,110,0.45);
          box-shadow: 0 0 0 0 rgba(201,169,110,0.30);
          transition: box-shadow 0.3s ease, transform 0.2s ease, border-color 0.2s ease;
          animation: xpExpertPulse 3s ease-in-out infinite;
        }
        .xp-expert-card:hover {
          box-shadow: 0 0 28px 4px rgba(201,169,110,0.28), 0 4px 24px rgba(0,0,0,0.40);
          transform: translateY(-1px);
          border-color: rgba(201,169,110,0.70);
          animation: none;
        }
        @keyframes xpExpertPulse {
          0%, 100% { box-shadow: 0 0 0 0 rgba(201,169,110,0.0), 0 2px 12px rgba(0,0,0,0.30); }
          50%       { box-shadow: 0 0 18px 3px rgba(201,169,110,0.22), 0 2px 12px rgba(0,0,0,0.30); }
        }

        .xp-glow-ring {
          position: absolute;
          inset: -1px;
          border-radius: inherit;
          background: linear-gradient(135deg, rgba(201,169,110,0.35), transparent 50%, rgba(201,169,110,0.15));
          pointer-events: none;
          opacity: 0.6;
        }

        .xp-featured-badge {
          display: inline-flex;
          align-items: center;
          gap: 5px;
          padding: 3px 8px;
          border-radius: 999px;
          background: rgba(201,169,110,0.90);
          font-family: 'Outfit', sans-serif;
          font-size: 8px;
          font-weight: 800;
          letter-spacing: 0.14em;
          color: #0a0805;
          margin-bottom: 10px;
          width: fit-content;
        }
        .xp-featured-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          background: #0a0805;
          animation: xpDotBlink 1.4s ease-in-out infinite;
        }
        @keyframes xpDotBlink {
          0%, 100% { opacity: 1; }
          50%       { opacity: 0.3; }
        }

        .xp-chat-icon-wrap {
          width: 36px;
          height: 36px;
          border-radius: 10px;
          background: linear-gradient(135deg, #c9a96e, #a07840);
          display: flex;
          align-items: center;
          justify-content: center;
          box-shadow: 0 2px 8px rgba(201,169,110,0.35);
          flex-shrink: 0;
        }

        .xp-open-badge {
          display: inline-block;
          padding: 1px 7px;
          border-radius: 999px;
          background: rgba(110,231,183,0.15);
          color: rgba(110,231,183,0.85);
          border: 1px solid rgba(110,231,183,0.25);
          font-size: 8px;
          font-weight: 700;
          letter-spacing: 0.06em;
          margin-top: 2px;
        }

        .xp-arrow-icon {
          transition: transform 0.2s ease;
        }
        .xp-expert-card:hover .xp-arrow-icon {
          transform: translateX(3px);
        }

        .xp-cta-bar {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 6px;
          padding: 8px 14px;
          border-radius: 10px;
          background: linear-gradient(135deg, #c9a96e, #b08540);
          box-shadow: 0 2px 10px rgba(201,169,110,0.30);
          transition: box-shadow 0.2s ease;
        }
        .xp-expert-card:hover .xp-cta-bar {
          box-shadow: 0 4px 16px rgba(201,169,110,0.45);
        }

        aside::-webkit-scrollbar { width: 3px; }
        aside::-webkit-scrollbar-track { background: transparent; }
        aside::-webkit-scrollbar-thumb { background: rgba(201,169,110,0.25); border-radius: 99px; }

        .xp-main::-webkit-scrollbar { width: 4px; }
        .xp-main::-webkit-scrollbar-track { background: transparent; }
        .xp-main::-webkit-scrollbar-thumb { background: rgba(255,255,255,0.1); border-radius: 99px; }
      `}</style>

      <div className="xp-wallpaper" />

      <div className="xp-page">
        <Navbar />

        <div
          className="flex"
          style={{ height: "calc(100vh - 56px)" }}
        >
          <style>{`
            @media (min-width: 768px) {
              .xp-layout { height: calc(100vh - 64px) !important; }
            }
          `}</style>
          <div className="xp-layout flex w-full" style={{ height: "calc(100vh - 56px)" }}>
            <LeftPanel />

            {/* Main scrollable area — form + mobile bottom panel */}
            <main className="xp-main flex-1 overflow-y-auto flex flex-col">
              {/* Form area */}
              <div className="p-4 md:p-6 lg:p-8 pb-8 flex items-start justify-center flex-1">
                <TripForm />
              </div>

              {/* Mobile bottom panel — below the form */}
              <MobileBottomPanel />
            </main>

            <aside
              className="w-80 hidden md:flex flex-col overflow-hidden"
              style={{
                background: "rgba(8, 6, 4, 0.55)",
                backdropFilter: "blur(18px)",
                WebkitBackdropFilter: "blur(18px)",
                borderLeft: "1px solid rgba(255,255,255,0.07)",
              }}
            >
              <Sidebar />
            </aside>
          </div>
        </div>

        <div className="md:hidden">
          <Sidebar />
        </div>
      </div>
    </>
  );
};

export default Dashboard;