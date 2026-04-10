// src/components/TrainsCard.jsx
const TrainIcon = () => (
  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
  </svg>
);

const CardHeader = ({ isRealData = false }) => (
  <div className="flex items-center justify-between mb-4 md:mb-5">
    <div className="flex items-center gap-2.5">
      <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 shrink-0">
        <TrainIcon />
      </div>
      <h3 className="font-serif text-sm font-semibold text-white">
        {isRealData ? "Live Trains" : "Trains"}
      </h3>
    </div>
    {isRealData && (
      <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
        Real Data
      </span>
    )}
  </div>
);

const TrainsCard = ({ trains, notFeasibleMsg }) => {
  if (notFeasibleMsg) {
    return (
      <div className="backdrop-blur-md bg-black/45 rounded-2xl border border-white/10 p-4 md:p-6 mb-4">
        <CardHeader />
        <div className="bg-amber-400/8 border border-amber-400/20 rounded-xl px-4 py-3">
          <p className="text-sm text-amber-400 leading-relaxed">{notFeasibleMsg}</p>
        </div>
      </div>
    );
  }

  if (!trains || trains.length === 0) {
    return (
      <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/10 p-4 md:p-6 mb-4">
        <CardHeader />
        <div className="bg-white/3 border border-white/8 rounded-xl px-4 py-3 flex items-start gap-3">
          <svg className="w-4 h-4 text-white/20 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p className="text-sm text-white/55 font-medium">No direct trains found</p>
            <p className="text-xs text-white/30 mt-0.5">
              Check{" "}
              <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">
                irctc.co.in
              </a>{" "}
              for connecting trains or alternative routes.
            </p>
          </div>
        </div>
      </div>
    );
  }

  const howToReach = trains[0]?.howToReach;

  return (
    <div className="backdrop-blur-md bg-black/45 rounded-2xl border border-white/10 p-4 md:p-6 mb-4">
      <CardHeader isRealData />

      {howToReach && (
        <div className="bg-sky-500/10 border border-sky-500/20 rounded-xl px-4 py-2.5 mb-4 flex items-start gap-2">
          <svg className="w-3.5 h-3.5 text-sky-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
          </svg>
          <p className="text-xs text-sky-400 leading-relaxed">{howToReach}</p>
        </div>
      )}

      {/* Route info — wrap on mobile so station names don't overflow */}
      <div className="bg-white/4 border border-white/8 rounded-xl px-4 py-4 mb-4">
        <div className="flex items-center justify-between gap-2">
          {/* Origin */}
          <div className="text-center min-w-0 flex-1">
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">From</p>
            <p className="font-serif text-lg md:text-xl font-bold text-white">{trains[0]?.origin_code || ""}</p>
            <p className="text-[10px] text-white/35 truncate mt-0.5 max-w-full">{trains[0]?.origin || ""}</p>
          </div>

          {/* Arrow */}
          <div className="flex flex-col items-center gap-1 shrink-0 px-2">
            <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
            </svg>
            <div className="w-8 md:w-16 h-px bg-white/10" />
          </div>

          {/* Destination */}
          <div className="text-center min-w-0 flex-1">
            <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">To</p>
            <p className="font-serif text-lg md:text-xl font-bold text-white">{trains[0]?.dest_code || ""}</p>
            <p className="text-[10px] text-white/35 truncate mt-0.5 max-w-full">{trains[0]?.destination || ""}</p>
          </div>
        </div>
      </div>

      {/* Train cards */}
      <div className="flex flex-col gap-2.5">
        {trains.map((train, i) => (
          <div key={i} className="border border-white/8 rounded-xl p-4 hover:border-white/15 hover:bg-white/3 transition-all duration-200">
            <div className="flex items-center justify-between mb-3 gap-2">
              <div className="min-w-0">
                <p className="font-medium text-white/80 text-sm truncate">{train.name || "N/A"}</p>
                <p className="text-[10px] text-white/25 mt-0.5">#{train.number || ""}</p>
              </div>
              {train.classes && train.classes !== "N/A" && (
                <span className="text-[10px] bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-2 py-1 rounded-full font-bold shrink-0">
                  {train.classes}
                </span>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="text-center">
                <p className="font-serif font-bold text-white text-base">{train.departure || "N/A"}</p>
                <p className="text-[10px] text-white/25 mt-0.5">Dep</p>
              </div>
              <div className="flex flex-col items-center flex-1 px-2 md:px-4">
                <p className="text-[10px] text-white/30 mb-1">{train.duration || ""}</p>
                <div className="w-full h-px bg-white/10 relative">
                  <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/20 rounded-full" />
                </div>
                <p className="text-[10px] text-white/25 mt-1">Duration</p>
              </div>
              <div className="text-center">
                <p className="font-serif font-bold text-white text-base">{train.arrival || "N/A"}</p>
                <p className="text-[10px] text-white/25 mt-0.5">Arr</p>
              </div>
            </div>

            {train.runs_on?.length > 0 && (
              <div className="flex flex-wrap gap-1 mt-3">
                {["Mon","Tue","Wed","Thu","Fri","Sat","Sun"].map((day, idx) => (
                  <span key={idx} className={`text-[10px] px-2 py-0.5 rounded-full font-bold ${
                    train.runs_on[idx] === "Y"
                      ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20"
                      : "bg-white/3 text-white/20 border border-white/6"
                  }`}>
                    {day}
                  </span>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <p className="text-[10px] text-white/20 mt-3 text-center">
        Live train data — check{" "}
        <a href="https://www.irctc.co.in" target="_blank" rel="noopener noreferrer" className="text-amber-400 hover:text-amber-300 underline">
          irctc.co.in
        </a>{" "}
        for booking.
      </p>
    </div>
  );
};

export default TrainsCard;