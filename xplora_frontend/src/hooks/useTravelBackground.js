// src/hooks/useTravelBackground.js
import { useState, useEffect } from "react";

const UNSPLASH_ACCESS_KEY = import.meta.env.VITE_UNSPLASH_ACCESS_KEY;

const TRAVEL_QUERIES = [
  "mountain landscape travel",
  "tropical beach paradise",
  "ocean sunset horizon",
  "travel adventure road",
  "snow mountain peak",
  "island beach turquoise water",
  "forest hiking scenic",
  "desert dunes golden",
  "waterfall nature landscape",
  "coastal cliffs ocean",
  "lake reflection mountains",
  "santorini greece travel",
  "bali rice terraces",
  "northern lights aurora",
  "canyon rock formation",
  "mediterranean sea coast",
  "alpine meadow summer",
  "fjord norway scenic",
];

const FALLBACKS = [
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=1920&q=85",
  "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=1920&q=85",
  "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=1920&q=85",
  "https://images.unsplash.com/photo-1530521954074-e64f6810b32d?w=1920&q=85",
  "https://images.unsplash.com/photo-1469854523086-cc02fe5d8800?w=1920&q=85",
  "https://images.unsplash.com/photo-1519451241324-20b4ea2c4220?w=1920&q=85",
];

const getRandom = (arr) => arr[Math.floor(Math.random() * arr.length)];

/**
 * Fetches a genuinely random travel photo from Unsplash on every mount.
 * Returns { bgUrl, photographer, photographerUrl, loading }
 */
export function useTravelBackground() {
  const [bgUrl, setBgUrl]                     = useState(null);
  const [photographer, setPhotographer]       = useState("");
  const [photographerUrl, setPhotographerUrl] = useState("");
  const [loading, setLoading]                 = useState(true);

  useEffect(() => {
    let cancelled = false;

    const fetchImage = async () => {
      setLoading(true);
      const query     = getRandom(TRAVEL_QUERIES);
      const page      = Math.floor(Math.random() * 5) + 1;   // pages 1-5
      const pickIndex = Math.floor(Math.random() * 10);       // pick 1 of 10 results

      try {
        const res = await fetch(
          `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=10&page=${page}&orientation=landscape&content_filter=high`,
          { headers: { Authorization: `Client-ID ${UNSPLASH_ACCESS_KEY}` } }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        const data = await res.json();
        const results = data?.results ?? [];

        if (cancelled) return;

        if (results.length > 0) {
          const photo = results[Math.min(pickIndex, results.length - 1)];
          setBgUrl(photo.urls?.full ?? photo.urls?.regular);
          setPhotographer(photo.user?.name ?? "");
          setPhotographerUrl(photo.user?.links?.html ?? "");
        } else {
          throw new Error("empty results");
        }
      } catch (err) {
        if (!cancelled) {
          console.warn("[useTravelBackground] fallback:", err.message);
          setBgUrl(getRandom(FALLBACKS));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchImage();
    return () => { cancelled = true; };
  }, []);

  return { bgUrl, photographer, photographerUrl, loading };
}