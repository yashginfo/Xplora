import os
import json
import uuid as uuid_lib
from fastapi import APIRouter, HTTPException, Depends
from pydantic import BaseModel
from typing import List
from app.services.ai_providers import call_ai_with_fallback
from sqlalchemy.orm import Session
from app.models import Trip
from app.schemas import TripSaveRequest, TripOut
from app.utils import get_current_user
from app.database import get_db
from app.services.weather import get_weather
from app.services.hotels import fetch_hotels
# from app.services.flights import fetch_flights   # ── Flights removed (Phase 11) — uncomment to re-enable
from app.services.trains import fetch_trains
from app.services.photos import fetch_destination_photos, fetch_hotel_photos

router = APIRouter()

# ── Request schema ─────────────────────────────────────────
class TripRequest(BaseModel):
    from_location: str
    destination: str
    startDate: str
    endDate: str
    people: int
    budgetType: str
    budget: float
    currency: str
    travelStyle: str
    interests: List[str]

# ── Minimum budgets per person ─────────────────────────────
MINIMUM_PER_PERSON = {
    "INR": {
        "local":           200,
        "regional":        500,
        "domestic_short":  3000,
        "domestic_medium": 6000,
        "domestic_long":   12000,
        "international":   80000,
    },
    "USD": {
        "local":           5,
        "regional":        15,
        "domestic_short":  80,
        "domestic_medium": 150,
        "domestic_long":   300,
        "international":   1000,
    }
}

# ── Style-based realistic daily cost per person ────────────
# AI must plan within these per-day-per-person limits for each style
# These are MAXIMUM realistic costs — AI should aim for the lower end
STYLE_DAILY_COST_INR = {
    "low":      { "stay": 400,  "food": 200, "taxi": 100, "activities": 100, "misc": 50  },
    "medium":   { "stay": 1200, "food": 500, "taxi": 250, "activities": 300, "misc": 150 },
    "standard": { "stay": 3000, "food": 1000,"taxi": 500, "activities": 600, "misc": 300 },
}

STYLE_DAILY_COST_USD = {
    "low":      { "stay": 8,   "food": 5,  "taxi": 3,  "activities": 3,  "misc": 2  },
    "medium":   { "stay": 25,  "food": 15, "taxi": 8,  "activities": 10, "misc": 5  },
    "standard": { "stay": 60,  "food": 30, "taxi": 15, "activities": 20, "misc": 10 },
}

# ── Style descriptions for AI ──────────────────────────────
STYLE_DESCRIPTIONS = {
    "low":      "budget backpacker — dormitories/cheapest guesthouses, street food/dhabas, shared autos/buses, free/cheap attractions only",
    "medium":   "normal tourist — budget hotels with AC, local restaurants, app cabs, standard tourist activities",
    "standard": "comfortable traveler — 3-star hotels, good restaurants, private cabs, quality experiences",
}

CATEGORY_LABELS = {
    "local":           "local city trip",
    "regional":        "regional trip",
    "domestic_short":  "short domestic trip",
    "domestic_medium": "domestic trip",
    "domestic_long":   "long domestic trip",
    "international":   "international trip",
}

CATEGORY_HINTS = {
    "local":           "covers metro/auto/cab and food only",
    "regional":        "covers bus/train both ways and food",
    "domestic_short":  "covers train/flight both ways, stay, food, and activities",
    "domestic_medium": "covers transport both ways, stay, food, and activities",
    "domestic_long":   "covers transport both ways, stay, food, and activities",
    "international":   "covers flights both ways, stay, food, visa, and activities",
}


def get_trip_duration_days(start: str, end: str) -> int:
    from datetime import date
    try:
        s = date.fromisoformat(start)
        e = date.fromisoformat(end)
        return max(1, (e - s).days)
    except Exception:
        return 3


def parse_amount(value) -> float:
    if value is None:
        return 0.0
    if isinstance(value, (int, float)):
        return float(value)
    import re
    cleaned = str(value).replace(",", "").replace("₹", "").replace("$", "")
    cleaned = cleaned.replace("INR", "").replace("USD", "").strip()
    match = re.search(r"[\d]+(?:\.\d+)?", cleaned)
    return float(match.group()) if match else 0.0


