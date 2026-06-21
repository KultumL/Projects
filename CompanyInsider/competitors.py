# competitors.py — competitor comparison + emerging-competitor web search
from functools import lru_cache
import yfinance as yf
import pandas as pd
from gemini import generate_with_retry, grounded_config, extract_json
from data import format_big_number


@lru_cache(maxsize=None)
def get_competitor_comparison(company_name, company_ticker):
    prompt = f"""List the US stock ticker symbols of {company_name}'s main publicly-traded competitors.
Return ONLY the tickers, comma-separated, no other text. Example: MSFT, GOOGL, AMZN"""
    resp = generate_with_retry("gemini-2.5-flash-lite", prompt)
    competitor_tickers = [t.strip().upper() for t in resp.text.split(",") if t.strip()][:5]

    rows = []
    for t in [company_ticker] + competitor_tickers:
        try:
            info = yf.Ticker(t).info
            pe = info.get("trailingPE")
            margin = info.get("profitMargins")
            rows.append({
                "Ticker": t,
                "Name": info.get("shortName", t),
                "Price": f"${info.get('currentPrice'):.0f}" if info.get("currentPrice") else "N/A",
                "Market Cap": format_big_number(info.get("marketCap")),
                "P/E": f"{pe:.1f}" if pe else "N/A",
                "Margin": f"{margin * 100:.1f}%" if margin else "N/A",
            })
        except Exception:
            rows.append({"Ticker": t, "Name": "N/A", "Price": "N/A",
                         "Market Cap": "N/A", "P/E": "N/A", "Margin": "N/A"})
    return pd.DataFrame(rows)


@lru_cache(maxsize=None)
def get_competitive_landscape(company_name, sector):
    prompt = f"""You are a competitive intelligence analyst. Use current web information to analyze competitors of {company_name} (sector: {sector}).

Return ONLY valid JSON — no markdown, no code fences, no extra text — in exactly this shape:
{{"established": [{{"name": "Company", "note": "one sentence on how they compete"}}],
  "emerging": [{{"name": "Company", "note": "one sentence on why they are a rising threat"}}]}}

Include 4-6 established competitors and 3-6 emerging ones. Use real, specific company names."""
    response = generate_with_retry("gemini-2.5-flash-lite", prompt, grounded_config())
    return extract_json(response.text, {"established": [], "emerging": []})
