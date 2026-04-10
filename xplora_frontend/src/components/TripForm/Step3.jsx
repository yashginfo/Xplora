// src/components/TripForm/Step3.jsx
import useTranslate from "../../hooks/useTranslate";

const Step3 = ({ formData, updateForm, onSubmit, onBack }) => {
  const [
    title, sub, styleLabel,
    standardLabel, standardDesc,
    mediumLabel, mediumDesc,
    lowLabel, lowDesc,
    interestsLabel, interestsSub,
    adventureLabel, foodLabel, cultureLabel, natureLabel, relaxLabel,
    backBtn, generateBtn,
  ] = useTranslate([
    "Your Travel Style",
    "Step 3 of 3 — Style & Interests",
    "Choose your travel style",
    "Standard", "Best experience, higher budget",
    "Medium", "Balance of comfort & cost",
    "Budget", "Smart picks, lower cost",
    "Any specific interests?", "Select one or more",
    "Adventure", "Food", "Culture", "Nature", "Relaxation",
    "Back", "Generate My Trip",
  ]);

  const STYLES = [
    {
      value: "standard", label: standardLabel, desc: standardDesc,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /></svg>,
    },
    {
      value: "medium", label: mediumLabel, desc: mediumDesc,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 6l3 1m0 0l-3 9a5.002 5.002 0 006.001 0M6 7l3 9M6 7l6-2m6 2l3-1m-3 1l-3 9a5.002 5.002 0 006.001 0M18 7l3 9m-3-9l-6-2m0-2v2m0 16V5m0 16H9m3 0h3" /></svg>,
    },
    {
      value: "low", label: lowLabel, desc: lowDesc,
      icon: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>,
    },
  ];

  const INTERESTS = [
    { value: "adventure",  label: adventureLabel, emoji: "🧗" },
    { value: "food",       label: foodLabel,      emoji: "🍜" },
    { value: "culture",    label: cultureLabel,   emoji: "🏛️" },
    { value: "nature",     label: natureLabel,    emoji: "🌿" },
    { value: "relaxation", label: relaxLabel,     emoji: "🌅" },
  ];

  const toggleInterest = (val) => {
    const current = formData.interests;
    const updated = current.includes(val)
      ? current.filter((i) => i !== val)
      : [...current, val];
    updateForm({ interests: updated });
  };

  const isValid = formData.travelStyle && formData.interests.length > 0;

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">{sub}</p>
        <h2 className="font-serif text-xl md:text-2xl font-black text-white">{title}</h2>
      </div>

      <div className="flex flex-col gap-5 md:gap-6">

        {/* Travel Style */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
            {styleLabel}
          </label>
          <div className="flex flex-col gap-2">
            {STYLES.map((s) => (
              <button
                key={s.value}
                onClick={() => updateForm({ travelStyle: s.value })}
                // min-h-14 ensures good touch area
                className={`w-full flex items-center gap-3 px-4 py-3 min-h-14 rounded-xl border text-left transition-all duration-200 active:scale-[0.99]
                  ${formData.travelStyle === s.value
                    ? "bg-amber-400/10 border-amber-400/40 text-amber-300"
                    : "bg-white/3 border-white/10 text-white/45 hover:border-white/20 hover:text-white/70"
                  }`}
              >
                <span className={`shrink-0 ${formData.travelStyle === s.value ? "text-amber-400" : "text-white/25"}`}>
                  {s.icon}
                </span>
                <div className="min-w-0 flex-1">
                  <span className="font-semibold text-sm block">{s.label}</span>
                  <span className="text-xs opacity-60 block">{s.desc}</span>
                </div>
                {formData.travelStyle === s.value && (
                  <div className="ml-auto w-4 h-4 rounded-full bg-amber-400 flex items-center justify-center shrink-0">
                    <svg className="w-2.5 h-2.5 text-stone-900" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Interests */}
        <div className="flex flex-col gap-2">
          <div className="flex items-baseline gap-2 flex-wrap">
            <label className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
              {interestsLabel}
            </label>
            <span className="text-[10px] text-white/20">{interestsSub}</span>
          </div>
          {/* Slightly larger pills on mobile for better tap area */}
          <div className="flex flex-wrap gap-2">
            {INTERESTS.map((interest) => (
              <button
                key={interest.value}
                onClick={() => toggleInterest(interest.value)}
                className={`flex items-center gap-1.5 px-4 py-2.5 rounded-full text-sm font-medium border transition-all duration-200 active:scale-95
                  ${formData.interests.includes(interest.value)
                    ? "bg-amber-400/15 text-amber-400 border-amber-400/40"
                    : "bg-white/3 text-white/40 border-white/10 hover:border-white/20 hover:text-white/70"
                  }`}
              >
                <span>{interest.emoji}</span>
                {interest.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-7 md:mt-8">
        <button
          onClick={onBack}
          className="flex-1 py-3.5 min-h-13 rounded-xl border border-white/10 text-white/40 hover:text-white/70 hover:border-white/25 font-semibold text-sm transition-all active:scale-[0.98]"
        >
          ← {backBtn}
        </button>
        <button
          onClick={onSubmit}
          disabled={!isValid}
          className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-stone-900 py-3.5 min-h-13 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98]"
        >
          ✦ {generateBtn}
        </button>
      </div>
    </div>
  );
};

export default Step3;