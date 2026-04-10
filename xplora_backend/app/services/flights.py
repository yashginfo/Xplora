# # app/services/flights.py
# import os
# import re
# import httpx
# import asyncio
# from groq import Groq

# RAPIDAPI_KEYS = [
#     os.environ.get("RAPIDAPI_KEY"),
#     os.environ.get("RAPIDAPI_KEY_2"),
#     os.environ.get("RAPIDAPI_KEY_3"),
# ]
# RAPIDAPI_KEYS = [k for k in RAPIDAPI_KEYS if k]
# groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))


# # ── AI City Resolver ──────────────────────────────────────────────────────────
# async def resolve_airport_with_ai(city: str) -> str:
#     prompt = f"""You are an aviation expert.
# The user wants to find flights from/to: "{city}"
# Return ONLY the city name or airport name best suited for airport search.
# Examples:
# "Mumbai" → "Mumbai"
# "New Delhi" → "Delhi"
# "Bengaluru" → "Bangalore"
# "New York" → "New York"
# "Agra" → "Agra"
# No explanation, just the search term.
# Now resolve: "{city}"
# """
#     try:
#         response = await asyncio.get_event_loop().run_in_executor(
#             None,
#             lambda: groq_client.chat.completions.create(
#                 model="llama-3.3-70b-versatile",
#                 messages=[{"role": "user", "content": prompt}],
#                 temperature=0.1,
#                 max_tokens=15,
#             )
#         )
#         result = response.choices[0].message.content.strip()
#         print(f"[Flights] AI resolved '{city}' → '{result}'")
#         return result
#     except Exception as e:
#         print(f"[Flights] AI resolution failed: {e} — using original")
#         return city


# # ── Smart airport selector ────────────────────────────────────────────────────
# def _pick_best_airport(results: list) -> dict | None:
#     """
#     Prefer real airports (3-letter IATA skyId like BOM, DEL, AGR)
#     over metro/region entities (IBOM, IDEL, NYCA etc.)
#     """
#     if not results:
#         return None

#     # Priority 1 — exact 3-letter IATA code
#     for r in results:
#         if re.fullmatch(r"[A-Z]{3}", r.get("skyId", "")):
#             return r

#     # Priority 2 — entityType AIRPORT in navigation block
#     for r in results:
#         nav = r.get("navigation", {})
#         if isinstance(nav, dict) and nav.get("entityType", "").upper() == "AIRPORT":
#             return r

#     # Priority 3 — fallback to first result
#     return results[0]


# # ── Airport search ────────────────────────────────────────────────────────────
# async def search_airport(query: str, key: str) -> tuple:
#     """
#     Returns (skyId, entityId, cityName) or raises RATE_LIMITED / returns (None, None, None)
#     """
#     try:
#         async with httpx.AsyncClient() as client:
#             response = await client.get(
#                 "https://sky-scrapper.p.rapidapi.com/api/v1/flights/searchAirport",
#                 headers={
#                     "x-rapidapi-host": "sky-scrapper.p.rapidapi.com",
#                     "x-rapidapi-key":  key,
#                 },
#                 params={"query": query, "locale": "en-US"},
#                 timeout=10.0,
#             )

#             # ── 429 = rate limited
#             if response.status_code == 429:
#                 print(f"[Flights] 429 on searchAirport for '{query}' — key exhausted")
#                 raise ValueError("RATE_LIMITED")

#             data    = response.json()
#             results = data.get("data", [])

#             if not results:
#                 print(f"[Flights] No airport found for '{query}'")
#                 return None, None, None

#             airport   = _pick_best_airport(results)
#             sky_id    = airport.get("skyId")
#             entity_id = airport.get("entityId")
#             city_name = airport.get("presentation", {}).get("title", query)

#             print(f"[Flights] Airport selected: {city_name} — skyId={sky_id}, entityId={entity_id}")
#             return sky_id, entity_id, city_name

#     except ValueError:
#         raise
#     except Exception as e:
#         print(f"[Flights] Airport search failed for '{query}': {e}")
#         return None, None, None


