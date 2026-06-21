import os, json, time
from dotenv import load_dotenv
from google import genai
from google.genai import types

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
FALLBACK_MODEL = "gemini-2.5-flash"
FALLBACK_MODEL = "gemini-2.5-flash"  # separate free-tier quota from flash-lite

def generate_with_retry(model, contents, config=None, retries=3, base_delay=2):
    """Try `model`; retry if it's overloaded, and if it's out of quota,
    fall back to FALLBACK_MODEL (which has its own separate free-tier quota)."""
    models_to_try = [model] if model == FALLBACK_MODEL else [model, FALLBACK_MODEL]
    last_err = None
    for m in models_to_try:
        for attempt in range(retries):
            try:
                return client.models.generate_content(model=m, contents=contents, config=config)
            except Exception as e:
                msg = str(e)
                last_err = e
                transient = any(k in msg for k in ("503", "UNAVAILABLE", "overloaded"))
                quota = any(k in msg for k in ("429", "RESOURCE_EXHAUSTED", "quota"))
                if transient and attempt < retries - 1:
                    time.sleep(base_delay * (attempt + 1))
                    continue
                if quota:
                    break  # don't keep hammering a tapped-out model — jump to the fallback
                if attempt < retries - 1:
                    time.sleep(base_delay * (attempt + 1))
                    continue
                break
    raise last_err

def grounded_config():
    """A config with Google Search grounding turned on."""
    return types.GenerateContentConfig(tools=[types.Tool(google_search=types.GoogleSearch())])

def json_config():
    """Config that forces the model to return strictly valid JSON (no grounding)."""
    return types.GenerateContentConfig(response_mime_type="application/json")

def extract_json(text, fallback):
    """Pull the first {...} object out of a model response."""
    try:
        start, end = text.index("{"), text.rindex("}") + 1
        return json.loads(text[start:end])
    except Exception:
        return fallback