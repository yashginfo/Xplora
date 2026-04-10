// src/components/SurpriseMe.jsx
import { useState, useEffect } from "react";
import client from "../api/client";

const IconX = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
  </svg>
);
const IconArrow = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 4.5L21 12m0 0l-7.5 7.5M21 12H3" />
  </svg>
);
const IconBack = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M10.5 19.5L3 12m0 0l7.5-7.5M3 12h18" />
  </svg>
);
const IconPin = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0zM19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
  </svg>
);
const IconClock = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
  </svg>
);

const fitColors = {
  Tight:       "text-orange-400 bg-orange-400/10 border-orange-400/25",
  Comfortable: "text-emerald-400 bg-emerald-400/10 border-emerald-400/25",
  Plenty:      "text-sky-400 bg-sky-400/10 border-sky-400/25",
};

const CostRow = ({ label, value, highlight }) => (
  <div className={`flex justify-between items-center py-2.5 border-b border-white/6 last:border-0 ${highlight ? "text-amber-400" : ""}`}>
    <span className={`text-xs ${highlight ? "font-bold text-amber-400" : "text-white/40 font-light"}`}>{label}</span>
    <span className={`text-sm font-bold ${highlight ? "text-amber-400" : "text-white/70"}`}>{value}</span>
  </div>
);

const DestCard = ({ dest, onPick }) => (
  <div
    onClick={() => onPick(dest)}
    className="group cursor-pointer backdrop-blur-md bg-black/40 border border-white/10 hover:border-amber-400/40 rounded-2xl p-4 md:p-5 transition-all duration-300 hover:bg-black/55 active:scale-[0.99]"
  >
    <div className="flex items-start justify-between gap-3 mb-3">
      <div className="flex items-center gap-2.5 min-w-0">
        <span className="text-2xl shrink-0">{dest.emoji}</span>
        <div className="min-w-0">
          <p className="font-serif font-black text-white text-base leading-tight truncate">{dest.name}</p>
          <p className="text-[10px] font-bold text-amber-400/70 uppercase tracking-widest mt-0.5">{dest.vibe}</p>
        </div>
      </div>
      <span className={`shrink-0 text-[10px] font-bold px-2.5 py-1 rounded-full border uppercase tracking-wide ${fitColors[dest.budget_fit] || fitColors.Comfortable}`}>
        {dest.budget_fit}
      </span>
    </div>
    <p className="text-xs text-white/45 leading-relaxed font-light mb-3">{dest.why_go}</p>
    <div className="flex items-center gap-4 mb-3">
      <div className="flex items-center gap-1.5 text-white/30"><IconClock /><span className="text-[11px]">{dest.travel_time}</span></div>
      <div className="flex items-center gap-1.5 text-white/30"><IconPin /><span className="text-[11px]">{dest.travel_mode}</span></div>
    </div>
    <div className="flex flex-wrap gap-1.5 mb-4">
      {dest.best_for?.map((tag, i) => (
        <span key={i} className="text-[10px] bg-white/5 border border-white/10 text-white/35 px-2.5 py-1 rounded-full">{tag}</span>
      ))}
    </div>
    <div className="flex items-center justify-between pt-3 border-t border-white/8">
      <span className="text-[10px] text-white/25 uppercase tracking-widest font-semibold">Est. Total</span>
      <span className="font-serif font-black text-amber-400 text-lg">{dest.cost_breakdown?.total_estimated}</span>
    </div>
    <div className="mt-3 flex items-center justify-end gap-1.5 text-amber-400/50 group-hover:text-amber-400 transition-colors">
      <span className="text-[11px] font-semibold">Explore this</span>
      <IconArrow />
    </div>
  </div>
);

