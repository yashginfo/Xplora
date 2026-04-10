// src/components/Navbar.jsx
import { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import LanguageSelector from "./LanguageSelector";
import useTranslate from "../hooks/useTranslate";
import SurpriseMe from "./SurpriseMe";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const [surpriseOpen, setSurpriseOpen] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  const [myTrips, logoutText] = useTranslate(["My Trips", "Logout"]);

  // Lock body scroll when mobile menu is open
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

  return (
    <>
      <nav className="w-full h-14 md:h-16 sticky top-0 z-50 flex items-center justify-between px-4 md:px-8 border-b border-white/10 backdrop-blur-md bg-white/10">

        {/* Logo */}
        <div
          className="flex items-center gap-2 cursor-pointer shrink-0"
          onClick={() => navigate("/dashboard")}
        >
          <span className="font-serif text-white text-xl font-bold tracking-wide">
            Xplo<span className="text-amber-400">ra</span>
          </span>
        </div>

        {/* Desktop right side */}
        <div className="hidden md:flex items-center gap-5">
          <button
            onClick={() => navigate("/my-trips")}
            className="text-sm font-medium text-white/50 hover:text-white transition-colors"
          >
            {myTrips}
          </button>

          <button
            onClick={() => setSurpriseOpen(true)}
            className="flex items-center gap-1.5 text-sm font-semibold text-amber-400/70 hover:text-amber-400 border border-amber-400/20 hover:border-amber-400/50 hover:bg-amber-400/8 px-3.5 py-1.5 rounded-full transition-all duration-200"
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
            <span className="text-sm text-white/50 hidden lg:block">
              {user?.name || "Traveller"}
            </span>
          </div>

          <button
            onClick={handleLogout}
            className="text-xs font-semibold bg-white/5 hover:bg-white/10 text-white/60 hover:text-white border border-white/10 hover:border-white/20 px-3 py-1.5 rounded-full transition-all"
          >
            {logoutText}
          </button>
        </div>

        {/* Mobile right side */}
        <div className="flex md:hidden items-center gap-3">
          {/* User avatar — always visible */}
          <div className="w-7 h-7 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center shrink-0">
            <span className="text-amber-400 text-xs font-bold">
              {(user?.name || "T")[0].toUpperCase()}
            </span>
          </div>

          {/* Hamburger button */}
          <button
            onClick={() => setMenuOpen((o) => !o)}
            className="w-9 h-9 flex flex-col items-center justify-center gap-1.5 rounded-lg bg-white/5 border border-white/10 transition-all"
            aria-label="Toggle menu"
          >
            <span
              className={`block w-4.5 h-px bg-white/70 transition-all duration-300 origin-center ${
                menuOpen ? "rotate-45 translate-y-0.75" : ""
              }`}
              style={{ width: "18px" }}
            />
            <span
              className={`block h-px bg-white/70 transition-all duration-300 ${
                menuOpen ? "opacity-0 w-0" : "w-4.5"
              }`}
              style={{ width: menuOpen ? "0" : "18px" }}
            />
            <span
              className={`block h-px bg-white/70 transition-all duration-300 origin-center ${
                menuOpen ? "-rotate-45 -translate-y-0.75" : ""
              }`}
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
        className={`fixed top-14 right-0 z-50 w-72 max-w-[90vw] h-[calc(100vh-3.5rem)] md:hidden flex flex-col transition-transform duration-300 ease-out ${
          menuOpen ? "translate-x-0" : "translate-x-full"
        }`}
        style={{
          background: "rgba(15,12,8,0.97)",
          backdropFilter: "blur(20px)",
          borderLeft: "1px solid rgba(255,255,255,0.08)",
        }}
      >
        {/* User info */}
        <div
          className="px-5 py-5 border-b"
          style={{ borderColor: "rgba(255,255,255,0.08)" }}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-400/20 border border-amber-400/40 flex items-center justify-center">
              <span className="text-amber-400 text-sm font-bold">
                {(user?.name || "T")[0].toUpperCase()}
              </span>
            </div>
            <div>
              <p className="text-white/80 text-sm font-semibold">
                {user?.name || "Traveller"}
              </p>
              <p className="text-white/30 text-xs">{user?.email || ""}</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <div className="flex flex-col flex-1 px-3 py-4 gap-1 overflow-y-auto">
          <button
            onClick={() => handleNav("/dashboard")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all text-left"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
            </svg>
            Dashboard
          </button>

          <button
            onClick={() => handleNav("/my-trips")}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-white/60 hover:text-white hover:bg-white/5 transition-all text-left"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            {myTrips}
          </button>

          <button
            onClick={handleSurprise}
            className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-amber-400/80 hover:text-amber-400 hover:bg-amber-400/8 border border-amber-400/15 hover:border-amber-400/30 transition-all text-left mt-1"
          >
            <span className="text-base shrink-0">✦</span>
            Surprise Me
          </button>

          {/* Language selector — full width in drawer */}
          <div
            className="mt-3 px-1 pt-3 border-t"
            style={{ borderColor: "rgba(255,255,255,0.08)" }}
          >
            <p className="text-[10px] font-bold tracking-widest text-white/20 uppercase px-3 mb-2">
              Language
            </p>
            <LanguageSelector mobileFullWidth />
          </div>
        </div>

        {/* Logout at bottom */}
        <div className="px-3 py-4 border-t" style={{ borderColor: "rgba(255,255,255,0.08)" }}>
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm text-red-400/70 hover:text-red-400 hover:bg-red-500/8 transition-all"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            {logoutText}
          </button>
        </div>
      </div>

      {/* Surprise Me slide-in panel */}
      <SurpriseMe isOpen={surpriseOpen} onClose={() => setSurpriseOpen(false)} />
    </>
  );
};

export default Navbar;