def get_style_cost_ceiling(style: str, days: int, people: int, currency: str) -> dict:
    """
    Returns realistic TOTAL cost ceilings per category for the entire trip
    based on travel style, duration, and group size.
    """
    style_key = style.lower().strip()
    if style_key not in ("low", "medium", "standard"):
        style_key = "medium"

    if currency == "INR":
        daily = STYLE_DAILY_COST_INR.get(style_key, STYLE_DAILY_COST_INR["medium"])
    else:
        daily = STYLE_DAILY_COST_USD.get(style_key, STYLE_DAILY_COST_USD["medium"])

    return {
        "stay":          daily["stay"] * days * people,
        "food":          daily["food"] * days * people,
        "taxi":          daily["taxi"] * days * people,
        "activities":    daily["activities"] * days * people,
        "miscellaneous": daily["misc"] * days * people,
    }


# ── AI-based trip classification ───────────────────────────
async def classify_trip_with_ai(
    from_location: str,
    destination: str,
    days: int,
    currency: str
) -> dict:
    cur_lower = currency.lower()

    prompt = f"""
You are a geography and travel expert. Analyze this trip and return ONLY a JSON object.

Trip: From "{from_location}" to "{destination}" for {days} days.
Currency: {currency}

STEP 1 — Is "{destination}" a real geographic location anywhere in the world?
(city, town, village, region, country, landmark, island, national park, etc.)

Be VERY LENIENT here. Accept:
- Full country names: "United States", "India", "France"
- Common country aliases: "America" = USA, "UK" = United Kingdom, "UAE" = Dubai area, "US" = USA
- Popular informal names: "America", "Holland", "Persia", "Siam" etc.
- States, provinces, islands, regions, districts
- Famous landmarks used as destinations: "Eiffel Tower area", "Taj Mahal"
- Any name that COULD plausibly refer to a real place — give benefit of the doubt

Only return is_real_place=false for clearly fictional/nonsense inputs like "Narnia", "Wakanda", "xyz123", random keyboard mashing, or strings that are obviously not a place name.

If NOT real → return ONLY this JSON:
{{"is_real_place": false, "message": "\\"{destination}\\" is not a recognised geographic location. Please enter a real city, region, or country."}}

If REAL → continue to STEP 2.

STEP 2 — Classify the trip:
- local: same city or metropolitan area, no significant travel needed (walk/metro/auto/cab)
- regional: nearby cities/towns in the same region, reachable in under 6 hours by road or train (no flight needed)
- domestic_short: same country, far distance, 1-3 days
- domestic_medium: same country, far distance, 4-7 days
- domestic_long: same country, far distance, 8+ days
- international: different country from "{from_location}", requires crossing borders

STEP 3 — Estimate minimum realistic budget per person in {currency}:
- For local: just food + transport within city
- For regional: bus/train both ways + food (no flight)
- For domestic: train or flight both ways + stay + food + activities
- For international: flights both ways + stay + food + visa + activities

STEP 4 — Rail feasibility:
- rail_feasible = true if: same country, both cities have railway stations, train journey is realistic
- rail_feasible = false if: international, island/remote with no rail, different continents
- rail_country: country where rail journey takes place
- no_rail_reason: short reason if not feasible, else empty string

Return ONLY this JSON (no markdown, no explanation):
{{
  "is_real_place": true,
  "category": "<one of: local | regional | domestic_short | domestic_medium | domestic_long | international>",
  "min_per_person_{cur_lower}": <number — minimum realistic budget per person in {currency}>,
  "transport_note": "<realistic transport from {from_location} to {destination}: mode, approx cost per person, duration>",
  "reasoning": "<one sentence explaining why this category>",
  "rail_feasible": <true or false>,
  "rail_country": "<country where the rail journey takes place>",
  "no_rail_reason": "<reason if not feasible, else empty string>"
}}
"""

    try:
        result, _ = await call_ai_with_fallback(prompt)

        if not isinstance(result, dict):
            raise ValueError("AI returned non-dict response")

        if result.get("is_real_place") is False:
            return result

        valid_categories = [
            "local", "regional", "domestic_short",
            "domestic_medium", "domestic_long", "international"
        ]
        if result.get("category") not in valid_categories:
            result["category"] = "domestic_medium"

        key = f"min_per_person_{cur_lower}"
        if key not in result or not isinstance(result[key], (int, float)):
            result[key] = MINIMUM_PER_PERSON.get(currency, {}).get(
                result.get("category", "domestic_medium"), 3000
            )

        if "rail_feasible" not in result:
            result["rail_feasible"] = True
        if "rail_country" not in result or not result["rail_country"]:
            result["rail_country"] = "India"
        if "no_rail_reason" not in result:
            result["no_rail_reason"] = ""

        return result

    except Exception as e:
        print(f"[classify_trip_with_ai] Failed: {e} — using safe default")
        return {
            "is_real_place": True,
            "category": "domestic_medium",
            f"min_per_person_{cur_lower}": MINIMUM_PER_PERSON.get(
                currency, MINIMUM_PER_PERSON["INR"]
            )["domestic_medium"],
            "transport_note": f"Travel from {from_location} to {destination} by available transport.",
            "reasoning": "Classification unavailable — using safe default.",
            "rail_feasible": True,
            "rail_country": "India",
            "no_rail_reason": "",
        }


