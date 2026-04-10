import os
import httpx
import asyncio
from groq import Groq

RAPIDAPI_KEYS = [
    os.environ.get("RAPIDAPI_KEY"),
    os.environ.get("RAPIDAPI_KEY_2"),
    os.environ.get("RAPIDAPI_KEY_3"),
]
RAPIDAPI_KEYS = [k for k in RAPIDAPI_KEYS if k]
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


async def resolve_city_with_ai(destination: str) -> str:
    prompt = f"""You are a geography expert.

The user wants to find hotels in: "{destination}"

Your job: Return the single best city name for hotel search.

Rules:
- Return ONLY the city name (e.g. "Gulmarg" or "Paris" or "Bali")
- No country, no explanation, no extra text
- If destination is a region → return its most popular city
- If destination is already a city → return it as is

Examples:
"Kashmir" → "Srinagar"
"Goa" → "Panaji"
"Ladakh" → "Leh"
"Paris" → "Paris"
"Bali" → "Kuta"
"Rajasthan" → "Jaipur"

Now resolve: "{destination}"
"""
    try:
        response = await asyncio.get_event_loop().run_in_executor(
            None,
            lambda: groq_client.chat.completions.create(
                model="llama-3.3-70b-versatile",
                messages=[{"role": "user", "content": prompt}],
                temperature=0.1,
                max_tokens=20,
            )
        )
        resolved = response.choices[0].message.content.strip()
        print(f"[Hotels] AI resolved '{destination}' → '{resolved}'")
        return resolved
    except Exception as e:
        print(f"[Hotels] AI resolution failed: {e} — using original")
        return destination


async def fetch_hotels(destination: str, check_in: str, check_out: str) -> list:
    try:
        city = await resolve_city_with_ai(destination)

        for key in RAPIDAPI_KEYS:
            try:
                async with httpx.AsyncClient() as client:
                    # Step 1 — Get location ID
                    location_response = await client.get(
                        "https://travel-advisor.p.rapidapi.com/locations/search",
                        headers={
                            "x-rapidapi-host": "travel-advisor.p.rapidapi.com",
                            "x-rapidapi-key": key
                        },
                        params={
                            "query": city,
                            "limit": "1",
                            "offset": "0",
                            "units": "km",
                            "currency": "INR",
                            "lang": "en_US"
                        },
                        timeout=10.0
                    )
                    location_data = location_response.json()
                    results = location_data.get("data", [])
                    if not results:
                        print(f"[Hotels] No location found for {city}")
                        return []

                    location_id = results[0].get("result_object", {}).get("location_id")
                    if not location_id:
                        return []

                    print(f"[Hotels] Location ID for {city}: {location_id}")

                    # Step 2 — Get hotels
                    hotels_response = await client.get(
                        "https://travel-advisor.p.rapidapi.com/hotels/list",
                        headers={
                            "x-rapidapi-host": "travel-advisor.p.rapidapi.com",
                            "x-rapidapi-key": key
                        },
                        params={
                            "location_id": location_id,
                            "adults": "1",
                            "rooms": "1",
                            "nights": "2",
                            "offset": "0",
                            "currency": "INR",
                            "order": "asc",
                            "limit": "5",
                            "sort": "recommended",
                            "lang": "en_US"
                        },
                        timeout=10.0
                    )
                    hotels_data = hotels_response.json()
                    raw_hotels = hotels_data.get("data", [])

                    hotels = []
                    for h in raw_hotels:
                        if not h.get("name"):
                            continue
                        hotels.append({
                            "name": h.get("name", ""),
                            "rating": h.get("rating", "N/A"),
                            "price": h.get("price", "N/A"),
                            "hotel_class": h.get("hotel_class", ""),
                            "photo": h.get("photo", {}).get("images", {}).get("medium", {}).get("url", ""),
                            "url": f"https://www.tripadvisor.com{h.get('web_url', '')}",
                            "address": h.get("address", ""),
                            "num_reviews": h.get("num_reviews", "0"),
                        })

                    print(f"[Hotels] Found {len(hotels)} hotels for {city}")
                    return hotels

            except Exception as e:
                print(f"[Hotels] Key failed: {e} — trying next key")
                continue

        print(f"[Hotels] All keys exhausted")
        return []

    except Exception as e:
        print(f"[Hotels] Failed: {e}")
        return []