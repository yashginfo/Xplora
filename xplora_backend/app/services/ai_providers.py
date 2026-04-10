import os
import json
import asyncio
import httpx
from groq import Groq
from google import genai

# ── Account 1 clients (your account) ──────────────────────
groq_client    = Groq(api_key=os.environ.get("GROQ_API_KEY"))
genai_client   = genai.Client(api_key=os.environ.get("GEMINI_API_KEY"))

# ── Account 2 clients (brother 1) ─────────────────────────
groq_client_2  = Groq(api_key=os.environ.get("GROQ_API_KEY_2"))
genai_client_2 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_2"))

# ── Account 3 clients (brother 2) ─────────────────────────
groq_client_3  = Groq(api_key=os.environ.get("GROQ_API_KEY_3"))
genai_client_3 = genai.Client(api_key=os.environ.get("GEMINI_API_KEY_3"))

# ── OpenRouter keys (all 3 accounts) ──────────────────────
OPENROUTER_API_KEY   = os.environ.get("OPENROUTER_API_KEY")
OPENROUTER_API_KEY_2 = os.environ.get("OPENROUTER_API_KEY_2")
OPENROUTER_API_KEY_3 = os.environ.get("OPENROUTER_API_KEY_3")

# ── Mistral keys (all 3 accounts) ─────────────────────────
MISTRAL_API_KEY   = os.environ.get("MISTRAL_API_KEY")
MISTRAL_API_KEY_2 = os.environ.get("MISTRAL_API_KEY_2")
MISTRAL_API_KEY_3 = os.environ.get("MISTRAL_API_KEY_3")

# ── Together keys (all 3 accounts) ────────────────────────
TOGETHER_API_KEY   = os.environ.get("TOGETHER_API_KEY")
TOGETHER_API_KEY_2 = os.environ.get("TOGETHER_API_KEY_2")
TOGETHER_API_KEY_3 = os.environ.get("TOGETHER_API_KEY_3")


# ── JSON cleaner (shared by all providers) ─────────────────
def clean_and_parse(raw: str) -> dict:
    """Strip markdown fences and parse JSON."""
    raw = raw.strip()
    if not raw:
        raise Exception("Empty response received")
    if raw.startswith("```"):
        raw = raw.split("```")[1]
        if raw.startswith("json"):
            raw = raw[4:]
    return json.loads(raw.strip())


# ── Retry wrapper ──────────────────────────────────────────
async def with_retry(coro_fn, retries: int = 2, base_delay: float = 2.0):
    """
    Retries an async callable on transient failures with exponential backoff.
    Does NOT retry on 4xx errors (bad model name, auth failure, payment required)
    since retrying those will never succeed.
    Retries on: 429 (rate limit), 5xx (server errors), and network timeouts.
    """
    last_exc = None
    for attempt in range(retries + 1):
        try:
            return await coro_fn()
        except Exception as e:
            last_exc = e
            err_str = str(e)
            # Hard stop — retrying won't help
            if any(code in err_str for code in ["401", "402", "403", "404"]):
                raise
            if attempt < retries:
                delay = base_delay * (2 ** attempt)  # 2s → 4s
                print(f"[Retry] Attempt {attempt + 1} failed ({err_str[:60]}), retrying in {delay}s...")
                await asyncio.sleep(delay)
    raise last_exc


# ══════════════════════════════════════════════════════════
# ── GROQ (3 accounts) ─────────────────────────────────────
# ══════════════════════════════════════════════════════════

def _groq_sync(prompt: str, client: Groq) -> dict:
    response = client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[{"role": "user", "content": prompt}],
        temperature=0.7,
        max_tokens=4000,
    )
    raw = response.choices[0].message.content.strip()
    if not raw:
        raise Exception("Groq returned empty response")
    return clean_and_parse(raw)

async def generate_with_groq(prompt: str) -> dict:
    async def _call():
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: _groq_sync(prompt, groq_client)
        )
    return await with_retry(_call, retries=2, base_delay=2.0)

async def generate_with_groq_2(prompt: str) -> dict:
    async def _call():
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: _groq_sync(prompt, groq_client_2)
        )
    return await with_retry(_call, retries=2, base_delay=2.0)

async def generate_with_groq_3(prompt: str) -> dict:
    async def _call():
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: _groq_sync(prompt, groq_client_3)
        )
    return await with_retry(_call, retries=2, base_delay=2.0)


# ══════════════════════════════════════════════════════════
# ── GEMINI 2.0 FLASH (3 accounts) ─────────────────────────
# ══════════════════════════════════════════════════════════

def _gemini2_sync(prompt: str, client) -> dict:
    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt
    )
    return clean_and_parse(response.text)

