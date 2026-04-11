// src/components/TripForm/Step1.jsx
import useTranslate from "../../hooks/useTranslate";

// Only letters, spaces, commas, hyphens, dots — no numbers or special chars
const isValidPlace = (val) =>
  val.trim().length >= 3 && /^[a-zA-Z\s,.\-']+$/.test(val.trim());

const InputField = ({
  label,
  placeholder,
  value,
  onChange,
  invalid,
  errorMsg,
}) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
      {label}
    </label>
    <input
      type="text"
      placeholder={placeholder}
      value={value}
      onChange={onChange}
      className={`w-full border rounded-xl px-4 py-3 min-h-12 text-sm text-white/85 placeholder-white/20 focus:outline-none transition-all duration-200
        ${
          invalid
            ? "border-red-500/40 bg-red-500/5 focus:border-red-500/60"
            : "border-white/10 bg-white/5 focus:border-amber-400/50 focus:bg-white/8"
        }`}
    />
    {invalid && (
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
        {errorMsg}
      </p>
    )}
  </div>
);

const Step1 = ({ formData, updateForm, onNext }) => {
  // ── Local timezone date fix (IST safe) ─────────────────
  const today = (() => {
    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  // ── Max date = today + 1 month ──────────────────────────
  const maxDate = (() => {
    const d = new Date();
    d.setMonth(d.getMonth() + 1);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, "0");
    const dd = String(d.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  })();

  const [
    title,
    sub,
    fromLabel,
    fromPlaceholder,
    destLabel,
    destPlaceholder,
    startLabel,
    endLabel,
    nextBtn,
    invalidPlaceError,
  ] = useTranslate([
    "Where do you want to go?",
    "Step 1 of 3 — Where & When",
    "Travelling From",
    "e.g. Mumbai, Delhi, Bangalore...",
    "Destination",
    "e.g. Goa, Manali, Kerala...",
    "Start Date",
    "End Date",
    "Continue",
    "Only letters allowed — no numbers or symbols.",
  ]);

  const fromTouched = formData.from?.length > 0;
  const destTouched = formData.destination?.length > 0;
  const fromInvalid = fromTouched && !isValidPlace(formData.from);
  const destInvalid = destTouched && !isValidPlace(formData.destination);

  const isValid =
    formData.from &&
    formData.destination &&
    isValidPlace(formData.from) &&
    isValidPlace(formData.destination) &&
    formData.startDate &&
    formData.endDate;

  return (
    <div>
      <div className="mb-6">
        <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1">
          {sub}
        </p>
        <h2 className="font-serif text-xl md:text-2xl font-black text-white">{title}</h2>
      </div>

      <div className="flex flex-col gap-4 md:gap-5">
        <InputField
          label={fromLabel}
          placeholder={fromPlaceholder}
          value={formData.from || ""}
          onChange={(e) => {
            const val = e.target.value.replace(
              /[0-9!@#$%^&*()_+=[\]{};:"\\|<>?/]/g,
              "",
            );
            updateForm({ from: val });
          }}
          invalid={fromInvalid}
          errorMsg={invalidPlaceError}
        />
        <InputField
          label={destLabel}
          placeholder={destPlaceholder}
          value={formData.destination}
          onChange={(e) => {
            const val = e.target.value.replace(
              /[0-9!@#$%^&*()_+=[\]{};:"\\|<>?/]/g,
              "",
            );
            updateForm({ destination: val });
          }}
          invalid={destInvalid}
          errorMsg={invalidPlaceError}
        />

        {/* Dates — stack on very small screens, grid on sm+ */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 md:gap-4">
          {[
            { label: startLabel, field: "startDate", min: today, max: maxDate },
            {
              label: endLabel,
              field: "endDate",
              min: formData.startDate || today,
              max: maxDate,
            },
          ].map(({ label, field, min, max }) => (
            <div key={field} className="flex flex-col gap-1.5">
              <label className="text-[10px] font-bold tracking-widest text-white/30 uppercase">
                {label}
              </label>
              <input
                type="date"
                min={min}
                max={max}
                value={formData[field]}
                onChange={(e) => updateForm({ [field]: e.target.value })}
                className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 min-h-12 text-sm text-white/85 focus:outline-none focus:border-amber-400/50 focus:bg-white/8 transition-all duration-200"
                style={{ colorScheme: "dark" }}
              />
            </div>
          ))}
        </div>
      </div>

      <button
        onClick={onNext}
        disabled={!isValid}
        className="mt-7 md:mt-8 w-full bg-amber-400 hover:bg-amber-300 disabled:opacity-30 disabled:cursor-not-allowed text-stone-900 py-3.5 min-h-13 rounded-xl font-bold text-sm transition-all hover:-translate-y-0.5 active:scale-[0.98]"
      >
        {nextBtn} →
      </button>
    </div>
  );
};

export default Step1;