# ── Layer 1: Budget validation ─────────────────────────────
def validate_budget(
    data: TripRequest,
    category: str,
    ai_min_per_person: float
) -> str | None:
    total_budget = (
        data.budget if data.budgetType == "total"
        else data.budget * data.people
    )
    days = get_trip_duration_days(data.startDate, data.endDate)
    sym = "₹" if data.currency == "INR" else "$"

    # ── Style-aware minimum per person ────────────────────
    # Calculate minimum based on style daily costs × days
    style_key = data.travelStyle.lower().strip()
    if style_key not in ("low", "medium", "standard"):
        style_key = "medium"

    if data.currency == "INR":
        daily = STYLE_DAILY_COST_INR.get(style_key)
    else:
        daily = STYLE_DAILY_COST_USD.get(style_key)

    # Style-based minimum = (food + taxi + misc) × days
    # Stay and activities are optional for short/regional trips
    style_min_pp = (
        daily["food"] + daily["taxi"] + daily["misc"]
    ) * days

    # Add transport cost based on category
    if data.currency == "INR":
        transport_min = {
            "local": 50, "regional": 200,
            "domestic_short": 800, "domestic_medium": 1500,
            "domestic_long": 2500, "international": 15000,
        }.get(category, 1000)
    else:
        transport_min = {
            "local": 2, "regional": 5,
            "domestic_short": 20, "domestic_medium": 40,
            "domestic_long": 80, "international": 400,
        }.get(category, 30)

    style_min_pp += transport_min

    # Table hard minimum (absolute floor regardless of style)
    table_min = MINIMUM_PER_PERSON.get(
        data.currency, MINIMUM_PER_PERSON["INR"]
    ).get(category, 3000)

    # Use style-based minimum — don't let AI inflate it beyond style reality
    # Take the lower of: style-calculated min vs table min for low/medium
    if style_key == "low":
        min_pp = min(style_min_pp, table_min)
    elif style_key == "medium":
        min_pp = max(style_min_pp, table_min * 0.7)
    else:
        min_pp = max(style_min_pp, float(table_min))

    min_total = min_pp * data.people

    if total_budget < min_total:
        return (
            f"Your total budget of {sym}{int(total_budget):,} is not enough for "
            f"{data.people} {'person' if data.people == 1 else 'people'} on a "
            f"{days}-day {CATEGORY_LABELS.get(category, 'trip')} to {data.destination}. "
            f"Minimum realistic budget needed is {sym}{int(min_total):,} "
            f"({sym}{int(min_pp):,} per person) — this "
            f"{CATEGORY_HINTS.get(category, 'covers basic costs')}. "
            f"Please increase your budget."
        )
    return None

