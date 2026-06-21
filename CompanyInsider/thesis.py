from functools import lru_cache
from gemini import generate_with_retry, grounded_config, extract_json

@lru_cache(maxsize=None)
def generate_thesis(risk, horizon, theme):
    theme_line = f"They are particularly interested in: {theme}." if theme.strip() else "They have no specific sector preference."
    prompt = f"""You are an equity research analyst building a watchlist (NOT giving personalized financial advice).
Investor profile: risk tolerance = {risk}; time horizon = {horizon}. {theme_line}

Using current web information, suggest 3 publicly traded companies worth researching that fit this profile.

Return ONLY valid JSON — no markdown, no code fences — in exactly this shape:
{{"picks": [{{"ticker": "TICK", "name": "Company", "reason": "2-3 sentences on why it fits this risk level and horizon", "source": "a source name or URL"}}]}}

Include exactly 3 picks. Match the risk tolerance and horizon. Be specific and factual."""
    response = generate_with_retry("gemini-2.5-flash-lite", prompt, grounded_config())
    return extract_json(response.text, {"picks": []})