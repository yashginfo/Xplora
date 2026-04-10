// src/components/LoadingSpinner.jsx
import useTranslate from "../hooks/useTranslate";

const LoadingSpinner = () => {
  const [planningText, tagline] = useTranslate([
    "Planning your trip...",
    "Travel more, worry less",
  ]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-8"
      style={{
        backgroundImage:
          "url('https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=1920&q=85')",
        backgroundSize: "cover",
        backgroundPosition: "center 35%",
        // ❌ removed backgroundAttachment: "fixed" — breaks on iOS Safari
        // The fixed positioning of the container itself achieves the same visual
      }}
    >
      {/* Cinematic overlay */}
      <div className="absolute inset-0" style={{ background: "linear-gradient(to bottom, rgba(0,0,0,0.70), rgba(0,0,0,0.50), rgba(0,0,0,0.80))" }} />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 px-6 text-center">
        {/* Spinner ring */}
        <div className="relative w-20 h-20">
          <div className="absolute inset-0 rounded-full border-2 border-white/8" />
          <div className="absolute inset-0 rounded-full border-2 border-amber-400 border-t-transparent animate-spin" />
          <div
            className="absolute inset-2 rounded-full border border-amber-400/25 border-b-transparent animate-spin"
            style={{ animationDirection: "reverse", animationDuration: "1.5s" }}
          />
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
          </div>
        </div>

        {/* Text */}
        <div className="space-y-2">
          <p className="font-serif text-white text-xl font-bold">
            {planningText}
          </p>
          <p className="text-white/40 text-sm tracking-widest uppercase">
            {tagline}
          </p>
        </div>

        {/* Progress dots */}
        <div className="flex items-center gap-1.5">
          {[0, 1, 2, 3].map((i) => (
            <div
              key={i}
              className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-pulse"
              style={{ animationDelay: `${i * 0.15}s` }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;