from app.services.ai_providers import resolve_location_with_ai
import httpx
import os
from datetime import datetime, date, timedelta

# ── OpenWeatherMap API keys (3 accounts) ──────────────────
WEATHER_API_KEYS = [
    os.getenv("OPENWEATHER_API_KEY"),
    os.getenv("OPENWEATHER_API_KEY_2"),
    os.getenv("OPENWEATHER_API_KEY_3"),
]

BASE_URL = "https://api.openweathermap.org/data/2.5"

BAD_CONDITIONS = [
    "storm", "thunder", "blizzard", "tornado", "hurricane",
    "heavy rain", "heavy snow", "freezing", "sleet", "flood"
]

def is_bad_weather(condition: str) -> bool:
    condition_lower = condition.lower()
    return any(bad in condition_lower for bad in BAD_CONDITIONS)

def owm_icon_url(icon_code: str) -> str:
    """
    Returns icon URL in the format //openweathermap.org/img/wn/...
    so WeatherCard.jsx can use it as: src={`https:${icon}`}
    — exactly the same pattern as WeatherAPI icons.
    """
    return f"//openweathermap.org/img/wn/{icon_code}@2x.png"

async def get_weather(destination: str, start_date: str, end_date: str) -> dict:
    """
    Fetches current weather + up to 5-day forecast for destination
    using OpenWeatherMap API (free tier).

    Tries OPENWEATHER_API_KEY → OPENWEATHER_API_KEY_2 → OPENWEATHER_API_KEY_3 on failure.
    start_date and end_date are strings in format YYYY-MM-DD.

    Output structure is identical to the old WeatherAPI version so that
    trips.py, WeatherCard.jsx, WeatherBanner.jsx and PDF generation
    require zero changes.
    """

    resolved_location = await resolve_location_with_ai(destination)

    # Filter out any None keys
    active_keys = [k for k in WEATHER_API_KEYS if k]

    last_error = None

    for idx, key in enumerate(active_keys, start=1):
        async with httpx.AsyncClient() as client:
            try:
                # ── 1. Current weather ─────────────────────────────
                current_resp = await client.get(
                    f"{BASE_URL}/weather",
                    params={
                        "q":     resolved_location,
                        "appid": key,
                        "units": "metric",   # °C
                    },
                    timeout=10.0
                )
                current_resp.raise_for_status()
                current_data = current_resp.json()

                # ── 2. 5-day / 3-hour forecast ─────────────────────
                # OpenWeatherMap free tier gives 5-day forecast in 3-hour steps
                forecast_resp = await client.get(
                    f"{BASE_URL}/forecast",
                    params={
                        "q":     resolved_location,
                        "appid": key,
                        "units": "metric",
                        "cnt":   40,         # 40 × 3 h = 5 days
                    },
                    timeout=10.0
                )
                forecast_resp.raise_for_status()
                forecast_data = forecast_resp.json()

                print(f"[Weather] ✅ key-{idx} succeeded for '{resolved_location}'")

                # ── Parse current weather ──────────────────────────
                current_weather = {
                    "temp_c":      round(current_data["main"]["temp"], 1),
                    "condition":   current_data["weather"][0]["description"].title(),
                    "icon":        owm_icon_url(current_data["weather"][0]["icon"]),
                    "humidity":    current_data["main"]["humidity"],
                    "wind_kph":    round(current_data["wind"]["speed"] * 3.6, 1),  # m/s → km/h
                    "feels_like_c": round(current_data["main"]["feels_like"], 1),
                }

                # ── Parse forecast: collapse 3-hour slots into daily summaries ──
                # OWM free tier returns 3-hour intervals; we group by date to get
                # daily max/min/condition/rain_chance — same shape as WeatherAPI.
                daily_buckets: dict[str, list] = {}
                for entry in forecast_data["list"]:
                    day_str = entry["dt_txt"][:10]          # "YYYY-MM-DD"
                    daily_buckets.setdefault(day_str, []).append(entry)

                forecast_days = []
                for day_str in sorted(daily_buckets.keys()):
                    slots = daily_buckets[day_str]

                    temps      = [s["main"]["temp"]     for s in slots]
                    temps_max  = [s["main"]["temp_max"] for s in slots]
                    temps_min  = [s["main"]["temp_min"] for s in slots]

                    # Pick the daytime slot (12:00 UTC) for icon/condition,
                    # fall back to the first slot if 12:00 not available.
                    daytime = next(
                        (s for s in slots if "12:00" in s["dt_txt"]),
                        slots[0]
                    )

                    # Rain chance: OWM gives pop (probability of precipitation) 0–1
                    rain_pops = [s.get("pop", 0) for s in slots]
                    rain_chance = round(max(rain_pops) * 100)

                    # Humidity: average across day
                    humidity = round(sum(s["main"]["humidity"] for s in slots) / len(slots))

                    forecast_days.append({
                        "date":        day_str,
                        "max_c":       round(max(temps_max), 1),
                        "min_c":       round(min(temps_min), 1),
                        "condition":   daytime["weather"][0]["description"].title(),
                        "icon":        owm_icon_url(daytime["weather"][0]["icon"]),
                        "rain_chance": rain_chance,
                        "humidity":    humidity,
                    })

                # OWM free tier covers ~5 days; WeatherCard expects up to 7.
                # Keep whatever we have — the UI already handles fewer days.

                # ── Determine if trip dates fall within forecast window ────
                today = date.today()
                try:
                    trip_start      = datetime.strptime(start_date, "%Y-%m-%d").date()
                    trip_end        = datetime.strptime(end_date,   "%Y-%m-%d").date()
                    days_until_trip = (trip_start - today).days
                    within_forecast = days_until_trip <= 5   # OWM free = 5 days
                except Exception:
                    within_forecast = False
                    days_until_trip = 99

                # ── Check for bad weather in forecast ─────────────
                has_bad_weather  = False
                bad_weather_days = []

                if within_forecast:
                    for day in forecast_days:
                        if is_bad_weather(day["condition"]):
                            has_bad_weather = True
                            bad_weather_days.append(day["date"])

                # ── Location string from API response ──────────────
                city_name    = current_data.get("name", resolved_location)
                country_code = current_data.get("sys", {}).get("country", "")
                location_str = f"{city_name}, {country_code}" if country_code else city_name

                # ── Build weather summary for AI prompt ───────────
                ai_summary = (
                    f"Current weather in {destination}: "
                    f"{current_weather['condition']}, {current_weather['temp_c']}°C. "
                )
                if within_forecast and forecast_days:
                    ai_summary += "5-day forecast available. "
                    if has_bad_weather:
                        ai_summary += (
                            f"WARNING: Bad weather expected on: "
                            f"{', '.join(bad_weather_days)}. "
                            f"Suggest indoor alternatives and warn the user."
                        )
                    else:
                        ai_summary += "Weather looks good for the trip dates."
                else:
                    ai_summary += (
                        "Trip dates are beyond the 5-day forecast window — plan accordingly."
                    )

                return {
                    "current":         current_weather,
                    "forecast":        forecast_days,
                    "has_bad_weather": has_bad_weather,
                    "bad_weather_days": bad_weather_days,
                    "within_forecast": within_forecast,
                    "days_until_trip": days_until_trip,
                    "ai_summary":      ai_summary,
                    "location":        location_str,
                    "is_ai_estimated": False,   # real data, not estimated
                }

            except Exception as e:
                print(f"[Weather] ❌ key-{idx} failed: {e}")
                last_error = e
                continue   # try next key

    # ── All keys exhausted — return fallback ──────────────
    print(f"[Weather] All {len(active_keys)} keys failed. Last error: {last_error}")
    return {
        "current":          None,
        "forecast":         [],
        "has_bad_weather":  False,
        "bad_weather_days": [],
        "within_forecast":  False,
        "days_until_trip":  99,
        "ai_summary":       None,       # None → trips.py asks AI instead
        "location":         resolved_location,
        "is_ai_estimated":  True,       # frontend shows "🤖 AI estimated"
    }