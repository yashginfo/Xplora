// src/components/WeatherCard.jsx
const WeatherCard = ({ weatherData, tripStartDate, tripEndDate }) => {
  if (!weatherData) return null;

  const isEstimated = weatherData.is_ai_estimated;
  const current = weatherData.current;
  const forecast = weatherData.forecast || [];

  const formatDate = (dateStr) => {
    try {
      return new Date(dateStr).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" });
    } catch { return dateStr; }
  };

  const isTripDay = (dateStr) => {
    if (!tripStartDate || !tripEndDate) return false;
    try {
      const d = new Date(dateStr), start = new Date(tripStartDate), end = new Date(tripEndDate);
      return d >= start && d <= end;
    } catch { return false; }
  };

  return (
    <div className="backdrop-blur-md bg-white/10 rounded-2xl border border-white/10 p-4 md:p-6 mb-4">

      {/* Header */}
      <div className="flex justify-between items-center mb-4 md:mb-5">
        <div className="flex items-center gap-2.5 min-w-0">
          <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 15a4 4 0 004 4h9a5 5 0 10-.1-9.999 5.002 5.002 0 10-9.78 2.096A4.001 4.001 0 003 15z" />
            </svg>
          </div>
          <h3 className="font-serif text-sm font-semibold text-white truncate">
            Weather at {weatherData.location}
          </h3>
        </div>
        <span className={`text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full border shrink-0 ml-2
          ${isEstimated
            ? "bg-amber-400/10 text-amber-400 border-amber-400/25"
            : "bg-emerald-500/10 text-emerald-400 border-emerald-500/30"
          }`}
        >
          {isEstimated ? "AI Est." : "Live"}
        </span>
      </div>

      {/* Current weather */}
      {!isEstimated && current && (
        <div className="bg-white/4 border border-white/8 rounded-xl p-3 md:p-4 mb-4 md:mb-5">
          <div className="flex items-center gap-3 md:gap-4">
            <img src={`https:${current.icon}`} alt={current.condition} className="w-10 h-10 md:w-12 md:h-12 shrink-0" />
            <div className="min-w-0">
              <p className="font-serif text-2xl md:text-3xl font-bold text-white">{current.temp_c}°C</p>
              <p className="text-sm text-white/45 mt-0.5 truncate">{current.condition}</p>
            </div>
            {/* Stats — hide some on very small screens */}
            <div className="ml-auto text-right flex flex-col gap-1.5 shrink-0">
              {[
                { label: "Humidity",   value: `${current.humidity}%` },
                { label: "Wind",       value: `${current.wind_kph} km/h` },
                { label: "Feels like", value: `${current.feels_like_c}°C` },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-end gap-2">
                  <span className="text-[10px] text-white/25 hidden sm:inline">{item.label}</span>
                  <span className="text-xs text-white/65 font-medium">{item.value}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* 7-day forecast */}
      {!isEstimated && forecast.length > 0 && (
        <>
          <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold mb-2 md:mb-3">
            7-day forecast — trip days highlighted
          </p>
          {/* grid-cols-7 is intentional — 7 days side by side.
              On mobile we use very compact cells with minimal padding */}
          <div className="grid grid-cols-7 gap-0.5 md:gap-1">
            {forecast.map((day, i) => {
              const tripDay = isTripDay(day.date);
              return (
                <div
                  key={i}
                  className={`flex flex-col items-center rounded-lg md:rounded-xl p-1 md:p-2 text-center
                    ${tripDay
                      ? "bg-amber-400/12 border border-amber-400/30"
                      : "bg-white/3 border border-white/6"
                    }`}
                >
                  <p className={`text-[9px] md:text-[10px] font-bold mb-0.5 md:mb-1 ${tripDay ? "text-amber-400" : "text-white/30"}`}>
                    {/* Show only 2-letter day abbreviation on mobile */}
                    {formatDate(day.date).split(",")[0].slice(0, 2)}
                  </p>
                  <img src={`https:${day.icon}`} alt={day.condition} className="w-4 h-4 md:w-6 md:h-6 my-0.5 md:my-1" />
                  <p className="text-[10px] md:text-xs font-bold text-white/75">{Math.round(day.max_c)}°</p>
                  <p className="text-[9px] md:text-[10px] text-white/30">{Math.round(day.min_c)}°</p>
                  {day.rain_chance > 0 && (
                    <p className="text-[8px] md:text-[10px] text-sky-400 mt-0.5">{day.rain_chance}%</p>
                  )}
                </div>
              );
            })}
          </div>
        </>
      )}

      {/* Beyond 7 days notice */}
      {!isEstimated && !weatherData.within_forecast && (
        <div className="mt-4 bg-amber-400/8 border border-amber-400/20 rounded-xl px-4 py-3">
          <p className="text-xs text-amber-400 leading-relaxed">
            Forecasts are limited to 7 days for accuracy. Check back closer to your travel dates.
          </p>
        </div>
      )}

      {/* AI estimated note */}
      {isEstimated && (
        <div className="bg-amber-400/8 border border-amber-400/20 rounded-xl px-4 py-3">
          <p className="text-[10px] font-bold text-amber-400 uppercase tracking-widest mb-1.5">AI Estimated Weather</p>
          <p className="text-sm text-white/45 leading-relaxed font-light">
            {weatherData.ai_summary || "Live weather data is currently unavailable. The itinerary has been planned considering typical seasonal conditions."}
          </p>
        </div>
      )}
    </div>
  );
};

export default WeatherCard;