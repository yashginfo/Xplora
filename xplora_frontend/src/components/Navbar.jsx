// src/components/Navbar.jsx
import { useContext, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LanguageSelector from "./LanguageSelector";
import useTranslate from "../hooks/useTranslate";
import SurpriseMe from "./SurpriseMe";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const location = useLocation();
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [homeText, myTrips, logoutText, expertChatText] = useTranslate(["Home", "My Trips", "Logout", "Expert Chat"]);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => { document.body.style.overflow = ""; };
  }, [menuOpen]);

  const handleLogout = () => {
    logout();
    navigate("/login");
    setMenuOpen(false);
  };

  const handleNav = (path) => {
    navigate(path);
    setMenuOpen(false);
  };

  const handleSurprise = () => {
    setSurpriseOpen(true);
    setMenuOpen(false);
  };

  // ── Active route helpers ────────────────────────────────
  const isHome        = location.pathname === "/dashboard";
  const isMyTrips     = location.pathname === "/my-trips";
  // "Surprise Me" is a panel (not a route), so we track it via surpriseOpen state

  const navItemStyle = (active) => ({
    fontSize: "13px",
    fontWeight: active ? 700 : 500,
    color: active ? "#c9a96e" : "rgba(255,255,255,0.50)",
    borderBottom: active ? "2px solid #c9a96e" : "2px solid transparent",
    paddingBottom: "2px",
    transition: "color 0.15s, border-color 0.15s",
    background: "none",
    cursor: "pointer",
    fontFamily: "'Outfit', sans-serif",
  });

  return (
    <>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Playfair+Display:wght@700&family=Outfit:wght@400;500;600;700&display=swap');

        .xp-nav-btn {
          background: none;
          border: none;
          padding: 0;
          cursor: pointer;
          transition: color 0.15s ease;
          font-family: 'Outfit', sans-serif;
        }
        .xp-nav-btn:hover {
          color: #fff !important;
        }

        .xp-surprise-btn {
          transition: all 0.2s ease;
        }
        .xp-surprise-active {
          color: #f59e0b !important;
          border-color: rgba(245,158,11,0.60) !important;
          background: rgba(245,158,11,0.12) !important;
        }
      `}</style>

      <nav className="w-full h-14 md:h-16 sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 border-b border-white/10 backdrop-blur-md bg-white/10">

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer shrink-0"
          onClick={() => navigate("/dashboard")}
        >
          <span style={{ fontFamily: "'Playfair Display', serif", fontSize: "20px", fontWeight: 700, color: "#fff", letterSpacing: "0.03em" }}>
            Xplo<span style={{ color: "#f59e0b" }}>ra</span>
          </span>
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-5">

          {/* Home */}
          <button
            className="xp-nav-btn"
            onClick={() => navigate("/dashboard")}
            style={navItemStyle(isHome)}
          >
            {homeText}
          </button>

          {/* My Trips */}
          <button
            className="xp-nav-btn"
            onClick={() => navigate("/my-trips")}
            style={navItemStyle(isMyTrips)}
          >
            {myTrips}
          </button>

          {/* Surprise Me */}
          <button
            onClick={() => setSurpriseOpen(true)}
            className={`xp-surprise-btn flex items-center gap-1.5 text-sm font-semibold border px-3.5 py-1.5 rounded-full ${surpriseOpen ? "xp-surprise-active" : ""}`}
            style={{
              color: surpriseOpen ? "#f59e0b" : "rgba(245,158,11,0.70)",
              borderColor: surpriseOpen ? "rgba(245,158,11,0.60)" : "rgba(245,158,11,0.20)",
              background: surpriseOpen ? "rgba(245,158,11,0.12)" : "transparent",
              fontFamily: "'Outfit', sans-serif",
            }}
            onMouseEnter={(e) => {
              if (!surpriseOpen) {
                e.currentTarget.style.color = "#f59e0b";
                e.currentTarget.style.borderColor = "rgba(245,158,11,0.50)";
                e.currentTarget.style.background = "rgba(245,158,11,0.08)";
              }
            }}
            onMouseLeave={(e) => {
              if (!surpriseOpen) {
                e.currentTarget.style.color = "rgba(245,158,11,0.70)";
                e.currentTarget.style.borderColor = "rgba(245,158,11,0.20)";
                e.currentTarget.style.background = "transparent";
              }
            }}
          >
            <span>✦</span>
            <span>Surprise Me</span>
          </button>

          <LanguageSelector />

          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <span className="text-amber-400 text-xs font-bold">
                {(user?.name || "T")[0].toUpperCase()}
              </span>
            </div>
            <span className="text-sm text-white/50 hidden lg:block" style={{ fontFamily: "'Outfit', sans-serif" }}>
              {user?.name || "Traveller"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-full transition-all"
            style={{ fontFamily: "'Outfit', sans-serif" }}
          >
            {logoutText}
          </button>
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-3">
          <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <span className="text-amber-400 text-xs font-bold">
              {(user?.name || "T")[0].toUpperCase()}
            </span>
          </div>

          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-white/5 border border-white/10 transition-all"
            aria-label="Toggle menu"
          >
            <span
              className={`block h-px bg-white/70 transition-all duration-300 origin-center ${menuOpen ? "rotate-45 translate-y-[7px]" : ""}`}
              style={{ width: "18px" }}
            />
            <span
              className={`block h-px bg-white/70 transition-all duration-300 ${menuOpen ? "opacity-0 w-0" : ""}`}
              style={{ width: "18px" }}
            />
            <span
              className={`block h-px bg-white/70 transition-all duration-300 origin-center ${menuOpen ? "-rotate-45 -translate-y-[7px]" : ""}`}
              style={{ width: "18px" }}
            />
          </button>
        </div>
      </nav>

      {/* Mobile drawer overlay */}
      {menuOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setMenuOpen(false)}
        />
      )}

      {/* Mobile drawer */}
      <div
        className={`fixed top-14 right-0 z-50 w-72 max-w-[90vw] md:hidden flex flex-col transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          height: "calc(100dvh - 3.5rem)",
          background: "rgba(15,12,8,0.97)",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* User info */}
        <div
          className="px-5 py-4 border-b shrink-0"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
              <span className="text-amber-400 text-sm font-bold">
                {(user?.name || "T")[0].toUpperCase()}
              </span>
            </div>
            <div className="min-w-0">
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "14px", fontWeight: 600, color: "rgba(255,255,255,0.80)" }} className="truncate">
                {user?.name || "Traveller"}
              </p>
              <p style={{ fontFamily: "'Outfit', sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.30)" }} className="truncate">{user?.email || ""}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex flex-col flex-1 min-h-0 overflow-y-auto px-3 py-3 gap-1">

          {/* Home */}
          <button
            onClick={() => handleNav("/dashboard")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
            style={{
              background: isHome ? "rgba(201,169,110,0.12)" : "transparent",
              border: isHome ? "1px solid rgba(201,169,110,0.25)" : "1px solid transparent",
              color: isHome ? "#c9a96e" : "rgba(255,255,255,0.60)",
              fontFamily: "'Outfit', sans-serif",
              fontSize: "14px",
              fontWeight: isHome ? 600 : 400,
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            {homeText}
            {isHome && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#c9a96e" }} />}
          </button>

          {/* My Trips */}
          <button
            onClick={() => handleNav("/my-trips")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left"
            style={{
              background: isMyTrips ? "rgba(201,169,110,0.12)" : "transparent",
              border: isMyTrips ? "1px solid rgba(201,169,110,0.25)" : "1px solid transparent",
              color: isMyTrips ? "#c9a96e" : "rgba(255,255,255,0.60)",
              fontFamily: "'Outfit', sans-serif",
              fontSize: "14px",
              fontWeight: isMyTrips ? 600 : 400,
            }}
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {myTrips}
            {isMyTrips && <span className="ml-auto w-1.5 h-1.5 rounded-full" style={{ background: "#c9a96e" }} />}
          </button>

          {/* Surprise Me */}
          <button
            onClick={handleSurprise}
            className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all text-left mt-1"
            style={{
              color: "rgba(245,158,11,0.80)",
              border: "1px solid rgba(245,158,11,0.15)",
              background: "rgba(245,158,11,0.06)",
              fontFamily: "'Outfit', sans-serif",
              fontSize: "14px",
            }}
          >
            <span className="text-base shrink-0">✦</span>
            Surprise Me
          </button>

          {/* Language selector */}
          <div
            className="mt-3 px-1 pt-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p
              className="px-3 mb-2 uppercase tracking-widest"
              style={{ fontSize: "10px", fontWeight: 700, color: "rgba(255,255,255,0.20)", fontFamily: "'Outfit', sans-serif" }}
            >
              Language
            </p>
            <LanguageSelector mobileFullWidth />
          </div>

          {/* Logout */}
          <div
            className="mt-3 pt-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all"
              style={{ fontFamily: "'Outfit', sans-serif" }}
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {logoutText}
            </button>
          </div>
        </div>
      </div>

      {/* Surprise Me slide-in panel */}
      <SurpriseMe isOpen={surpriseOpen} onClose={() => setSurpriseOpen(false)} />
    </>
  );
};

export default Navbar;