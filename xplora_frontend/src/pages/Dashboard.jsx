// src/pages/Dashboard.jsx
import { useState } from "react";
import Navbar from "../components/Navbar";
import TripForm from "../components/TripForm/TripForm";
import Sidebar from "../components/Sidebar";

// ─── Left Panel ───────────────────────────────────────────────────────────────
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
  </aside>
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
          /* ❌ NO backgroundAttachment: fixed — breaks iOS Safari */
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

        {/*
          Layout height:
          - Desktop navbar = 64px (h-16) → calc(100vh - 64px)
          - Mobile  navbar = 56px (h-14) → calc(100vh - 56px)
        */}
        <div
          className="flex"
          style={{ height: "calc(100vh - 56px)" }}
          // Override for md+ via inline won't work; use a wrapper trick below
        >
          {/* Apply correct height per breakpoint via a sibling style tag trick:
              actual height is set via CSS class overrides below */}
          <style>{`
            @media (min-width: 768px) {
              .xp-layout { height: calc(100vh - 64px) !important; }
            }
          `}</style>
          <div className="xp-layout flex w-full" style={{ height: "calc(100vh - 56px)" }}>
            <LeftPanel />

            {/*
              main: pb-24 on mobile so TripForm content isn't hidden
              behind the floating AI button (bottom: 20px, height ~52px → safe 80px)
            */}
            <main className="xp-main flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8 flex items-start justify-center">
              <TripForm />
            </main>

            {/*
              Desktop sidebar — hidden on mobile.
              Sidebar component renders its own floating button + bottom sheet on mobile,
              so we don't need to render it here at all on mobile.
            */}
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

        {/*
          Mobile Sidebar — renders OUTSIDE the layout so the floating button
          and bottom sheet are not constrained by the aside's display:none.
          On md+ the Sidebar inside the aside above handles rendering.
        */}
        <div className="md:hidden">
          <Sidebar />
        </div>
      </div>
    </>
  );
};

export default Dashboard;