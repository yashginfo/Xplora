import os
import httpx
import asyncio

UNSPLASH_KEYS = [
    os.environ.get("UNSPLASH_ACCESS_KEY"),
    os.environ.get("UNSPLASH_ACCESS_KEY_2"),
    os.environ.get("UNSPLASH_ACCESS_KEY_3"),
]
UNSPLASH_KEYS = [k for k in UNSPLASH_KEYS if k]


async def _fetch_photos_for_query(query: str, count: int, key: str) -> list:
    """
    Internal helper — fetch photos for a single query with a single key.
    Returns list of photo objects or empty list.
    """
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                "https://api.unsplash.com/search/photos",
                headers={"Authorization": f"Client-ID {key}"},
                params={
                    "query": query,
                    "per_page": count,
                    "orientation": "landscape",
                    "content_filter": "high",
                },
                timeout=10.0
            )
            data = response.json()
            results = data.get("results", [])
            photos = []
            for p in results:
                photos.append({
                    "url": p.get("urls", {}).get("regular", ""),
                    "thumb": p.get("urls", {}).get("small", ""),
                    "alt": p.get("alt_description", query),
                    "photographer": p.get("user", {}).get("name", ""),
                    "photographer_url": p.get("user", {}).get("links", {}).get("html", ""),
                })
            return photos
    except Exception as e:
        print(f"[Photos] Query '{query}' failed: {e}")
        return []


async def fetch_destination_photos(destination: str, count: int = 5) -> list:
    """
    Fetch beautiful destination photos from Unsplash.
    Returns list of photo URLs or empty list if fails.
    """
    for key in UNSPLASH_KEYS:
        try:
            photos = await _fetch_photos_for_query(
                f"{destination} travel", count, key
            )
            if photos:
                print(f"[Photos] Found {len(photos)} destination photos for {destination}")
                return photos
        except Exception as e:
            print(f"[Photos] Destination key failed: {e} — trying next key")
            continue

    print(f"[Photos] All destination keys exhausted for {destination}")
    return []


async def fetch_hotel_photos(destination: str) -> list:
    """
    Fetch hotel atmosphere photos from Unsplash.
    Tries 3 queries in order: hotel → resort → luxury hotel
    Returns up to 6 photos total (2 per query).
    """
    queries = [
        f"{destination} hotel",
        f"{destination} resort",
        "luxury hotel interior",
    ]

    all_photos = []

    for key in UNSPLASH_KEYS:
        try:
            # Run all 3 queries in parallel
            results = await asyncio.gather(
                *[_fetch_photos_for_query(q, 2, key) for q in queries],
                return_exceptions=True
            )

            for result in results:
                if isinstance(result, list):
                    all_photos.extend(result)

            # Remove duplicates by URL
            seen = set()
            unique_photos = []
            for p in all_photos:
                if p["url"] not in seen and p["url"]:
                    seen.add(p["url"])
                    unique_photos.append(p)

            if unique_photos:
                print(f"[Photos] Found {len(unique_photos)} hotel photos for {destination}")
                return unique_photos[:6]

        except Exception as e:
            print(f"[Photos] Hotel photos key failed: {e} — trying next key")
            continue

    print(f"[Photos] All hotel photo keys exhausted")
    return []