# ── Layer 2: Post-check AI output ──────────────────────────
def validate_ai_output(
    result: dict,
    data: TripRequest,
    category: str
) -> str | None:
    total_budget = (
        data.budget if data.budgetType == "total"
        else data.budget * data.people
    )
    sym = "₹" if data.currency == "INR" else "$"
    cb = result.get("costBreakdown", {})

    required = ["stay", "travel", "food", "activities", "taxi", "miscellaneous"]

    missing = []
    for cat in required:
        val = parse_amount(cb.get(cat, 0))
        if val <= 0:
            if category == "local" and cat in ("stay", "travel"):
                continue
            missing.append(cat)

    if missing:
        return (
            f"AI generated an incomplete cost plan — "
            f"missing or zero values for: {', '.join(missing)}."
        )

    # Only reject if AI overspends budget
    breakdown_sum = sum(parse_amount(cb.get(cat, 0)) for cat in required)
    if breakdown_sum > total_budget * 1.10:
        return (
            f"AI's cost breakdown sums to {sym}{int(breakdown_sum):,} "
            f"but total budget is {sym}{int(total_budget):,}. "
            f"The numbers don't add up."
        )

    return None


# ── Prompt builder ─────────────────────────────────────────
def build_prompt(
    data: TripRequest,
    category: str,
    transport_note: str,
    weather_data: dict | None = None,
    strict: bool = False
) -> str:
    total_budget = (
        data.budget if data.budgetType == "total"
        else data.budget * data.people
    )
    days = get_trip_duration_days(data.startDate, data.endDate)
    sym = "₹" if data.currency == "INR" else "$"

    # ── Style-based cost ceilings ──────────────────────────
    style_key = data.travelStyle.lower().strip()
    if style_key not in ("low", "medium", "standard"):
        style_key = "medium"

    style_desc = STYLE_DESCRIPTIONS.get(style_key, STYLE_DESCRIPTIONS["medium"])
    ceilings = get_style_cost_ceiling(style_key, days, data.people, data.currency)

    # Calculate realistic max trip cost based on style
    # Travel cost is not in ceilings (depends on distance) — AI decides it
    style_max_non_travel = sum(ceilings.values())

    # ── Weather block ──────────────────────────────────────
    if weather_data and weather_data.get("ai_summary"):
        weather_block = f"""
WEATHER CONTEXT (Live Data):
{weather_data['ai_summary']}
- Use this to make the plan weather-aware.
- If bad weather flagged, suggest indoor alternatives for those days.
"""
    else:
        weather_block = f"""
WEATHER CONTEXT (Estimated):
- Estimate typical weather for {data.destination} during {data.startDate} to {data.endDate}.
- Prefix weatherNote with "Estimated: "
"""

    # ── Category rules ─────────────────────────────────────
    if category == "local":
        category_rules = f"""
TRIP TYPE: LOCAL (same city / intra-city)
- NO flights, NO trains, NO inter-city buses
- Transport = metro / auto / cab / walk only
- Stay = {sym}0 if same-day trip
"""
    elif category == "regional":
        category_rules = f"""
TRIP TYPE: REGIONAL (nearby, under 6 hours by road/train)
- NO flights — bus or train only
- Stay: cheapest guesthouse if overnight
"""
    elif category == "international":
        category_rules = f"""
TRIP TYPE: INTERNATIONAL
- Include flights both ways
- Include visa costs in miscellaneous
"""
    else:
        category_rules = f"""
TRIP TYPE: DOMESTIC (long distance, same country)
- Include cheapest available train or bus both ways
- Budget accommodation based on travel style
"""

    strict_block = ""
    if strict:
        strict_block = f"""
⚠️ STRICT MODE:
1. Transport: {transport_note}
2. Stay + food + activities + taxi + misc MUST follow style ceilings below EXACTLY
3. All 6 categories must be non-zero (except stay for local day trips)
4. actualTripCost = stay + travel + food + activities + taxi + miscellaneous
5. remainingBudget = {sym}{int(total_budget):,} - actualTripCost
"""

    return f"""
You are an expert travel planner acting as a smart budget agent.

Trip Details:
- From: {data.from_location}
- To: {data.destination}
- Dates: {data.startDate} to {data.endDate} ({days} days)
- People: {data.people}
- User's Budget: {sym}{int(total_budget):,} total
- Travel Style: {data.travelStyle.upper()} — {style_desc}

{category_rules}
{weather_block}
{strict_block}

TRANSPORT: {transport_note}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL RULE — TRAVEL STYLE COST CEILINGS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
You are planning a {data.travelStyle.upper()} style trip.
This means: {style_desc}

The user entered {sym}{int(total_budget):,} as their budget.
DO NOT just spend the full budget. Plan the MINIMUM REALISTIC cost for {data.travelStyle.upper()} style.

Maximum allowed per category for {days} days × {data.people} people at {data.travelStyle.upper()} style:
- 🏨 Stay:        {sym}{int(ceilings["stay"]):,}   (max {sym}{int(ceilings["stay"] / max(days,1) / max(data.people,1)):,}/person/night)
- 🍽️ Food:        {sym}{int(ceilings["food"]):,}   (max {sym}{int(ceilings["food"] / max(days,1) / max(data.people,1)):,}/person/day)
- 🚕 Taxi:        {sym}{int(ceilings["taxi"]):,}   (max {sym}{int(ceilings["taxi"] / max(days,1) / max(data.people,1)):,}/person/day)
- 🎯 Activities:  {sym}{int(ceilings["activities"]):,}   (max {sym}{int(ceilings["activities"] / max(days,1) / max(data.people,1)):,}/person/day)
- 🧳 Misc:        {sym}{int(ceilings["miscellaneous"]):,}   (max {sym}{int(ceilings["miscellaneous"] / max(days,1) / max(data.people,1)):,}/person/day)

Travel cost: calculate realistically based on transport type (train/bus/flight).

IMPORTANT:
- Plan the trip as cheaply as possible within this style
- actualTripCost = stay + travel + food + activities + taxi + miscellaneous
- remainingBudget = {sym}{int(total_budget):,} - actualTripCost
- Both actualTripCost and remainingBudget MUST be included in your response
- perPersonShare = actualTripCost ÷ {data.people}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
CRITICAL ITINERARY RULE — READ THIS CAREFULLY:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
This trip is {days} days long. You MUST return EXACTLY {days} day objects in the "itinerary" array.
- Number the days: Day 1, Day 2, Day 3 ... Day {days}
- ALL {days} days are REQUIRED. Never return fewer days than {days}.
- Each day object must have: day, title, morning, afternoon, evening, food[], estimatedDayCost

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
STYLE GUIDE — what {data.travelStyle.upper()} means:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
{"LOW: Dormitory beds or ₹300-500/night guesthouses. Street food and dhabas only. Shared autos and state buses. Free or very cheap tourist spots only." if style_key == "low" else ""}
{"MEDIUM: Budget AC hotels ₹800-1500/night. Local restaurants with proper meals. App cabs for convenience. Standard tourist activities." if style_key == "medium" else ""}
{"STANDARD: 3-star hotels ₹2000-4000/night. Good restaurants. Private cabs. Quality experiences and paid attractions." if style_key == "standard" else ""}

Return ONLY a raw JSON object (no markdown, no code fences):

{{
  "destination": "{data.destination}",
  "duration": "{days} {'day' if days == 1 else 'days'}",
  "totalBudget": "{data.currency} {int(total_budget)}",
  "budgetType": "{data.budgetType}",
  "people": {data.people},
  "travelStyle": "{data.travelStyle}",
  "summary": "2-3 line trip summary mentioning the travel style and actual estimated cost",
  "costBreakdown": {{
    "stay": "{sym}amount",
    "travel": "{sym}amount",
    "food": "{sym}amount",
    "activities": "{sym}amount",
    "taxi": "{sym}amount",
    "miscellaneous": "{sym}amount",
    "perPersonShare": "{sym}amount (actualTripCost ÷ {data.people})",
    "actualTripCost": "{sym}amount (sum of all 6 above)",
    "remainingBudget": "{sym}amount ({sym}{int(total_budget):,} - actualTripCost)"
  }},
  "hotels": [
    {{
      "name": "Hotel/guesthouse name matching {data.travelStyle} style",
      "area": "Area name",
      "pricePerNight": "{sym}amount",
      "rating": "3.5/5",
      "reason": "Why this fits {data.travelStyle} style"
    }}
  ],
  "itinerary": [
    {{
      "day": 1,
      "title": "Day title",
      "morning": "Morning activity",
      "afternoon": "Afternoon activity",
      "evening": "Evening activity",
      "food": ["Food place 1 (budget appropriate)", "Food place 2"],
      "estimatedDayCost": "{sym}amount"
    }}
  ],
  "transport": {{
    "toDestination": "Cheapest realistic transport from {data.from_location} to {data.destination} — mode, cost per person, duration",
    "localTransport": "How to get around at {data.destination} — cheapest option for {data.travelStyle} style"
  }},
  "weatherNote": "Weather during travel dates",
  "packingEssentials": ["item1", "item2", "item3", "item4", "item5"],
  "travelTips": ["tip1", "tip2", "tip3"]
}}
"""


