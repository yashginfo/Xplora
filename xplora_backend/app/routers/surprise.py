# app/routers/surprise.py
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from app.services.ai_providers import call_ai_with_fallback

router = APIRouter()


# ── Request schema ─────────────────────────────────────────
class SurpriseRequest(BaseModel):
    home_location: str
    budget: float
    currency: str          # "INR" or "USD"
    start_date: str        # YYYY-MM-DD
    end_date: str          # YYYY-MM-DD


# ── Helpers ────────────────────────────────────────────────
def get_trip_days(start: str, end: str) -> int:
    from datetime import date
    try:
        return max(1, (date.fromisoformat(end) - date.fromisoformat(start)).days)
    except Exception:
        return 3


# Absolute floor — if budget can't cover even the cheapest realistic trip
FLOOR_INR = 1500   # ₹1,500 total minimum for any trip from any city
FLOOR_USD = 25     # $25 total minimum


def build_surprise_prompt(req: SurpriseRequest, days: int) -> str:
    sym = "₹" if req.currency == "INR" else "$"
    floor = FLOOR_INR if req.currency == "INR" else FLOOR_USD

    return f"""
You are a smart travel expert. A user from "{req.home_location}" wants a surprise trip.

User details:
- Home location: {req.home_location}
- Total budget: {sym}{int(req.budget):,} ({req.currency})
- Travel dates: {req.start_date} to {req.end_date} ({days} days)

TASK:
Suggest exactly 3 realistic surprise travel destinations this person can actually visit from {req.home_location} within their budget of {sym}{int(req.budget):,} for {days} days.

RULES:
1. All 3 destinations MUST be reachable from {req.home_location} (real cities/places)
2. Total estimated trip cost for each destination MUST be under {sym}{int(req.budget):,}
3. Costs must be realistic — not fake/inflated/deflated numbers
4. Each destination must have a different vibe (e.g. beach, mountains, heritage/culture, nature, city)
5. Estimate costs like a real traveler would: cheapest realistic transport both ways + budget stay + street food/local restaurants + basic activities
6. If budget is genuinely too low for ANY meaningful trip from {req.home_location}, set "budget_too_low" to true

Cost estimation guide for {req.currency}:
{"- Budget stay: ₹400-800/night | Street food: ₹150-300/day/person | Local transport: ₹50-200/day | Activities: ₹100-300/day" if req.currency == "INR" else "- Budget stay: $8-20/night | Street food: $5-15/day/person | Local transport: $3-8/day | Activities: $5-15/day"}
{"- Train/bus fare: ₹100-2000 each way depending on distance" if req.currency == "INR" else "- Transport: $10-100 each way depending on distance"}

Return ONLY a raw JSON object (no markdown, no code fences):

{{
  "budget_too_low": false,
  "too_low_message": "",
  "destinations": [
    {{
      "name": "City, State/Country",
      "emoji": "🏔️",
      "vibe": "One word vibe — Beach / Mountains / Heritage / Nature / City",
      "why_go": "2-3 sentences — what makes this place special, what experience awaits",
      "best_for": ["activity1", "activity2", "activity3"],
      "cost_breakdown": {{
        "travel": "{sym}amount (transport both ways from {req.home_location})",
        "stay": "{sym}amount ({days} nights)",
        "food": "{sym}amount ({days} days)",
        "activities": "{sym}amount",
        "total_estimated": "{sym}amount"
      }},
      "budget_fit": "Tight / Comfortable / Plenty",
      "travel_time": "e.g. 4 hours by train",
      "travel_mode": "Train / Bus / Flight / Drive"
    }},
    {{
      "name": "City, State/Country",
      "emoji": "🏖️",
      "vibe": "One word vibe",
      "why_go": "2-3 sentences",
      "best_for": ["activity1", "activity2", "activity3"],
      "cost_breakdown": {{
        "travel": "{sym}amount",
        "stay": "{sym}amount",
        "food": "{sym}amount",
        "activities": "{sym}amount",
        "total_estimated": "{sym}amount"
      }},
      "budget_fit": "Tight / Comfortable / Plenty",
      "travel_time": "e.g. 6 hours by bus",
      "travel_mode": "Train / Bus / Flight / Drive"
    }},
    {{
      "name": "City, State/Country",
      "emoji": "🌿",
      "vibe": "One word vibe",
      "why_go": "2-3 sentences",
      "best_for": ["activity1", "activity2", "activity3"],
      "cost_breakdown": {{
        "travel": "{sym}amount",
        "stay": "{sym}amount",
        "food": "{sym}amount",
        "activities": "{sym}amount",
        "total_estimated": "{sym}amount"
      }},
      "budget_fit": "Tight / Comfortable / Plenty",
      "travel_time": "e.g. 2 hours by train",
      "travel_mode": "Train / Bus / Flight / Drive"
    }}
  ]
}}

If budget_too_low is true, set destinations to [] and fill too_low_message with:
"Your budget of {sym}{int(req.budget):,} for {days} days is too low for a meaningful trip from {req.home_location}. We recommend at least {sym}[realistic minimum] to cover transport, stay, and food."
"""


# ── Endpoint ───────────────────────────────────────────────
@router.post("/suggest")
async def suggest_surprise(req: SurpriseRequest):
    # Basic floor check before even calling AI
    floor = FLOOR_INR if req.currency == "INR" else FLOOR_USD
    if req.budget < floor:
        sym = "₹" if req.currency == "INR" else "$"
        raise HTTPException(
            status_code=422,
            detail=(
                f"Your budget of {sym}{int(req.budget):,} is too low to plan any trip. "
                f"Please enter at least {sym}{floor:,} to get destination suggestions."
            )
        )

    days = get_trip_days(req.start_date, req.end_date)
    prompt = build_surprise_prompt(req, days)

    try:
        result, _ = await call_ai_with_fallback(prompt)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI service unavailable: {e}")

    # If AI says budget is too low — return 422 with helpful message
    if result.get("budget_too_low"):
        raise HTTPException(
            status_code=422,
            detail=result.get(
                "too_low_message",
                "Your budget is too low for a meaningful trip. Please increase it."
            )
        )

    destinations = result.get("destinations", [])
    if not destinations:
        raise HTTPException(
            status_code=500,
            detail="Could not generate destination suggestions. Please try again."
        )

    return {
        "home_location": req.home_location,
        "budget": req.budget,
        "currency": req.currency,
        "days": days,
        "start_date": req.start_date,
        "end_date": req.end_date,
        "destinations": destinations,
    }