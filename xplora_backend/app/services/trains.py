import os
import httpx
import asyncio
from groq import Groq

# ── API Keys ───────────────────────────────────────────────
# Trains get their own dedicated key slot first to avoid
# sharing with Hotels/Flights and hitting rate limits.
# Priority: RAPIDAPI_TRAINS_KEY → RAPIDAPI_KEY_3 → RAPIDAPI_KEY_2 → RAPIDAPI_KEY
RAPIDAPI_KEYS = [
    os.environ.get("RAPIDAPI_TRAINS_KEY"),
    os.environ.get("RAPIDAPI_KEY_3"),
    os.environ.get("RAPIDAPI_KEY_2"),
    os.environ.get("RAPIDAPI_KEY"),
]
RAPIDAPI_KEYS = [k for k in RAPIDAPI_KEYS if k]

groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))

# ── API hosts (Indian Railways) ────────────────────────────
PRIMARY_HOST  = "indian-railway-irctc.p.rapidapi.com"
FALLBACK_HOST = "irctc1.p.rapidapi.com"


# ── AI: Resolve city → station name + code ────────────────
async def resolve_station_with_ai(city: str, country: str) -> tuple[str | None, str | None]:
    """
    Resolves the nearest major railway station for `city` in `country`.
    The country context lets the AI return the correct coding format
    (Indian codes, European codes, Japanese codes, etc.)
    """
    prompt = f"""You are a railway expert for {country}.

Find the nearest major railway station for the city: "{city}" in {country}.

Return ONLY this exact format — no explanation, no extra text:
STATION_CODE|Station Full Name

Examples for India:
NDLS|New Delhi
AGC|Agra Cantt
BCT|Mumbai Central
SBC|KSR Bangalore City

Examples for Japan:
TYO|Tokyo Station
OSA|Osaka Station

Examples for UK:
EUS|London Euston
MAN|Manchester Piccadilly

Examples for Germany:
BLS|Berlin Hauptbahnhof
MHB|Munich Hauptbahnhof

Rules:
- Use the standard station code for that country's rail network
- If the city IS a station → use that station
- If multiple stations in the city → use the main/central one
- If no station in city → use nearest major one

Resolve: "{city}" in {country}
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
        result = response.choices[0].message.content.strip()
        if "|" not in result:
            print(f"[Trains] AI bad format for '{city}' in {country}: {result}")
            return None, None
        code, name = result.split("|", 1)
        code = code.strip().upper()
        name = name.strip()
        print(f"[Trains] AI resolved '{city}' ({country}) → {code} ({name})")
        return code, name
    except Exception as e:
        print(f"[Trains] AI resolution failed for '{city}': {e}")
        return None, None


# ── Search station by city name (primary API) ──────────────
async def search_station_primary(city_name: str, key: str) -> tuple[str | None, str | None]:
    """
    Pass the city name — NOT a station code — to the search endpoint.
    The API expects human-readable strings like "New Delhi", not "NDLS".
    """
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://{PRIMARY_HOST}/api/v1/searchStation",
                headers={
                    "x-rapidapi-host": PRIMARY_HOST,
                    "x-rapidapi-key": key,
                },
                params={"query": city_name},
                timeout=10.0,
            )
            data = resp.json()
            stations = data.get("data", [])
            if not stations:
                print(f"[Trains][Primary] No station found for '{city_name}'")
                return None, None
            s = stations[0]
            code = s.get("station_code", "").strip().upper()
            name = s.get("station_name", city_name)
            print(f"[Trains][Primary] '{city_name}' → {code} ({name})")
            return code, name
    except Exception as e:
        print(f"[Trains][Primary] searchStation failed for '{city_name}': {e}")
        return None, None


# ── Search station by city name (fallback API) ─────────────
async def search_station_fallback(city_name: str, key: str) -> tuple[str | None, str | None]:
    try:
        async with httpx.AsyncClient() as client:
            resp = await client.get(
                f"https://{FALLBACK_HOST}/api/v1/searchStation",
                headers={
                    "x-rapidapi-host": FALLBACK_HOST,
                    "x-rapidapi-key": key,
                },
                params={"query": city_name},
                timeout=10.0,
            )
            data = resp.json()
            stations = data.get("data", [])
            if not stations:
                return None, None
            s = stations[0]
            code = s.get("station_code", "").strip().upper()
            name = s.get("station_name", city_name)
            print(f"[Trains][Fallback] '{city_name}' → {code} ({name})")
            return code, name
    except Exception as e:
        print(f"[Trains][Fallback] searchStation failed for '{city_name}': {e}")
        return None, None


# ── Full station resolution chain ──────────────────────────
async def resolve_station(city: str, country: str, key: str) -> tuple[str | None, str | None]:
    """
    Resolution order:
    1. Primary API search  (city name)
    2. Fallback API search (city name)
    3. AI as last resort   (with country context for correct code format)
    """
    code, name = await search_station_primary(city, key)
    if code:
        return code, name

    code, name = await search_station_fallback(city, key)
    if code:
        return code, name

    code, name = await resolve_station_with_ai(city, country)
    return code, name


# ── Parse raw train response ───────────────────────────────
def _parse_trains(
    data: dict,
    origin_code: str, dest_code: str,
    origin_name: str, dest_name: str,
) -> list:
    raw = data.get("data", [])
    if not isinstance(raw, list):
        return []
    trains = []
    for t in raw[:5]:
        trains.append({
            "name":        t.get("train_name", "N/A"),
            "number":      t.get("train_number", "N/A"),
            "origin":      origin_name,
            "destination": dest_name,
            "origin_code": origin_code,
            "dest_code":   dest_code,
            "departure":   t.get("from_std", "N/A"),
            "arrival":     t.get("to_std", "N/A"),
            "duration":    t.get("duration", "N/A"),
            "classes":     t.get("train_type", "N/A"),
            "runs_on":     t.get("run_days", []),
        })
    return trains


# ── Fetch trains (primary host) ────────────────────────────
async def fetch_trains_primary(
    origin_code: str, dest_code: str,
    origin_name: str, dest_name: str,
    date: str, key: str,
) -> list:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://{PRIMARY_HOST}/api/v3/trainBetweenStations",
            headers={
                "x-rapidapi-host": PRIMARY_HOST,
                "x-rapidapi-key": key,
            },
            params={
                "fromStationCode": origin_code,
                "toStationCode":   dest_code,
                "dateOfJourney":   date,
            },
            timeout=15.0,
        )
        data = resp.json()
        print(f"[Trains][Primary] Status {resp.status_code}")
        return _parse_trains(data, origin_code, dest_code, origin_name, dest_name)


# ── Fetch trains (fallback host) ───────────────────────────
async def fetch_trains_fallback(
    origin_code: str, dest_code: str,
    origin_name: str, dest_name: str,
    date: str, key: str,
) -> list:
    async with httpx.AsyncClient() as client:
        resp = await client.get(
            f"https://{FALLBACK_HOST}/api/v3/trainBetweenStations",
            headers={
                "x-rapidapi-host": FALLBACK_HOST,
                "x-rapidapi-key": key,
            },
            params={
                "fromStationCode": origin_code,
                "toStationCode":   dest_code,
                "dateOfJourney":   date,
            },
            timeout=15.0,
        )
        data = resp.json()
        print(f"[Trains][Fallback] Status {resp.status_code}")
        return _parse_trains(data, origin_code, dest_code, origin_name, dest_name)


# ── Build howToReach note ──────────────────────────────────
def build_how_to_reach(actual_origin: str, station_name: str, station_code: str) -> str | None:
    """
    If the resolved departure station is in a different city than what the
    user typed, return a contextual note explaining how to get there.
    e.g. "Noida" resolved to "New Delhi" → add note
         "Mumbai" resolved to "Mumbai Central" → same city, skip
    """
    origin_words = [w for w in actual_origin.lower().split() if len(w) > 3]
    if any(w in station_name.lower() for w in origin_words):
        return None
    return (
        f"Your nearest departure station is {station_name} ({station_code}). "
        f"From {actual_origin}, reach {station_name} by local transport "
        f"(cab, metro, or bus) before your train departs."
    )


# ── Main entry point ───────────────────────────────────────
async def fetch_trains(
    origin: str,
    destination: str,
    date: str,
    rail_feasible: bool = True,
    rail_country: str = "India",
    no_rail_reason: str = "",
) -> list | dict:
    """
    All intelligence comes from classify_trip_with_ai — no static lists here.

    Args:
        rail_feasible  : False if AI says trains aren't practical for this route
        rail_country   : Country AI identified (drives station code format + resolution)
        no_rail_reason : Human-readable reason AI gave (shown to user if not feasible)

    Returns:
        list[dict]  — train results (possibly empty list if none found)
        dict        — {"not_feasible": True, "message": "..."} when AI says no trains
    """

    # ── AI said trains aren't practical for this route ─────
    if not rail_feasible:
        msg = no_rail_reason or (
            "Train search isn't available for this route. "
            "Please check flights or local transport options instead."
        )
        print(f"[Trains] Skipped — AI said not feasible: {msg}")
        return {"not_feasible": True, "message": msg}

    if not RAPIDAPI_KEYS:
        print("[Trains] No RapidAPI keys configured.")
        return []

    formatted_date = date.replace("-", "")
    print(f"[Trains] Searching: {origin} → {destination} on {formatted_date} [{rail_country}]")

    key = RAPIDAPI_KEYS[0]

    # ── Resolve both stations (country-aware) ──────────────
    origin_code, origin_name = await resolve_station(origin, rail_country, key)
    dest_code,   dest_name   = await resolve_station(destination, rail_country, key)

    if not origin_code or not dest_code:
        print(f"[Trains] Could not resolve stations for {origin} → {destination}")
        return []

    print(f"[Trains] {origin_name} ({origin_code}) → {dest_name} ({dest_code})")

    # ── Fetch trains with key rotation ─────────────────────
    for i, key in enumerate(RAPIDAPI_KEYS):
        try:
            trains = await fetch_trains_primary(
                origin_code, dest_code, origin_name, dest_name, formatted_date, key
            )

            if not trains:
                print(f"[Trains] Primary empty — trying fallback host...")
                trains = await fetch_trains_fallback(
                    origin_code, dest_code, origin_name, dest_name, formatted_date, key
                )

            if trains:
                print(f"[Trains] Found {len(trains)} trains via key slot {i}")
                how_to_reach = build_how_to_reach(origin, origin_name, origin_code)
                for t in trains:
                    t["howToReach"] = how_to_reach
                return trains

        except Exception as e:
            print(f"[Trains] Key slot {i} failed: {e} — trying next")
            await asyncio.sleep(0.3)
            continue

    print("[Trains] All keys exhausted.")
    return []