async def generate_with_gemini_2(prompt: str) -> dict:
    async def _call():
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: _gemini2_sync(prompt, genai_client)
        )
    return await with_retry(_call, retries=2, base_delay=2.0)

async def generate_with_gemini_2_acc2(prompt: str) -> dict:
    async def _call():
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: _gemini2_sync(prompt, genai_client_2)
        )
    return await with_retry(_call, retries=2, base_delay=2.0)

async def generate_with_gemini_2_acc3(prompt: str) -> dict:
    async def _call():
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: _gemini2_sync(prompt, genai_client_3)
        )
    return await with_retry(_call, retries=2, base_delay=2.0)


# ══════════════════════════════════════════════════════════
# ── GEMINI 1.5 FLASH (3 accounts) ─────────────────────────
# ══════════════════════════════════════════════════════════

def _gemini15_sync(prompt: str, client) -> dict:
    response = client.models.generate_content(
        model="gemini-1.5-flash-latest",
        contents=prompt
    )
    return clean_and_parse(response.text)

async def generate_with_gemini_15(prompt: str) -> dict:
    async def _call():
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: _gemini15_sync(prompt, genai_client)
        )
    return await with_retry(_call, retries=2, base_delay=2.0)

async def generate_with_gemini_15_acc2(prompt: str) -> dict:
    async def _call():
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: _gemini15_sync(prompt, genai_client_2)
        )
    return await with_retry(_call, retries=2, base_delay=2.0)

async def generate_with_gemini_15_acc3(prompt: str) -> dict:
    async def _call():
        return await asyncio.get_event_loop().run_in_executor(
            None, lambda: _gemini15_sync(prompt, genai_client_3)
        )
    return await with_retry(_call, retries=2, base_delay=2.0)


# ══════════════════════════════════════════════════════════
# ── OPENROUTER (3 accounts) ───────────────────────────────
# ══════════════════════════════════════════════════════════

async def _openrouter_call(prompt: str, api_key: str) -> dict:
    async def _call():
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://xplora.app",
                    "X-Title": "Xplora AI Travel Planner",
                },
                json={
                    "model": "meta-llama/llama-3.3-70b-instruct:free",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 4000,
                    "temperature": 0.7,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            return clean_and_parse(data["choices"][0]["message"]["content"])
    return await with_retry(_call, retries=1, base_delay=3.0)

async def generate_with_openrouter(prompt: str) -> dict:
    return await _openrouter_call(prompt, OPENROUTER_API_KEY)

async def generate_with_openrouter_2(prompt: str) -> dict:
    return await _openrouter_call(prompt, OPENROUTER_API_KEY_2)

async def generate_with_openrouter_3(prompt: str) -> dict:
    return await _openrouter_call(prompt, OPENROUTER_API_KEY_3)


# ══════════════════════════════════════════════════════════
# ── MISTRAL (3 accounts) ──────────────────────────────────
# ══════════════════════════════════════════════════════════

async def _mistral_call(prompt: str, api_key: str) -> dict:
    async def _call():
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.mistral.ai/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "mistral-small-latest",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 4000,
                    "temperature": 0.7,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            return clean_and_parse(data["choices"][0]["message"]["content"])
    return await with_retry(_call, retries=2, base_delay=3.0)

async def generate_with_mistral(prompt: str) -> dict:
    return await _mistral_call(prompt, MISTRAL_API_KEY)

async def generate_with_mistral_2(prompt: str) -> dict:
    return await _mistral_call(prompt, MISTRAL_API_KEY_2)

async def generate_with_mistral_3(prompt: str) -> dict:
    return await _mistral_call(prompt, MISTRAL_API_KEY_3)


# ══════════════════════════════════════════════════════════
# ── TOGETHER AI (3 accounts) ──────────────────────────────
# ══════════════════════════════════════════════════════════

async def _together_call(prompt: str, api_key: str) -> dict:
    async def _call():
        async with httpx.AsyncClient() as client:
            response = await client.post(
                "https://api.together.xyz/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {api_key}",
                    "Content-Type": "application/json",
                },
                json={
                    "model": "deepseek-ai/DeepSeek-R1-Distill-Llama-70B-free",
                    "messages": [{"role": "user", "content": prompt}],
                    "max_tokens": 4000,
                    "temperature": 0.7,
                },
                timeout=30.0,
            )
            response.raise_for_status()
            data = response.json()
            return clean_and_parse(data["choices"][0]["message"]["content"])
    return await with_retry(_call, retries=1, base_delay=2.0)

async def generate_with_together(prompt: str) -> dict:
    return await _together_call(prompt, TOGETHER_API_KEY)

async def generate_with_together_2(prompt: str) -> dict:
    return await _together_call(prompt, TOGETHER_API_KEY_2)

async def generate_with_together_3(prompt: str) -> dict:
    return await _together_call(prompt, TOGETHER_API_KEY_3)


