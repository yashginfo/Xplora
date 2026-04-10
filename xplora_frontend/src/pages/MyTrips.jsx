// src/pages/MyTrips.jsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Navbar";
import client from "../api/client";
import TripResult from "../components/TripResult";
import useTranslate from "../hooks/useTranslate";

const MyTrips = () => {
  const [trips, setTrips]               = useState([]);
  const [loading, setLoading]           = useState(true);
  const [error, setError]               = useState("");
  const [selectedTrip, setSelectedTrip] = useState(null);
  const navigate = useNavigate();

  const [title, emptyMsg, backText, loadingText, goToDashboard] = useTranslate([
    "My Trips",
    "No trips saved yet. Plan your first trip.",
    "Back to My Trips",
    "Loading your trips...",
    "Go to Dashboard",
  ]);

  useEffect(() => {
    const fetchTrips = async () => {
      try {
        const res = await client.get("/trips/my-trips");
        setTrips(res.data);
      } catch {
        setError("Failed to load trips. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTrips();
  }, []);

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-IN", {
        day: "numeric", month: "short", year: "numeric",
      });
    } catch { return dateStr; }
  };

  // ❌ Removed backgroundAttachment: "fixed" — iOS Safari bug
  const wallpaperStyle = {
    backgroundImage: "url('https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=85')",
    backgroundSize: "cover",
    backgroundPosition: "center 40%",
  };

  if (selectedTrip) {
    return (
      <div className="min-h-screen relative" style={wallpaperStyle}>
        <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.50), rgba(0,0,0,0.85))" }} />
        <div className="relative z-10">
          <Navbar />
          <div className="max-w-2xl mx-auto px-4 md:px-6 py-6 md:py-8 pb-24">
            <div className="flex items-center justify-between mb-6 gap-3">
              <button
                onClick={() => setSelectedTrip(null)}
                className="flex items-center gap-2 text-xs font-semibold text-white/40 hover:text-amber-400 transition-colors"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                {backText}
              </button>
              <button
                onClick={() => navigate("/dashboard")}
                className="flex items-center gap-2 text-xs font-semibold text-amber-400/70 hover:text-amber-400 border border-amber-400/20 hover:border-amber-400/50 px-4 py-2 rounded-full transition-all hover:-translate-y-0.5"
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                </svg>
                {goToDashboard}
              </button>
            </div>
            <TripResult
              plan={selectedTrip.plan || selectedTrip}
              weatherData={selectedTrip.plan?.weatherData || null}
              fromLocation={selectedTrip.from_location || ""}
              hotelsData={selectedTrip.plan?.hotelsData || []}
              flightsData={selectedTrip.plan?.flightsData || []}
              trainsData={selectedTrip.plan?.trainsData || []}
              photosData={selectedTrip.plan?.photosData || []}
              hotelPhotosData={selectedTrip.plan?.hotelPhotosData || []}
              onRegenerate={() => {}}
              regenerateCount={2}
              readOnly={true}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative" style={wallpaperStyle}>
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.50), rgba(0,0,0,0.85))" }} />
      <div className="relative z-10">
        <Navbar />
        <div className="max-w-5xl mx-auto px-4 md:px-6 py-8 md:py-10">

          {/* Page header */}
          <div className="mb-8 md:mb-10">
            <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">✦ Your journeys</p>
            <h1 className="font-serif text-3xl md:text-4xl font-black text-white">{title}</h1>
            <p className="text-sm text-white/35 mt-1 font-light">Your saved AI-generated itineraries</p>
          </div>

          {/* Dashboard shortcut */}
          <div className="mb-6 flex justify-end">
            <button
              onClick={() => navigate("/dashboard")}
              className="flex items-center gap-2 text-xs font-semibold text-amber-400/60 hover:text-amber-400 border border-amber-400/15 hover:border-amber-400/40 px-4 py-2 rounded-full transition-all hover:-translate-y-0.5"
            >
              <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
              </svg>
              Plan a new trip
            </button>
          </div>

          {loading && (
            <div className="flex items-center justify-center py-24">
              <div className="text-center space-y-3">
                <div className="w-8 h-8 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
                <p className="text-sm text-white/35">{loadingText}</p>
              </div>
            </div>
          )}

          {error && (
            <div className="bg-red-500/10 border border-red-500/20 text-red-400 text-sm px-4 py-3 rounded-xl mb-4 flex items-center gap-2">
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              {error}
            </div>
          )}

          {!loading && !error && trips.length === 0 && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl backdrop-blur-md bg-white/8 border border-white/10 flex items-center justify-center mb-6">
                <svg className="w-8 h-8 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <p className="text-white/40 text-sm mb-5 font-light">{emptyMsg}</p>
              <button onClick={() => navigate("/dashboard")} className="text-sm bg-amber-400 hover:bg-amber-300 text-stone-900 font-bold px-6 py-2.5 rounded-full transition-all hover:-translate-y-0.5">
                Plan a Trip →
              </button>
            </div>
          )}

          {!loading && trips.length > 0 && (
            /* 1 col on mobile, 2 on sm, 3 on lg — already correct */
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {trips.map((trip) => (
                <button
                  key={trip.uuid}
                  onClick={() => setSelectedTrip(trip)}
                  className="text-left backdrop-blur-md bg-black/40 rounded-2xl border border-white/10 p-5 hover:border-amber-400/35 hover:bg-black/55 transition-all duration-200 group active:scale-[0.99]"
                >
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] font-semibold text-white/30 uppercase tracking-wide truncate">{trip.from_location || "—"}</span>
                    <svg className="w-3.5 h-3.5 text-amber-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" /></svg>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-wide truncate">{trip.destination}</span>
                  </div>
                  <h2 className="font-serif text-xl font-black text-white group-hover:text-amber-300 transition-colors mb-2">{trip.destination}</h2>
                  <p className="text-xs text-white/25">Saved {formatDate(trip.created_at)}</p>
                  <div className="flex items-center gap-1.5 mt-4 text-xs font-semibold text-amber-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    View full itinerary
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" /></svg>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyTrips;