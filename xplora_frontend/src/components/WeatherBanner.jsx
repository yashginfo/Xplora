// src/components/WeatherBanner.jsx
const WeatherBanner = ({ weatherData }) => {
  if (!weatherData || !weatherData.has_bad_weather) return null;
  const badDays = weatherData.bad_weather_days || [];

  return (
    <div className="w-full mb-4">
      <div className="rounded-xl backdrop-blur-md bg-red-500/10 border border-red-500/30 p-4">
        <div className="flex items-start gap-3">
          <div className="w-8 h-8 rounded-lg bg-red-500/20 border border-red-500/30 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-red-400 uppercase tracking-widest mb-1">Weather Warning</p>
            <p className="text-sm text-white/70 leading-relaxed">
              Rough weather is expected at{" "}
              <span className="font-semibold text-white">{weatherData.location}</span>{" "}
              during your travel dates.
              {badDays.length > 0 && (
                <> Affected days: <span className="font-semibold text-red-300">{badDays.join(", ")}</span>.</>
              )}
            </p>
            <p className="text-xs text-white/30 mt-1.5">
              Consider adjusting your travel dates or plan indoor alternatives.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WeatherBanner;