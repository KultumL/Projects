from functools import lru_cache
from gemini import generate_with_retry, json_config, extract_json
@lru_cache(maxsize=None)
def compare_companies(name_a, ticker_a, name_b, ticker_b):
    prompt = f"""You are an equity research analyst. Using current web information, compare {name_a} ({ticker_a}) and {name_b} ({ticker_b}).

Return ONLY valid JSON — no markdown, no code fences — in exactly this shape:
{{
  "strategy": "2-3 sentences contrasting their business strategies and market positioning.",
  "financials": "2-3 sentences contrasting their financial health: profitability, scale, valuation.",
  "growth": "2-3 sentences contrasting their growth trajectory and momentum.",
  "verdict": "1-2 sentences on the key trade-off for someone deciding which to watch."
}}

Be specific, factual, and balanced."""
    response = generate_with_retry("gemini-2.5-flash-lite", prompt, json_config())
    return extract_json(response.text, {"strategy": "", "financials": "", "growth": "", "verdict": ""})