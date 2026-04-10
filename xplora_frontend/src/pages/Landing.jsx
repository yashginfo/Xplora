// src/pages/Landing.jsx
import { useNavigate } from "react-router-dom";
import { useTravelBackground } from "../hooks/useTravelBackground";

const Landing = () => {
  const navigate = useNavigate();
  const { bgUrl, photographer, photographerUrl, loading } = useTravelBackground();

  return (
    <div className="h-screen w-screen flex flex-col overflow-hidden relative">

      {/* Shimmer while image loads */}
      <div className={`absolute inset-0 bg-linear-to-br from-stone-800 via-stone-900 to-stone-800 transition-opacity duration-700 ${loading ? "opacity-100" : "opacity-0"}`} />

      {/* Live Unsplash background */}
      <div
        className="absolute inset-0 transition-opacity duration-1000"
        style={{
          backgroundImage: bgUrl ? `url('${bgUrl}')` : undefined,
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: loading ? 0 : 1,
        }}
      />

      {/* Cinematic overlay */}
      <div className="absolute inset-0 z-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.60), rgba(0,0,0,0.35), rgba(0,0,0,0.82))" }} />

      {/* Navbar */}
      <nav className="relative z-10 flex items-center justify-between px-4 md:px-8 py-4 border-b border-white/10 backdrop-blur-sm bg-black/20 shrink-0">
        <span className="font-serif text-white text-xl md:text-2xl font-bold tracking-wide select-none">
          Xplo<span className="text-amber-400">ra</span>
        </span>

        {/* Desktop nav */}
        <div className="hidden sm:flex items-center gap-3">
          <button className="px-4 py-2 text-sm text-white/50 hover:text-white transition-colors font-medium">EN</button>
          <button
            onClick={() => navigate("/login")}
            className="px-5 py-2 text-sm text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-full transition-all"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-5 py-2 text-sm font-semibold bg-amber-400 hover:bg-amber-300 text-stone-900 rounded-full transition-all hover:shadow-lg hover:shadow-amber-400/25 hover:-translate-y-px"
          >
            Get started
          </button>
        </div>

        {/* Mobile nav — compact */}
        <div className="flex sm:hidden items-center gap-2">
          <button
            onClick={() => navigate("/login")}
            className="px-4 py-2 text-sm text-white/70 border border-white/20 rounded-full transition-all"
          >
            Sign in
          </button>
          <button
            onClick={() => navigate("/signup")}
            className="px-4 py-2 text-sm font-semibold bg-amber-400 text-stone-900 rounded-full transition-all active:scale-[0.97]"
          >
            Start
          </button>
        </div>
      </nav>

      {/* Hero */}
      <div className="relative z-10 flex-1 flex items-center justify-center px-5 md:px-6 min-h-0">
        <div className="max-w-3xl w-full text-center">

          {/* Badge */}
          <div className="inline-flex items-center gap-2 border border-amber-400/30 bg-amber-400/10 text-amber-400 text-xs font-semibold px-4 py-1.5 rounded-full mb-4 md:mb-5 uppercase tracking-widest">
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            AI-Powered Travel Planning
          </div>

          {/* Headline */}
          <h1 className="font-serif text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-4 drop-shadow-2xl">
            Travel More,{" "}
            <span className="text-amber-400 italic">Worry Less.</span>
          </h1>

          {/* Subline */}
          <p className="text-sm md:text-base lg:text-lg text-white/55 max-w-xl mx-auto leading-relaxed font-light mb-6 md:mb-7">
            Enter your destination, budget, and dates. Xplora's AI builds your
            complete day-by-day itinerary — hotels, transport, food and cost
            breakdown. Instantly.
          </p>

          {/* CTAs — stack on very small screens */}
          <div className="flex items-center justify-center gap-3 md:gap-4 mb-6 md:mb-8 flex-wrap">
            <button
              onClick={() => navigate("/signup")}
              className="px-6 md:px-8 py-3 md:py-3.5 bg-amber-400 hover:bg-amber-300 text-stone-900 font-semibold text-sm rounded-full transition-all hover:-translate-y-0.5 shadow-lg shadow-amber-400/20 active:scale-[0.97]"
            >
              Start planning — it's free →
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-6 md:px-8 py-3 md:py-3.5 border border-white/25 hover:border-white/50 text-white hover:bg-white/10 font-medium text-sm rounded-full backdrop-blur-sm transition-all active:scale-[0.97]"
            >
              Sign in
            </button>
          </div>

          {/* Stats */}
          <div className="flex items-center justify-center gap-5 md:gap-12 border-t border-white/10 pt-5 md:pt-6 flex-wrap">
            {[
              { value: "10K+", label: "Trips Planned" },
              { value: "500+", label: "Destinations" },
              { value: "4.9★", label: "Avg Rating" },
              { value: "< 30s", label: "Plan Generated" },
            ].map((stat, i) => (
              <div key={i} className="text-center">
                <p className="font-serif text-lg md:text-xl font-bold text-amber-400">{stat.value}</p>
                <p className="text-xs text-white/35 mt-0.5 tracking-wide">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Unsplash attribution */}
      {photographer && !loading && (
        <div className="absolute bottom-3 right-4 z-20">
          <a
            href={`${photographerUrl}?utm_source=xplora&utm_medium=referral`}
            target="_blank"
            rel="noopener noreferrer"
            className="text-[10px] text-white/25 hover:text-white/50 transition-colors"
          >
            Photo by {photographer} · Unsplash
          </a>
        </div>
      )}
    </div>
  );
};

export default Landing;