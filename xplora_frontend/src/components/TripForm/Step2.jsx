// src/components/TripForm/Step2.jsx
import useTranslate from "../../hooks/useTranslate";

const ErrorMsg = ({ text }) => (
  <p className="text-xs text-red-400 flex items-center gap-1.5">
    <svg
      className="w-3.5 h-3.5 shrink-0"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
      />
    </svg>
    {text}
  </p>
);

const Step2 = ({ formData, updateForm, onNext, onBack }) => {
  const [
    title,
    sub,
    peopleLabel,
    budgetTypeLabel,
    forEveryoneBtn,
    perPersonBtn,
    budgetLabel,
    backBtn,
    nextBtn,
    peopleMaxError,
    budgetLowINR,
    budgetLowUSD,
  ] = useTranslate([
    "Budget Details",
    "Step 2 of 3 — Group & Budget",
    "How many people are travelling?",
    "Budget scope",
    "For Everyone",
    "Per Person",
    "What is your budget?",
    "Back",
    "Continue",
    "Maximum 50 travellers allowed.",
    "Budget too low. Minimum ₹700 per person required.",
    "Budget too low. Minimum $20 per person required.",
  ]);

  const MIN_INR = 700;
  const MIN_USD = 20;
  const minPerPerson = formData.currency === "INR" ? MIN_INR : MIN_USD;
  const budgetLowError =
    formData.currency === "INR" ? budgetLowINR : budgetLowUSD;

  const perPerson =
    formData.budgetType === "total"
      ? parseFloat(formData.budget) / parseInt(formData.people)
      : parseFloat(formData.budget);

  const budgetTooLow =
    formData.budget && formData.people && perPerson < minPerPerson;
  const peopleTooMany = parseInt(formData.people) > 50;

  const isValid =
    parseInt(formData.people) >= 1 &&
    parseInt(formData.people) <= 50 &&
    formData.budget &&
    parseFloat(formData.budget) > 0 &&
    !budgetTooLow;

  const inputBase =
    "w-full border rounded-xl px-4 py-3 min-h-[48px] text-sm text-white/85 placeholder-white/20 focus:outline-none transition-all duration-200";
  const inputNormal =
    "border-white/10 bg-white/5 focus:border-amber-400/50 focus:bg-white/8";
  const inputError = "border-red-500/40 bg-red-500/5 focus:border-red-500/60";

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">
          {sub}
        </p>
        <h2 className="font-serif text-xl md:text-2xl font-black text-white">
          {title}
        </h2>
      </div>

      <div className="flex flex-col gap-4 md:gap-5">
        {/* People count */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
            {peopleLabel}
          </label>
          <input
            type="number"
            min={1}
            max={50}
            value={formData.people}
            onChange={(e) =>
              updateForm({ people: parseInt(e.target.value) || 1 })
            }
            className={`${inputBase} ${peopleTooMany ? inputError : inputNormal}`}
          />
          {peopleTooMany && <ErrorMsg text={peopleMaxError} />}
        </div>

        {/* Budget type toggle */}
        <div className="flex flex-col gap-2">
          <label className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
            {budgetTypeLabel}
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              {
                type: "total",
                label: forEveryoneBtn,
                icon: (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z"
                    />
                  </svg>
                ),
              },
              {
                type: "per_person",
                label: perPersonBtn,
                icon: (
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                    />
                  </svg>
                ),
              },
            ].map(({ type, label, icon }) => (
              <button
                key={type}
                onClick={() => updateForm({ budgetType: type })}
                // min-h-12 for comfortable touch
                className={`flex items-center justify-center gap-2 py-3 min-h-12 rounded-xl text-sm font-medium border transition-all duration-200
                  ${
                    formData.budgetType === type
                      ? "bg-amber-400/12 text-amber-400 border-amber-400/40"
                      : "bg-white/3 text-white/40 border-white/10 hover:border-white/20 hover:text-white/70"
                  }`}
              >
                {icon}
                <span className="truncate">{label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Budget amount + currency */}
        <div className="flex flex-col gap-1.5">
          <label className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
            {budgetLabel}
          </label>
          {/* Stack currency + amount — prevents overflow on narrow screens */}
          <div className="flex gap-2 items-stretch">
            <select
              value={formData.currency}
              onChange={(e) => updateForm({ currency: e.target.value })}
              className="border border-white/10 rounded-xl px-3 py-3 min-h-12 text-sm font-semibold focus:outline-none focus:border-amber-400/40 transition-all cursor-pointer appearance-none text-center shrink-0"
              style={{
                background: "rgba(255,255,255,0.08)",
                color: "rgba(255,255,255,0.75)",
                colorScheme: "dark",
                width: "80px",
              }}
            >
              <option
                value="INR"
                style={{ background: "#1a1a2e", color: "#fff" }}
              >
                ₹ INR
              </option>
              <option
                value="USD"
                style={{ background: "#1a1a2e", color: "#fff" }}
              >
                $ USD
              </option>
            </select>

            <input
              type="number"
              min={0}
              placeholder="e.g. 15000"
              value={formData.budget}
              onChange={(e) => updateForm({ budget: e.target.value })}
              className={`flex-1 ${inputBase} ${budgetTooLow ? inputError : inputNormal}`}
            />
          </div>

          {formData.budget &&
            formData.people &&
            !budgetTooLow &&
            formData.budgetType === "total" && (
              <p className="text-xs text-amber-400 flex items-center gap-1.5">
                <svg
                  className="w-3.5 h-3.5"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
                {formData.currency === "INR" ? "₹" : "$"}
                {Math.floor(perPerson).toLocaleString()} per person
              </p>
            )}

          {budgetTooLow && <ErrorMsg text={budgetLowError} />}
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
          onClick={onNext}
          disabled={!isValid}
          className="flex-1 bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-stone-900 py-3.5 min-h-13 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98]"
        >
          {nextBtn} →
        </button>
      </div>
    </div>
  );
};

export default Step2;
