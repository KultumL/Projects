# data.py — all external data fetching (framework-agnostic now)
import time
from functools import lru_cache
import requests
import yfinance as yf
from bs4 import BeautifulSoup

headers = {"User-Agent": "Kultum Lhabaik Kultumlhabaik@gmail.com"}
ANNUAL_FORMS = ["10-K", "20-F", "40-F"]


def format_big_number(n):
    if n is None:
        return "N/A"
    if n >= 1_000_000_000_000:
        return f"${n / 1_000_000_000_000:.2f}T"
    if n >= 1_000_000_000:
        return f"${n / 1_000_000_000:.2f}B"
    if n >= 1_000_000:
        return f"${n / 1_000_000:.2f}M"
    return f"${n:,.0f}"


def fetch_with_retries(url, retries=3):
    for attempt in range(retries):
        try:
            response = requests.get(url, headers=headers, timeout=15)
            response.raise_for_status()
            return response
        except Exception:
            if attempt < retries - 1:
                time.sleep(2 ** attempt)
            else:
                raise


# never changes → cache for the life of the process
@lru_cache(maxsize=1)
def load_companies():
    url = "https://www.sec.gov/files/company_tickers.json"
    data = fetch_with_retries(url).json()
    companies = []
    for c in data.values():
        companies.append({
            "ticker": c["ticker"],
            "name": c["title"],
            "cik": str(c["cik_str"]).zfill(10),
            "label": f'{c["ticker"]} — {c["title"]}'
        })
    return companies


# filings don't change → cache them too
@lru_cache(maxsize=None)
def get_annual_report(cik):
    submissions_url = f"https://data.sec.gov/submissions/CIK{cik}.json"
    data = fetch_with_retries(submissions_url).json()
    recent = data["filings"]["recent"]
    forms = recent["form"]
    accession_numbers = recent["accessionNumber"]
    documents = recent["primaryDocument"]

    filing_index = None
    filing_form = None
    for i, form in enumerate(forms):
        if form in ANNUAL_FORMS:
            filing_index = i
            filing_form = form
            break
    if filing_index is None:
        return None, None

    accession = accession_numbers[filing_index].replace("-", "")
    document_name = documents[filing_index]
    cik_no_zeros = cik.lstrip("0")
    filing_url = f"https://www.sec.gov/Archives/edgar/data/{cik_no_zeros}/{accession}/{document_name}"
    raw_html = fetch_with_retries(filing_url).text
    soup = BeautifulSoup(raw_html, "html.parser")
    return soup.get_text(), filing_form


# live data → fetched fresh each call (no caching needed yet)
def get_stock_data(ticker):
    try:
        stock = yf.Ticker(ticker)
        history = stock.history(period="5d")
        if history.empty:
            return None
        closes = history["Close"]
        latest = closes.iloc[-1]
        previous = closes.iloc[-2] if len(closes) >= 2 else latest
        return {"price": latest, "change": latest - previous}
    except Exception:
        return None


def get_financials(ticker):
    try:
        info = yf.Ticker(ticker).info
        return {
            "sector": info.get("sector", "N/A"),
            "market_cap": info.get("marketCap"),
            "pe_ratio": info.get("trailingPE"),
            "revenue": info.get("totalRevenue"),
            "profit_margin": info.get("profitMargins"),
        }
    except Exception:
        return {"sector": "N/A", "market_cap": None, "pe_ratio": None,
                "revenue": None, "profit_margin": None}


def get_recent_news(ticker):
    return get_news(ticker)

def _extract(item):
    c = item.get("content", item)  # current yfinance nests news under "content"
    prov = c.get("provider") or {}
    cu = c.get("canonicalUrl") or {}
    return {
        "title": c.get("title") or "",
        "publisher": prov.get("displayName", "") if isinstance(prov, dict) else (item.get("publisher") or ""),
        "link": (cu.get("url", "") if isinstance(cu, dict) else "") or item.get("link", ""),
        "summary": c.get("summary") or c.get("description") or "",
    }

def get_news(ticker, name="", max_items=6):
    if not name:
        try:
            for c in load_companies():
                if c["ticker"].upper() == ticker.upper():
                    name = c["name"]
                    break
        except Exception:
            pass
    raw = []
    try: raw += yf.Search(name or ticker, news_count=15).news or []
    except Exception: pass
    try: raw += yf.Ticker(ticker).news or []
    except Exception: pass

    stop = {"inc", "inc.", "corp", "corp.", "corporation", "company", "co", "co.",
            "ltd", "plc", "the", "group", "holdings", "&"}
    terms = {ticker.lower()}
    for w in (name or "").lower().replace(",", " ").split():
        if w not in stop and len(w) > 2:
            terms.add(w)

    seen, relevant, backup = set(), [], []
    for item in raw:
        a = _extract(item)
        if not a["title"] or a["link"] in seen:
            continue
        seen.add(a["link"])
        hay = (a["title"] + " " + a["summary"]).lower()
        (relevant if any(t in hay for t in terms) else backup).append(a)

    out = (relevant or backup)[:max_items]
    return [{"title": a["title"], "publisher": a["publisher"], "link": a["link"]} for a in out]