# ══════════════════════════════════════════════════════════
# ── MASTER FALLBACK CHAIN (15 providers total) ─────────────
# ══════════════════════════════════════════════════════════
async def call_ai_with_fallback(prompt: str) -> tuple[dict, str]:
    """
    Tries all 15 provider+account combinations in order.
    Order: Groq(1→2→3) → Gemini2.0(1→2→3) → Gemini1.5(1→2→3)
           → OpenRouter(1→2→3) → Mistral(1→2→3) → Together(1→2→3)
           → OpenRouter(2→3) → Mistral(2→3) → Together(2→3)

    Each provider has its own retry logic for transient errors.
    Returns (result_dict, provider_name_used).
    Raises Exception only if ALL providers fail.
    """
    errors = []

    providers = [
        # ── Groq ──────────────────────────────────────────
        (generate_with_groq,           "groq-acc1"),
        (generate_with_groq_2,         "groq-acc2"),
        (generate_with_groq_3,         "groq-acc3"),
        # ── Gemini 2.0 ────────────────────────────────────
        (generate_with_gemini_2,       "gemini-2.0-acc1"),
        (generate_with_gemini_2_acc2,  "gemini-2.0-acc2"),
        (generate_with_gemini_2_acc3,  "gemini-2.0-acc3"),
        # ── Gemini 1.5 ────────────────────────────────────
        (generate_with_gemini_15,      "gemini-1.5-acc1"),
        (generate_with_gemini_15_acc2, "gemini-1.5-acc2"),
        (generate_with_gemini_15_acc3, "gemini-1.5-acc3"),
        # ── OpenRouter ────────────────────────────────────
        (generate_with_openrouter,     "openrouter-acc1"),
        (generate_with_openrouter_2,   "openrouter-acc2"),
        (generate_with_openrouter_3,   "openrouter-acc3"),
        # ── Mistral ───────────────────────────────────────
        (generate_with_mistral,        "mistral-acc1"),
        (generate_with_mistral_2,      "mistral-acc2"),
        (generate_with_mistral_3,      "mistral-acc3"),
        # ── Together ──────────────────────────────────────
        (generate_with_together,       "together-acc1"),
        (generate_with_together_2,     "together-acc2"),
        (generate_with_together_3,     "together-acc3"),
    ]

    for fn, name in providers:
        try:
            print(f"[AI] Trying {name}...")
            result = await fn(prompt)
            print(f"[AI] ✅ {name} succeeded")
            return result, name
        except Exception as e:
            print(f"[AI] ❌ {name} failed: {e}")
            errors.append(f"{name}: {str(e)[:80]}")

    raise Exception(f"All 18 AI providers failed. Errors: {' | '.join(errors)}")


# ── Location resolver using Groq ───────────────────────────
async def resolve_location_with_ai(destination: str) -> str:
    """
    Uses Groq (acc1 → acc2 → acc3 fallback) to resolve ambiguous
    destination names to a specific city + country string safe for
    WeatherAPI lookup. Falls back to original destination if all fail.
    """
    prompt = f"""You are a geography expert.

The user wants to travel to: "{destination}"

Your job: Return the single best city name for weather lookup.

Rules:
- Return ONLY a city name + country (e.g. "Srinagar, India")
- If destination is a region/state → return its main/capital city
- Always include the country name to avoid ambiguity
- If destination is already a specific city → just add country
- Return ONLY the city string — no explanation, no punctuation, nothing else

Examples:
"Kashmir" → "Srinagar, India"
"Goa" → "Panaji, India"
"Ladakh" → "Leh, India"
"Paris" → "Paris, France"
"Bali" → "Denpasar, Indonesia"
"Dubai" → "Dubai, UAE"
"Manali" → "Manali, India"
"Rajasthan" → "Jaipur, India"

Now resolve: "{destination}"
"""
    # Try acc1 → acc2 → acc3 for location resolver
    for client, acc in [(groq_client, "acc1"), (groq_client_2, "acc2"), (groq_client_3, "acc3")]:
        try:
            response = await asyncio.get_event_loop().run_in_executor(
                None,
                lambda c=client: c.chat.completions.create(
                    model="llama-3.3-70b-versatile",
                    messages=[{"role": "user", "content": prompt}],
                    temperature=0.1,
                    max_tokens=20,
                )
            )
            resolved = response.choices[0].message.content.strip()
            if len(resolved) > 60 or "\n" in resolved:
                return destination
            print(f"[Location] '{destination}' → resolved to '{resolved}' via groq-{acc}")
            return resolved
        except Exception as e:
            print(f"[Location] groq-{acc} failed: {e}")

    print(f"[Location] All Groq accounts failed — using original destination")
    return destination