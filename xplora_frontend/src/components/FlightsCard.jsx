// // src/components/FlightsCard.jsx
// const FlightsCard = ({ flights }) => {
//   if (!flights || flights.length === 0) return null;

//   const formatDuration = (minutes) => {
//     if (!minutes) return "N/A";
//     const h = Math.floor(minutes / 60);
//     const m = minutes % 60;
//     return `${h}h ${m}m`;
//   };

//   const formatTime = (dateStr) => {
//     if (!dateStr) return "N/A";
//     try {
//       return new Date(dateStr).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
//     } catch { return dateStr; }
//   };

//   const formatDate = (dateStr) => {
//     if (!dateStr) return "";
//     try {
//       return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
//     } catch { return ""; }
//   };

//   return (
//     <div className="backdrop-blur-md bg-black/45 rounded-2xl border border-white/10 p-6 mb-4">

//       {/* Header */}
//       <div className="flex items-center justify-between mb-5">
//         <div className="flex items-center gap-2.5">
//           <div className="w-8 h-8 rounded-lg bg-sky-500/10 border border-sky-500/20 flex items-center justify-center">
//             <svg className="w-4 h-4 text-sky-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
//             </svg>
//           </div>
//           <h3 className="font-serif text-sm font-semibold text-white">Live Flights</h3>
//         </div>
//         <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30">
//           Real Data
//         </span>
//       </div>

//       {/* Route info */}
//       <div className="bg-white/4 border border-white/8 rounded-xl px-5 py-4 mb-4 flex items-center justify-between">
//         {[
//           { dir: "From", code: flights[0]?.origin_code, name: flights[0]?.origin },
//           { dir: "To",   code: flights[0]?.dest_code,   name: flights[0]?.destination },
//         ].map((loc, i) => (
//           <div key={i} className="text-center">
//             <p className="text-[10px] text-white/25 uppercase tracking-widest mb-1">{loc.dir}</p>
//             <p className="font-serif text-xl font-bold text-white">{loc.code || ""}</p>
//             <p className="text-[10px] text-white/35 truncate max-w-20 mt-0.5">{loc.name || ""}</p>
//           </div>
//         )).reduce((acc, el, i) => i === 0 ? [el] : [...acc,
//           <div key="arrow" className="flex flex-col items-center gap-1">
//             <svg className="w-5 h-5 text-white/20" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//               <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 8.25L21 12m0 0l-3.75 3.75M21 12H3" />
//             </svg>
//             <div className="w-16 h-px bg-white/10" />
//           </div>, el], [])}
//       </div>

//       {/* Flight cards */}
//       <div className="flex flex-col gap-2.5">
//         {flights.map((flight, i) => (
//           <div key={i} className="border border-white/8 rounded-xl p-4 hover:border-white/15 hover:bg-white/3 transition-all duration-200">
//             <div className="flex items-center justify-between mb-3">
//               <div className="flex items-center gap-2.5">
//                 {flight.airline_logo ? (
//                   <img src={flight.airline_logo} alt={flight.airline} className="w-6 h-6 object-contain rounded" onError={(e) => (e.target.style.display = "none")} />
//                 ) : (
//                   <div className="w-6 h-6 rounded bg-white/8 flex items-center justify-center">
//                     <svg className="w-3.5 h-3.5 text-white/25" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
//                       <path strokeLinecap="round" strokeLinejoin="round" d="M6 12L3.269 3.126A59.768 59.768 0 0121.485 12 59.77 59.77 0 013.27 20.876L5.999 12zm0 0h7.5" />
//                     </svg>
//                   </div>
//                 )}
//                 <p className="font-medium text-white/80 text-sm">{flight.airline || "N/A"}</p>
//               </div>
//               <span className="font-serif text-sm font-bold text-amber-400">{flight.price || "N/A"}</span>
//             </div>

//             <div className="flex items-center justify-between">
//               {[
//                 { time: formatTime(flight.departure), date: formatDate(flight.departure) },
//                 { time: formatTime(flight.arrival),   date: formatDate(flight.arrival) },
//               ].reduce((acc, el, i) => i === 0 ? [
//                 <div key={0} className="text-center">
//                   <p className="font-serif font-bold text-white text-base">{el.time}</p>
//                   <p className="text-[10px] text-white/25 mt-0.5">{el.date}</p>
//                 </div>
//               ] : [...acc,
//                 <div key="mid" className="flex flex-col items-center flex-1 px-4">
//                   <p className="text-[10px] text-white/30 mb-1">{formatDuration(flight.duration)}</p>
//                   <div className="w-full h-px bg-white/10 relative">
//                     <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-1.5 bg-white/20 rounded-full" />
//                   </div>
//                   <p className="text-[10px] text-white/25 mt-1">
//                     {flight.stops === 0 ? "Non-stop" : `${flight.stops} stop${flight.stops > 1 ? "s" : ""}`}
//                   </p>
//                 </div>,
//                 <div key={1} className="text-center">
//                   <p className="font-serif font-bold text-white text-base">{el.time}</p>
//                   <p className="text-[10px] text-white/25 mt-0.5">{el.date}</p>
//                 </div>
//               ], [])}
//             </div>
//           </div>
//         ))}
//       </div>

//       <p className="text-[10px] text-white/20 mt-3 text-center">
//         Live flight data — prices change frequently. Book directly with airline.
//       </p>
//     </div>
//   );
// };

// export default FlightsCard;