# # ── Main fetch function ───────────────────────────────────────────────────────
# async def fetch_flights(origin: str, destination: str, date: str) -> list:
#     try:
#         origin      = origin.strip().title()
#         destination = destination.strip().title()

#         # Resolve city names via AI
#         origin_query = await resolve_airport_with_ai(origin)
#         dest_query   = await resolve_airport_with_ai(destination)

#         for key in RAPIDAPI_KEYS:
#             try:
#                 # Get skyId + entityId for both airports
#                 origin_sky_id, origin_entity_id, origin_city = await search_airport(origin_query, key)
#                 dest_sky_id,   dest_entity_id,   dest_city   = await search_airport(dest_query,   key)

#                 if not origin_sky_id or not dest_sky_id:
#                     print(f"[Flights] Could not resolve airports for {origin} → {destination}")
#                     # Not a rate limit — no point trying other keys for missing airports
#                     return []

#                 # Guard: same skyId on both sides = bad resolution
#                 if origin_sky_id == dest_sky_id:
#                     print(f"[Flights] Both sides resolved to same skyId ({origin_sky_id}) — skipping")
#                     return []

#                 print(f"[Flights] Searching {origin_sky_id} → {dest_sky_id} on {date}")

#                 # Search flights
#                 async with httpx.AsyncClient() as client:
#                     response = await client.get(
#                         "https://sky-scrapper.p.rapidapi.com/api/v2/flights/searchFlights",
#                         headers={
#                             "x-rapidapi-host": "sky-scrapper.p.rapidapi.com",
#                             "x-rapidapi-key":  key,
#                         },
#                         params={
#                             "originSkyId":         origin_sky_id,
#                             "destinationSkyId":    dest_sky_id,
#                             "originEntityId":      origin_entity_id,
#                             "destinationEntityId": dest_entity_id,
#                             "date":                date,
#                             "cabinClass":          "economy",
#                             "adults":              "1",
#                             "sortBy":              "best",
#                             "currency":            "INR",
#                             "market":              "en-US",
#                             "countryCode":         "IN",
#                         },
#                         timeout=20.0,
#                     )

#                     # ── 429 on the flights search itself
#                     if response.status_code == 429:
#                         print(f"[Flights] 429 on searchFlights — key exhausted, trying next")
#                         await asyncio.sleep(0.5)
#                         continue

#                     data        = response.json()
#                     itineraries = data.get("data", {}).get("itineraries", [])

#                     if not itineraries:
#                         print(f"[Flights] No itineraries for {origin_sky_id} → {dest_sky_id}")
#                         return []

#                     flights = []
#                     for f in itineraries[:5]:
#                         legs = f.get("legs", [])
#                         if not legs:
#                             continue
#                         leg          = legs[0]
#                         price        = f.get("price", {}).get("formatted", "N/A")
#                         marketing    = leg.get("carriers", {}).get("marketing", [{}])
#                         airline_info = marketing[0] if marketing else {}

#                         flights.append({
#                             "airline":      airline_info.get("name", "N/A"),
#                             "airline_logo": airline_info.get("logoUrl", ""),
#                             "origin":       origin_city or origin,
#                             "destination":  dest_city or destination,
#                             "origin_code":  origin_sky_id,
#                             "dest_code":    dest_sky_id,
#                             "departure":    leg.get("departure", ""),
#                             "arrival":      leg.get("arrival", ""),
#                             "duration":     leg.get("durationInMinutes", 0),
#                             "stops":        leg.get("stopCount", 0),
#                             "price":        price,
#                         })

#                     print(f"[Flights] Found {len(flights)} flights")
#                     return flights

#             except ValueError as ve:
#                 if str(ve) == "RATE_LIMITED":
#                     print(f"[Flights] Key rate limited — trying next key")
#                     await asyncio.sleep(0.5)
#                     continue
#                 raise
#             except Exception as e:
#                 print(f"[Flights] Key failed: {e} — trying next key")
#                 continue

#         print("[Flights] All keys exhausted")
#         return []

#     except Exception as e:
#         print(f"[Flights] Failed: {e}")
#         return []