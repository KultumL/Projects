from functools import lru_cache
from gemini import generate_with_retry, grounded_config, extract_json

@lru_cache(maxsize=None)
def get_briefing(company_name, ticker):
    prompt = f"""You are an equity research analyst. Using current web information, write a briefing on {company_name} ({ticker}).

Return ONLY valid JSON — no markdown, no code fences — in exactly this shape:
{{
  "narrative": "3-4 plain-English sentences on the most important developments in the last ~90 days: earnings, product launches, leadership changes, regulatory or legal news.",
  "risks": [{{"signal": "short label", "detail": "one sentence explaining the red flag"}}],
  "watch": [{{"catalyst": "short label", "detail": "one sentence on what could move the stock next quarter", "source": "a source name or URL"}}]
}}

Include 3-5 risk signals and 3-4 'what to watch' catalysts. Be specific and factual."""
    response = generate_with_retry("gemini-2.5-flash-lite", prompt, grounded_config())
    return extract_json(response.text, {"narrative": "", "risks": [], "watch": []})