const DestDetail = ({ dest, meta, onBack }) => {
  const cb = dest.cost_breakdown || {};
  return (
    <div className="flex flex-col h-full">
      <button onClick={onBack} className="flex items-center gap-2 text-xs text-white/35 hover:text-white transition-colors mb-5">
        <IconBack /> Back to suggestions
      </button>
      <div className="backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl p-4 md:p-5 mb-4">
        <div className="flex items-start gap-3 mb-4">
          <span className="text-4xl">{dest.emoji}</span>
          <div>
            <p className="font-serif font-black text-white text-2xl leading-tight">{dest.name}</p>
            <div className="flex items-center gap-3 mt-1.5 flex-wrap">
              <span className="text-[10px] font-bold text-amber-400 uppercase tracking-widest">{dest.vibe}</span>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${fitColors[dest.budget_fit] || fitColors.Comfortable}`}>{dest.budget_fit} budget fit</span>
            </div>
          </div>
        </div>
        <div className="h-px bg-white/8 mb-4" />
        <p className="text-sm text-white/55 leading-relaxed font-light">{dest.why_go}</p>
        <div className="flex items-center gap-5 mt-4 flex-wrap">
          <div className="flex items-center gap-1.5 text-amber-400/70"><IconClock /><span className="text-xs">{dest.travel_time}</span></div>
          <div className="flex items-center gap-1.5 text-amber-400/70"><IconPin /><span className="text-xs">{dest.travel_mode} from {meta.home_location}</span></div>
        </div>
      </div>
      <div className="backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl p-4 md:p-5 mb-4">
        <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-1">Estimated Cost Breakdown</p>
        <p className="text-[10px] text-white/20 font-light mb-4">{meta.days} days · from {meta.home_location}</p>
        <CostRow label="✈  Transport (both ways)" value={cb.travel} />
        <CostRow label="🏨  Stay" value={cb.stay} />
        <CostRow label="🍽  Food" value={cb.food} />
        <CostRow label="🎯  Activities" value={cb.activities} />
        <CostRow label="Total Estimated" value={cb.total_estimated} highlight />
        <div className="mt-4 pt-3 border-t border-white/8 flex justify-between items-center">
          <span className="text-[10px] text-white/25 uppercase tracking-widest">Your budget</span>
          <span className="text-xs text-white/40 font-light">{meta.currency === "INR" ? "₹" : "$"}{parseInt(meta.budget).toLocaleString()}</span>
        </div>
      </div>
      <div className="backdrop-blur-md bg-black/40 border border-white/10 rounded-2xl p-4 md:p-5 mb-4">
        <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-3">Best For</p>
        <div className="flex flex-wrap gap-2">
          {dest.best_for?.map((tag, i) => (
            <span key={i} className="text-xs bg-amber-400/10 border border-amber-400/20 text-amber-400 px-3 py-1.5 rounded-full">{tag}</span>
          ))}
        </div>
      </div>
      <div className="bg-amber-400/5 border border-amber-400/15 rounded-xl px-4 py-3 flex items-start gap-2">
        <svg className="w-3.5 h-3.5 text-amber-400/60 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
        <p className="text-[10px] text-amber-400/50 leading-relaxed">All costs are AI-estimated approximates for a budget traveler. Actual prices may vary.</p>
      </div>
    </div>
  );
};

const LoadingDots = () => (
  <div className="flex flex-col items-center justify-center flex-1 gap-6 py-16">
    <div className="relative w-16 h-16">
      <div className="absolute inset-0 rounded-full border border-amber-400/20 animate-ping" />
      <div className="absolute inset-2 rounded-full border border-amber-400/40 animate-ping" style={{ animationDelay: "0.2s" }} />
      <div className="absolute inset-4 rounded-full bg-amber-400/20 animate-pulse" />
      <span className="absolute inset-0 flex items-center justify-center text-xl">✦</span>
    </div>
    <div className="text-center">
      <p className="font-serif font-bold text-white text-lg">Finding your perfect escapes</p>
      <p className="text-xs text-white/30 mt-1.5 font-light">Calculating real costs from <span className="text-amber-400/60">your location</span></p>
    </div>
  </div>
);

const SurpriseMe = ({ isOpen, onClose }) => {
  const today = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [form, setForm] = useState({ home_location: "", budget: "", currency: "INR", start_date: "", end_date: "" });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState(null);
  const [picked, setPicked] = useState(null);

  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => {
        setForm({ home_location: "", budget: "", currency: "INR", start_date: "", end_date: "" });
        setLoading(false); setError(""); setResult(null); setPicked(null);
      }, 300);
    }
  }, [isOpen]);

  const update = (k, v) => setForm((p) => ({ ...p, [k]: v }));

  const allFilled = form.home_location.trim() && form.budget && form.start_date && form.end_date && parseFloat(form.budget) > 0;

  const handleSubmit = async () => {
    if (!allFilled) return;
    setLoading(true); setError(""); setResult(null); setPicked(null);
    try {
      const res = await client.post("/surprise/suggest", {
        home_location: form.home_location.trim(),
        budget: parseFloat(form.budget),
        currency: form.currency,
        start_date: form.start_date,
        end_date: form.end_date,
      });
      setResult(res.data);
    } catch (err) {
      setError(err.response?.data?.detail || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const sym = form.currency === "INR" ? "₹" : "$";

  const renderContent = () => {
    if (loading) return <LoadingDots />;

    if (picked && result) {
      return <DestDetail dest={picked} meta={{ home_location: result.home_location, budget: result.budget, currency: result.currency, days: result.days }} onBack={() => setPicked(null)} />;
    }

    if (result) {
      return (
        <div className="flex flex-col gap-4">
          <div className="mb-1">
            <p className="font-serif font-black text-white text-xl">Your Surprise Picks</p>
            <p className="text-xs text-white/35 mt-1 font-light">3 destinations from {result.home_location} · {result.days} days · {sym}{parseInt(result.budget).toLocaleString()} budget</p>
          </div>
          {result.destinations.map((dest, i) => <DestCard key={i} dest={dest} onPick={setPicked} />)}
          <button onClick={() => setResult(null)} className="text-xs text-white/25 hover:text-white/50 transition-colors text-center py-2">← Try different dates or budget</button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-4 md:gap-5">
        <div>
          <p className="font-serif font-black text-white text-xl leading-snug">Where can you go?</p>
          <p className="text-xs text-white/35 mt-1.5 font-light leading-relaxed">Tell us your location and budget — we'll find 3 perfect destinations you can actually afford.</p>
        </div>

        {/* Home location */}
        <div>
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
            Your Home Location <span className="text-amber-400">*</span>
          </label>
          <div className="relative">
            <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-white/20"><IconPin /></div>
            <input
              type="text"
              placeholder="e.g. Agra, Delhi, Mumbai..."
              value={form.home_location}
              onChange={(e) => update("home_location", e.target.value)}
              className="w-full bg-white/5 border border-white/10 focus:border-amber-400/40 rounded-xl px-4 py-3 min-h-12 pl-9 text-sm text-white placeholder-white/20 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Budget + Currency */}
        <div>
          <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">
            Total Budget <span className="text-amber-400">*</span>
          </label>
          <div className="flex gap-2">
            <div className="flex rounded-xl overflow-hidden border border-white/10 shrink-0">
              {["INR", "USD"].map((c) => (
                <button key={c} onClick={() => update("currency", c)} className={`px-3 py-3 min-h-12 text-xs font-bold transition-all ${form.currency === c ? "bg-amber-400 text-stone-900" : "bg-white/5 text-white/30 hover:text-white/60"}`}>
                  {c === "INR" ? "₹" : "$"}
                </button>
              ))}
            </div>
            <input
              type="number"
              placeholder={form.currency === "INR" ? "e.g. 8000" : "e.g. 150"}
              value={form.budget}
              onChange={(e) => update("budget", e.target.value)}
              min={0}
              className="flex-1 bg-white/5 border border-white/10 focus:border-amber-400/40 rounded-xl px-4 py-3 min-h-12 text-sm text-white placeholder-white/20 outline-none transition-colors"
            />
          </div>
        </div>

        {/* Dates — stack on mobile */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">Start Date <span className="text-amber-400">*</span></label>
            <input type="date" min={today} value={form.start_date} onChange={(e) => update("start_date", e.target.value)} className="w-full bg-white/5 border border-white/10 focus:border-amber-400/40 rounded-xl px-3 py-3 min-h-12 text-sm text-white/70 outline-none transition-colors" style={{ colorScheme: "dark" }} />
          </div>
          <div>
            <label className="block text-[10px] font-bold text-white/30 uppercase tracking-widest mb-2">End Date <span className="text-amber-400">*</span></label>
            <input type="date" min={form.start_date || today} value={form.end_date} onChange={(e) => update("end_date", e.target.value)} className="w-full bg-white/5 border border-white/10 focus:border-amber-400/40 rounded-xl px-3 py-3 min-h-12 text-sm text-white/70 outline-none transition-colors" style={{ colorScheme: "dark" }} />
          </div>
        </div>

        {error && (
          <div className="bg-red-500/10 border border-red-500/25 text-red-400 text-xs px-4 py-3 rounded-xl flex items-start gap-2">
            <svg className="w-3.5 h-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
            {error}
          </div>
        )}
        {!allFilled && <p className="text-[10px] text-white/20 text-center">All fields are required to find your perfect destination</p>}

        <button
          onClick={handleSubmit}
          disabled={!allFilled}
          className="w-full py-3.5 min-h-13 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all duration-200 disabled:opacity-30 disabled:cursor-not-allowed bg-amber-400 hover:bg-amber-300 text-stone-900 hover:-translate-y-0.5 shadow-lg shadow-amber-400/15 active:scale-[0.98]"
        >
          Surprise Me ✦ <IconArrow />
        </button>
      </div>
    );
  };

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 z-40 transition-all duration-300 ${isOpen ? "backdrop-blur-sm bg-black/40 pointer-events-auto" : "backdrop-blur-none bg-transparent pointer-events-none"}`}
        onClick={onClose}
      />

      {/*
        Panel:
        - Mobile: full width (w-full), slides up from bottom as a tall sheet
        - Desktop (sm+): w-96 slides in from right as before
      */}
      <div
        className={`fixed z-50 flex flex-col transition-transform duration-300 ease-in-out
          backdrop-blur-xl bg-amber-400/10 border-amber-400/20 shadow-2xl shadow-amber-400/5
          /* Mobile: bottom sheet */
          bottom-0 left-0 right-0 sm:bottom-auto sm:left-auto sm:right-0 sm:top-0
          w-full sm:w-96
          /* Mobile: slides up; desktop: slides in from right */
          ${isOpen ? "translate-y-0 sm:translate-y-0 sm:translate-x-0" : "translate-y-full sm:translate-y-0 sm:translate-x-full"}
          /* Mobile: 90vh rounded top; desktop: full height */
          h-[90vh] sm:h-full
          rounded-t-2xl sm:rounded-none
          border-t border-l-0 sm:border-t-0 sm:border-l`}
      >
        {/* Mobile drag handle */}
        <div className="flex justify-center pt-3 pb-1 sm:hidden">
          <div className="w-10 h-1 rounded-full bg-white/20" />
        </div>

        {/* Panel header */}
        <div className="flex items-center justify-between px-5 md:px-6 py-4 md:py-5 border-b border-white/8 shrink-0">
          <div className="flex items-center gap-2.5">
            <span className="text-amber-400 text-lg">✦</span>
            <div>
              <p className="font-serif font-bold text-white text-base">Surprise Me</p>
              <p className="text-[10px] text-white/25 font-light">AI destination discovery</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-full bg-white/5 hover:bg-white/10 border border-white/10 flex items-center justify-center text-white/40 hover:text-white transition-all">
            <IconX />
          </button>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-5 md:px-6 py-5 md:py-6">
          {renderContent()}
        </div>
      </div>
    </>
  );
};

export default SurpriseMe;