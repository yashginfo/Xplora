// src/components/HotelsCard.jsx
const HotelsCard = ({ hotels, hotelPhotos }) => {
  if (!hotels || hotels.length === 0) return null;

  return (
    <div className="backdrop-blur-md bg-black/45 rounded-2xl border border-white/10 p-4 md:p-6 mb-4">

      {/* Header */}
      <div className="flex items-center justify-between mb-4 md:mb-5">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-amber-400/10 border border-amber-400/20 flex items-center justify-center shrink-0">
            <svg className="w-4 h-4 text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
            </svg>
          </div>
          <h3 className="font-serif text-sm font-semibold text-white">Live Hotels</h3>
        </div>
        <span className="text-[10px] font-bold uppercase tracking-widest px-2.5 py-1 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 shrink-0">
          Real Data
        </span>
      </div>

      {/* Hotel grid — 1 col on mobile, 2 cols on sm+ */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        {hotels.map((hotel, i) => (
          <div key={i} className="border border-white/8 rounded-xl overflow-hidden hover:border-white/15 transition-all duration-200 flex flex-col">
            {/* Image — taller on mobile so it's readable */}
            <div className="w-full h-36 sm:h-28 bg-white/4 shrink-0 overflow-hidden">
              {hotel.photo ? (
                <img
                  src={hotel.photo}
                  alt={hotel.name}
                  className="w-full h-full object-cover hover:scale-105 transition-transform duration-300"
                  onError={(e) => {
                    e.target.style.display = "none";
                    if (hotelPhotos?.[i % hotelPhotos.length]) {
                      e.target.parentNode.innerHTML = `<img src="${hotelPhotos[i % hotelPhotos.length].thumb}" class="w-full h-full object-cover" alt="hotel"/>`;
                    } else {
                      e.target.parentNode.innerHTML = `<div class="w-full h-full flex items-center justify-center"><svg class="w-8 h-8 opacity-20" fill="none" viewBox="0 0 24 24" stroke="white" stroke-width="1"><path stroke-linecap="round" stroke-linejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25"/></svg></div>`;
                    }
                  }}
                />
              ) : hotelPhotos?.[i % hotelPhotos.length] ? (
                <img src={hotelPhotos[i % hotelPhotos.length].thumb} alt="hotel" className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <svg className="w-8 h-8 text-white/15" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 12l8.954-8.955c.44-.439 1.152-.439 1.591 0L21.75 12M4.5 9.75v10.125c0 .621.504 1.125 1.125 1.125H9.75v-4.875c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21h4.125c.621 0 1.125-.504 1.125-1.125V9.75M8.25 21h8.25" />
                  </svg>
                </div>
              )}
            </div>

            <div className="p-3 flex flex-col gap-1.5 flex-1">
              <p className="font-medium text-white/85 text-xs leading-snug line-clamp-2">{hotel.name}</p>
              {hotel.address && (
                <p className="text-[10px] text-white/30 line-clamp-1 flex items-start gap-1">
                  <svg className="w-3 h-3 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
                  </svg>
                  <span className="line-clamp-1">{hotel.address}</span>
                </p>
              )}
              {hotel.price && hotel.price !== "N/A" && (
                <p className="font-serif text-sm font-bold text-amber-400 mt-auto">
                  {hotel.price}<span className="text-[10px] text-white/25 font-normal"> /night</span>
                </p>
              )}
              <div className="flex items-center justify-between mt-auto pt-1 flex-wrap gap-1">
                {hotel.rating && hotel.rating !== "N/A" && (
                  <div className="flex items-center gap-1">
                    <svg className="w-3 h-3 text-amber-400 fill-amber-400" viewBox="0 0 24 24">
                      <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
                    </svg>
                    <span className="text-[10px] text-white/50 font-semibold">{hotel.rating}</span>
                  </div>
                )}
                {hotel.num_reviews && hotel.num_reviews !== "0" && (
                  <span className="text-[10px] text-white/25">{hotel.num_reviews} reviews</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Hotel atmosphere photos */}
      {hotelPhotos?.length > 0 && (
        <div className="mt-4 md:mt-5">
          <p className="text-[10px] text-white/25 uppercase tracking-widest font-bold mb-2.5">Hotel Atmosphere</p>
          {/* 2 cols on mobile (fits better), 3 on sm+ */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
            {hotelPhotos.slice(0, 6).map((photo, i) => (
              <div key={i} className="rounded-lg overflow-hidden h-24">
                <img src={photo.thumb} alt={photo.alt || "hotel"} className="w-full h-full object-cover hover:scale-105 transition-transform duration-300" />
              </div>
            ))}
          </div>
        </div>
      )}

      <p className="text-[10px] text-white/20 mt-4 text-center">
        Live data from Xplora — prices may vary at time of booking.
      </p>
    </div>
  );
};

export default HotelsCard;