# ── Generate trip ──────────────────────────────────────────
@router.post("/generate")
async def generate_trip(data: TripRequest):
    import asyncio
    days = get_trip_duration_days(data.startDate, data.endDate)
    sym = "₹" if data.currency == "INR" else "$"
    cur_lower = data.currency.lower()

    # ── Step 1: AI classifies the trip ────────────────────
    classification = await classify_trip_with_ai(
        data.from_location, data.destination, days, data.currency
    )

    if classification.get("is_real_place") is False:
        raise HTTPException(
            status_code=422,
            detail=classification.get(
                "message",
                f'"{data.destination}" is not a recognised place. Please enter a real city or country.'
            )
        )

    category = classification.get("category", "domestic_medium")
    ai_min_per_person = float(
        classification.get(f"min_per_person_{cur_lower}", 0) or 0
    )
    transport_note = classification.get(
        "transport_note",
        f"Travel from {data.from_location} to {data.destination} by available transport."
    )

    rail_feasible  = bool(classification.get("rail_feasible", True))
    rail_country   = classification.get("rail_country", "India") or "India"
    no_rail_reason = classification.get("no_rail_reason", "")

    # ── Step 2: Validate budget ───────────────────────────
    budget_error = validate_budget(data, category, ai_min_per_person)
    if budget_error:
        raise HTTPException(status_code=422, detail=budget_error)

    # ── Step 3: Fetch weather + live data ─────────────────
    fetch_hotels_flag = True
    fetch_trains_flag = True
    # fetch_flights_flag = data.travelStyle in ("standard", "medium")   # ── Flights removed (Phase 11)

    weather_result, photos_result, hotel_photos_result = await asyncio.gather(
        get_weather(data.destination, data.startDate, data.endDate),
        fetch_destination_photos(data.destination, count=5),
        fetch_hotel_photos(data.destination),
        return_exceptions=True,
    )

    weather_data      = weather_result      if not isinstance(weather_result,      Exception) else None
    photos_data       = photos_result       if not isinstance(photos_result,       Exception) else []
    hotel_photos_data = hotel_photos_result if not isinstance(hotel_photos_result, Exception) else []

    hotels_data             = []
    flights_data            = []   # ── Flights removed (Phase 11) — kept as empty list for frontend compatibility
    trains_data             = []
    trains_not_feasible_msg = ""

    if fetch_hotels_flag:
        try:
            hotels_data = await fetch_hotels(data.destination, data.startDate, data.endDate)
        except Exception as e:
            print(f"[Phase6] Hotels fetch failed: {e}")
        await asyncio.sleep(0.3)

    # ── Flights fetch removed (Phase 11) ──────────────────
    # Uncomment the block below to re-enable flights:
    # ──────────────────────────────────────────────────────
    # if fetch_flights_flag:
    #     try:
    #         flights_data = await fetch_flights(data.from_location, data.destination, data.startDate)
    #     except Exception as e:
    #         print(f"[Phase6] Flights fetch failed: {e}")
    #     await asyncio.sleep(0.3)
    # ──────────────────────────────────────────────────────

    if fetch_trains_flag:
        try:
            trains_result = await fetch_trains(
                origin=data.from_location,
                destination=data.destination,
                date=data.startDate,
                rail_feasible=rail_feasible,
                rail_country=rail_country,
                no_rail_reason=no_rail_reason,
            )
            if isinstance(trains_result, dict) and trains_result.get("not_feasible"):
                trains_data = []
                trains_not_feasible_msg = trains_result.get("message", "")
            else:
                trains_data = trains_result if isinstance(trains_result, list) else []
        except Exception as e:
            print(f"[Phase6] Trains fetch failed: {e}")

    print(f"[Phase6] Hotels: {len(hotels_data)}, Flights: {len(flights_data)}, Trains: {len(trains_data)}")

    # ── Step 4: First AI trip generation ──────────────────
    prompt = build_prompt(data, category, transport_note, weather_data, strict=False)

    try:
        result, provider = await call_ai_with_fallback(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"All AI providers failed: {e}")

    if "error" in result:
        raise HTTPException(status_code=422, detail=result.get("message", "Invalid request."))

    # ── Step 5: Post-check AI numbers ─────────────────────
    math_error = validate_ai_output(result, data, category)

    if math_error:
        print(f"[Post-check] Failed: {math_error} — retrying with strict prompt...")
        strict_prompt = build_prompt(
            data, category, transport_note, weather_data, strict=True
        )

        try:
            result, provider = await call_ai_with_fallback(strict_prompt)
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"All AI providers failed on retry: {e}")

        if "error" in result:
            raise HTTPException(status_code=422, detail=result.get("message", "Invalid request."))

        retry_error = validate_ai_output(result, data, category)
        if retry_error:
            min_pp = max(
                ai_min_per_person,
                MINIMUM_PER_PERSON.get(data.currency, {}).get(category, 3000)
            )
            min_needed = min_pp * data.people
            raise HTTPException(
                status_code=422,
                detail=(
                    f"We couldn't generate a realistic plan within your budget of "
                    f"{sym}{int(data.budget):,} for {data.people} people to "
                    f"{data.destination}. "
                    f"Minimum realistic budget needed is "
                    f"{sym}{int(min_needed):,} ({sym}{int(min_pp):,} per person)."
                )
            )

    # ── All checks passed — attach live data and return ───
    result["weatherData"]          = weather_data
    result["photosData"]           = photos_data
    result["hotelPhotosData"]      = hotel_photos_data
    result["hotelsData"]           = hotels_data
    result["flightsData"]          = flights_data   # always [] — flights removed (Phase 11)
    result["trainsData"]           = trains_data
    result["trainsNotFeasibleMsg"] = trains_not_feasible_msg
    result["generatedBy"]          = provider
    return result


# ── Save Trip ──────────────────────────────────────────────
@router.post("/save", response_model=TripOut)
def save_trip(
    body: TripSaveRequest,
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    plan = body.plan
    destination = plan.get("destination", "Unknown")
    new_trip = Trip(
        user_id=current_user.id,
        uuid=str(uuid_lib.uuid4()),
        destination=destination,
        from_location=body.from_location or "",
        plan=plan,
    )
    db.add(new_trip)
    db.commit()
    db.refresh(new_trip)
    return new_trip


# ── Get shared trip (public, no auth) ─────────────────────
@router.get("/share/{trip_uuid}")
def get_shared_trip(trip_uuid: str, db: Session = Depends(get_db)):
    trip = db.query(Trip).filter(Trip.uuid == trip_uuid).first()
    if not trip:
        raise HTTPException(status_code=404, detail="Trip not found")
    return trip.plan


# ── My Trips ──────────────────────────────────────────────
@router.get("/my-trips", response_model=List[TripOut])
def get_my_trips(
    db: Session = Depends(get_db),
    current_user=Depends(get_current_user)
):
    trips = db.query(Trip).filter(
        Trip.user_id == current_user.id
    ).order_by(Trip.created_at.desc()).all()
    return trips