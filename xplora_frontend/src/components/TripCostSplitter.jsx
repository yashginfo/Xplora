// src/components/TripCostSplitter.jsx
import useTranslate from "../hooks/useTranslate";

const parseAmount = (value) => {
  if (!value && value !== 0) return 0;
  const cleaned = String(value)
    .replace(/[₹$€£¥\s]/gi, "")
    .replace(/Rs\.?\s*/gi, "")
    .replace(/,/g, "")
    .replace(/[^\d.]/g, "")
    .trim();
  const num = parseFloat(cleaned);
  return isNaN(num) ? 0 : num;
};

const detectCurrencySymbol = (costBreakdown) => {
  const values = Object.values(costBreakdown || {});
  for (const v of values) {
    const str = String(v || "");
    if (str.includes("$")) return "$";
    if (str.includes("€")) return "€";
    if (str.includes("£")) return "£";
    if (str.includes("Rs.")) return "Rs. ";
  }
  return "₹";
};

const formatAmount = (num, symbol) => {
  if (!num || num === 0) return `${symbol}0`;
  return `${symbol}${Math.round(num).toLocaleString("en-IN")}`;
};

const ICONS = {
  stay: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" /></svg>,
  travel: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" /></svg>,
  food: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4" /></svg>,
  activities: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21l9-9m0 0l6.5-6.5M12 12L5.5 5.5M21 3l-6.5 6.5" /></svg>,
  taxi: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" /></svg>,
  miscellaneous: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 6.375c0 2.278-3.694 4.125-8.25 4.125S3.75 8.653 3.75 6.375m16.5 0c0-2.278-3.694-4.125-8.25-4.125S3.75 4.097 3.75 6.375m16.5 0v11.25c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125V6.375m16.5 0v3.75m-16.5-3.75v3.75m16.5 0v3.75C20.25 16.153 16.556 18 12 18s-8.25-1.847-8.25-4.125v-3.75m16.5 0c0 2.278-3.694 4.125-8.25 4.125s-8.25-1.847-8.25-4.125" /></svg>,
};

const TripCostSplitter = ({ costBreakdown, people, totalBudget }) => {
  const [
    title,
    stayLabel, travelLabel, foodLabel, activitiesLabel, taxiLabel, miscLabel,
    totalLabel, perPersonLabel, divideLabel, personWord, peopleWord,
    approxNote, remainingLabel, savedLabel,
  ] = useTranslate([
    "Trip Cost Splitter",
    "Accommodation", "Travel", "Food", "Activities", "Local Transport", "Miscellaneous",
    "Total estimated cost", "Per person share",
    "÷", "person", "people",
    "Approximate AI estimate",
    "Remaining from your budget", "You save",
  ]);

  const labels = {
    stay: stayLabel, travel: travelLabel, food: foodLabel,
    activities: activitiesLabel, taxi: taxiLabel, miscellaneous: miscLabel,
  };
  const COST_KEYS = ["stay", "travel", "food", "activities", "taxi", "miscellaneous"];

  // ── Actual trip cost: sum of the 6 real cost categories ──
  const actualTotal = COST_KEYS.reduce(
    (sum, key) => sum + parseAmount(costBreakdown?.[key]),
    0
  );

  const safePeople = Math.max(parseInt(people) || 1, 1);
  const perPerson  = actualTotal > 0 ? Math.round(actualTotal / safePeople) : 0;
  const symbol     = detectCurrencySymbol(costBreakdown);

  // ── User's original budget: parse totalBudget prop directly ──
  // totalBudget comes from plan.totalBudget e.g. "INR 15000" or "USD 10000"
  // Strip currency code/symbol and parse the number cleanly.
  const userBudget = (() => {
    if (!totalBudget) return 0;
    // Remove currency codes (INR, USD, EUR etc.) and symbols, keep digits + dot
    const cleaned = String(totalBudget)
      .replace(/[a-zA-Z]/g, "")   // remove INR, USD, etc.
      .replace(/[₹$€£¥]/g, "")   // remove currency symbols
      .replace(/,/g, "")           // remove commas
      .replace(/[^\d.]/g, "")      // remove anything else
      .trim();
    const parsed = parseFloat(cleaned);
    return isNaN(parsed) ? 0 : parsed;
  })();

  // ── Remaining = user's budget - actual trip cost ──
  // Only show if userBudget was parsed successfully and is > 0
  const remaining  = userBudget > 0 ? Math.round(userBudget - actualTotal) : 0;
  const hasSavings = remaining > 0 && userBudget > 0;

  return (
    <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/10 p-6 mb-4">

      {/* Header */}
      <div className="flex items-center gap-2.5 mb-5">
        <div className="w-8 h-8 rounded-lg bg-amber-400/15 border border-amber-400/25 flex items-center justify-center">
          <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12m-3-2.818l.879.659c1.171.879 3.07.879 4.242 0 1.172-.879 1.172-2.303 0-3.182C13.536 12.219 12.768 12 12 12c-.725 0-1.45-.22-2.003-.659-1.106-.879-1.106-2.303 0-3.182s2.9-.879 4.006 0l.415.33M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <h3 className="font-serif text-sm font-semibold text-white">{title}</h3>
      </div>

      {/* Cost rows */}
      <div className="flex flex-col gap-1.5 mb-5">
        {COST_KEYS.map((key) => {
          const raw = costBreakdown?.[key];
          if (!raw) return null;
          return (
            <div key={key} className="flex items-center justify-between py-2.5 border-b border-white/6 last:border-0">
              <div className="flex items-center gap-2.5">
                <span className="text-white/25">{ICONS[key]}</span>
                <span className="text-xs text-white/50">{labels[key] || key}</span>
              </div>
              <span className="text-xs font-semibold text-white/70">{raw}</span>
            </div>
          );
        })}
      </div>

      {/* Total + per person */}
      <div className="bg-white/4 border border-white/8 rounded-xl p-4">
        <div className="flex items-end justify-between gap-4">
          <div>
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-1">{totalLabel}</p>
            <p className="font-serif text-lg font-bold text-white">{formatAmount(actualTotal, symbol)}</p>
            <p className="text-xs text-white/25 mt-0.5">{divideLabel} {safePeople} {safePeople === 1 ? personWord : peopleWord}</p>
          </div>
          <div className="text-right">
            <p className="text-[10px] font-bold text-white/25 uppercase tracking-widest mb-1">{perPersonLabel}</p>
            <p className="font-serif text-3xl font-bold text-amber-400">{formatAmount(perPerson, symbol)}</p>
            <p className="text-[10px] text-white/25 mt-0.5">{approxNote}</p>
          </div>
        </div>

        {hasSavings && (
          <div className="mt-4 pt-4 border-t border-white/8 flex items-center justify-between">
            <div>
              <p className="text-[10px] font-bold text-emerald-400 uppercase tracking-widest mb-0.5">{remainingLabel}</p>
              <p className="text-xs text-white/30">{savedLabel} {formatAmount(remaining, symbol)} on this trip</p>
            </div>
            <p className="font-serif text-xl font-bold text-emerald-400">{formatAmount(remaining, symbol)}</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default TripCostSplitter;