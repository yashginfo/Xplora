// src/pages/SharedTrip.jsx
import { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";
import TripCostSplitter from "../components/TripCostSplitter";

const Section = ({ title, children }) => (
  <div className="backdrop-blur-md bg-black/45 rounded-2xl border border-white/10 p-4 md:p-6 mb-4">
    <h3 className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-4 md:mb-5">{title}</h3>
    {children}
  </div>
);

const SharedTrip = () => {
  const { uuid } = useParams();
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    axios.get(`http://localhost:8000/trips/share/${uuid}`)
      .then(res => setPlan(res.data))
      .catch(() => setNotFound(true))
      .finally(() => setLoading(false));
  }, [uuid]);

  // ❌ Removed backgroundAttachment: "fixed" — iOS Safari bug
  const wallpaperStyle = {
    backgroundImage: "url('https://images.unsplash.com/photo-1527631746610-bca00a040d60?w=1920&q=85')",
    backgroundSize: "cover",
    backgroundPosition: "center 40%",
  };

  const overlayStyle = { background: "linear-gradient(to bottom, rgba(0,0,0,0.65), rgba(0,0,0,0.50), rgba(0,0,0,0.88))" };

  if (loading) return (
    <div className="min-h-screen relative flex items-center justify-center" style={wallpaperStyle}>
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 text-center space-y-3">
        <div className="w-10 h-10 border-2 border-amber-400 border-t-transparent rounded-full animate-spin mx-auto" />
        <p className="text-white/35 text-sm">Loading trip...</p>
      </div>
    </div>
  );

  if (notFound) return (
    <div className="min-h-screen relative flex items-center justify-center px-4" style={wallpaperStyle}>
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 text-center">
        <div className="w-14 h-14 rounded-2xl backdrop-blur-md bg-white/8 border border-white/10 flex items-center justify-center mx-auto mb-4">
          <svg className="w-7 h-7 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
          </svg>
        </div>
        <p className="font-serif text-white font-bold text-lg">Trip not found</p>
        <p className="text-white/30 text-sm mt-1">This link may be invalid or expired.</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen relative py-6 md:py-8 px-4" style={wallpaperStyle}>
      <div className="absolute inset-0" style={overlayStyle} />
      <div className="relative z-10 max-w-2xl mx-auto">

        {/* Header bar */}
        <div className="flex items-center justify-between mb-6 md:mb-8">
          <span className="font-serif text-white text-xl font-bold tracking-wide">
            Xplo<span className="text-amber-400">ra</span>
          </span>
          <span className="text-[10px] font-bold uppercase tracking-widest backdrop-blur-md bg-white/8 border border-white/10 text-white/40 px-3 py-1.5 rounded-full">
            Read-only
          </span>
        </div>

        {/* Trip hero */}
        <div className="backdrop-blur-md bg-black/45 border border-white/10 rounded-2xl p-4 md:p-6 mb-4">
          <div className="h-px w-12 bg-amber-400 mb-4" />
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-2">✦ Shared Trip Plan</p>
          <h2 className="font-serif text-3xl md:text-4xl font-black text-white mb-2">{plan.destination}</h2>
          <p className="text-white/35 text-sm mb-4">{plan.duration} · {plan.people} {plan.people === 1 ? "person" : "people"} · {plan.travelStyle} style</p>
          <p className="text-white/55 text-sm leading-relaxed font-light">{plan.summary}</p>
        </div>

        {/* Disclaimer */}
        <div className="bg-amber-400/8 border border-amber-400/20 rounded-xl px-4 py-3 mb-4 flex items-start gap-2.5">
          <svg className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
          <p className="text-xs text-amber-400/80">All prices are approximate estimates — not guaranteed or bookable.</p>
        </div>

        <TripCostSplitter costBreakdown={plan.costBreakdown} people={plan.people} currency={plan.totalBudget} />

        {/* Hotels */}
        <Section title="Recommended Hotels">
          <div className="flex flex-col gap-2.5">
            {plan.hotels.map((hotel, i) => (
              <div key={i} className="border border-white/8 rounded-xl p-4 bg-white/3">
                <div className="flex justify-between items-start gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold text-white/85 text-sm">{hotel.name}</p>
                    <p className="text-xs text-white/30 mt-0.5">{hotel.area}</p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-serif font-bold text-amber-400 text-sm">{hotel.pricePerNight}<span className="text-[10px] text-white/25 font-normal">/night</span></p>
                    <p className="text-xs text-white/30 mt-0.5">{hotel.rating}</p>
                  </div>
                </div>
                <p className="text-xs text-white/40 mt-2.5 font-light">{hotel.reason}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Itinerary */}
        <Section title="Day-by-Day Itinerary">
          <div className="flex flex-col gap-3">
            {plan.itinerary.map((day) => (
              <div key={day.day} className="border border-white/8 rounded-xl overflow-hidden">
                <div className="bg-white/4 border-b border-white/6 px-4 py-3 flex justify-between items-start gap-2">
                  <div>
                    <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest block">Day {day.day}</span>
                    <p className="font-semibold text-white/85 text-sm mt-0.5">{day.title}</p>
                  </div>
                  <span className="text-[10px] bg-amber-400/10 border border-amber-400/25 text-amber-400 px-2 py-1 rounded-full font-semibold whitespace-nowrap shrink-0">~{day.estimatedDayCost}</span>
                </div>
                <div className="px-4 py-3 flex flex-col gap-2">
                  {[
                    { label: "Morning",   text: day.morning,   color: "text-amber-400" },
                    { label: "Afternoon", text: day.afternoon, color: "text-orange-400" },
                    { label: "Evening",   text: day.evening,   color: "text-sky-400" },
                  ].map(({ label, text, color }) => (
                    <div key={label}>
                      <span className={`text-[10px] font-bold uppercase tracking-widest ${color}`}>{label}</span>
                      <p className="text-xs text-white/45 mt-0.5 leading-snug font-light">{text}</p>
                    </div>
                  ))}
                  {day.food?.length > 0 && (
                    <div className="flex flex-wrap gap-1 mt-1">
                      {day.food.map((f, i) => <span key={i} className="text-[10px] bg-amber-400/10 text-amber-400 border border-amber-400/20 px-2 py-0.5 rounded-full">{f}</span>)}
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Section>

        {/* Transport */}
        <Section title="Transport">
          <div className="flex flex-col gap-2.5">
            {[
              { label: "To Destination", text: plan.transport.toDestination, color: "text-sky-400" },
              { label: "Local Transport", text: plan.transport.localTransport, color: "text-emerald-400" },
            ].map(({ label, text, color }) => (
              <div key={label} className="bg-white/3 border border-white/6 rounded-xl p-4">
                <p className={`text-[10px] font-bold uppercase tracking-widest mb-1.5 ${color}`}>{label}</p>
                <p className="text-sm text-white/45 font-light">{text}</p>
              </div>
            ))}
          </div>
        </Section>

        {/* Weather */}
        <Section title="Weather Info">
          <div className="bg-white/3 border border-white/6 rounded-xl p-4">
            <p className="text-sm text-white/45 leading-relaxed font-light">{plan.weatherNote}</p>
          </div>
        </Section>

        {/* Packing + Tips — 1 col on mobile, 2 cols on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
          {[
            { title: "Packing List", items: plan.packingEssentials },
            { title: "Travel Tips",  items: plan.travelTips },
          ].map(({ title, items }) => (
            <div key={title} className="backdrop-blur-md bg-black/45 rounded-2xl border border-white/10 p-4 md:p-5">
              <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-4">{title}</p>
              <div className="flex flex-col gap-2">
                {items.map((item, i) => (
                  <div key={i} className="flex items-start gap-2">
                    <div className="w-1 h-1 rounded-full bg-amber-400 shrink-0 mt-1.5" />
                    <p className="text-xs text-white/45 leading-relaxed font-light">{item}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-white/20 mb-8">
          Plan your own trip at <span className="font-serif text-amber-400 font-bold">Xplora</span>
        </p>
      </div>
    </div>
  );
};

export default SharedTrip;