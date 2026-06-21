# api.py — the CompanyInsider backend (FastAPI)
import os
from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from google import genai
from google.genai import types
import yfinance as yf
from compare import compare_companies
from briefing import get_briefing
from thesis import generate_thesis
from risk import get_risk_signals
from momentum import github_traction, hn_buzz, clean_name
from alerts import check_alerts
from data import (
    load_companies, get_annual_report, get_stock_data,
    get_financials, get_recent_news, format_big_number,
)
from rag import build_chunk_index, retrieve_chunks
from competitors import get_competitor_comparison, get_competitive_landscape

load_dotenv()
client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))
AGENT_MODEL = "gemini-2.5-flash-lite"   # swap to gemini-2.5-flash when quota's healthy

app = FastAPI(title="CompanyInsider API")

origins = os.getenv("ALLOWED_ORIGINS", "*").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

AGENT_MODEL = "gemini-2.5-flash-lite"   # swap to gemini-2.5-flash when quota's healthy
AGENT_FALLBACK = "gemini-2.5-flash"     # separate free-tier quota — used if the primary is tapped out
def find_company(ticker):
    ticker = ticker.upper()
    for c in load_companies():
        if c["ticker"] == ticker:
            return c
    return None
class AlertCheck(BaseModel):
    tickers: list[str] = []
    settings: dict = {}

class ThesisRequest(BaseModel):
    risk: str
    horizon: str
    theme: str = ""

@app.post("/api/check-alerts")
def check_alerts_route(body: AlertCheck):
    return {"hits": check_alerts(body.tickers, body.settings)}

@app.get("/api/risk/{ticker}")
def risk(ticker: str):
    try:
        return get_risk_signals(ticker)
    except Exception:
        return {"signals": []}
    
@app.get("/api/momentum/{ticker}")
def momentum(ticker: str):
    info = find_company(ticker)
    name = clean_name(info["name"]) if info else ticker
    return {"name": name, "github": github_traction(name), "hn": hn_buzz(name)}

@app.post("/api/thesis")
def thesis(req: ThesisRequest):
    try:
        return generate_thesis(req.risk, req.horizon, req.theme)
    except Exception as e:
        msg = str(e)
        if any(k in msg for k in ("503", "UNAVAILABLE", "overloaded")):
            return {"error": "The AI model is briefly overloaded — try again in a moment."}
        if any(k in msg for k in ("429", "RESOURCE_EXHAUSTED")):
            return {"error": "Daily AI quota reached — resets at midnight Pacific."}
        return {"error": f"Thesis unavailable: {msg}"}
@app.get("/")
def home():
    return {"status": "CompanyInsider API is running 🚀"}

@app.get("/api/briefing/{ticker}")
def briefing(ticker: str):
    info = find_company(ticker)
    if not info:
        return {"error": "company not found"}
    try:
        return get_briefing(info["name"], info["ticker"])
    except Exception as e:
        return {"error": f"briefing unavailable (likely rate-limited): {e}"}

@app.get("/api/search")
def search(q: str):
    q = q.lower()
    matches = []
    for c in load_companies():
        if q in c["ticker"].lower() or q in c["name"].lower():
            matches.append({"ticker": c["ticker"], "name": c["name"], "label": c["label"]})
        if len(matches) >= 10:
            break
    return matches


@app.get("/api/company/{ticker}")
def company(ticker: str):
    info = find_company(ticker)
    if not info:
        return {"error": "company not found"}

    stock = get_stock_data(ticker)
    fin = get_financials(ticker)
    news = get_recent_news(ticker)

    return {
        "ticker": info["ticker"],
        "name": info["name"],
        "price": round(float(stock["price"]), 2) if stock else None,
        "change": round(float(stock["change"]), 2) if stock else None,
        "market_cap": format_big_number(fin["market_cap"]),
        "pe_ratio": round(float(fin["pe_ratio"]), 1) if fin["pe_ratio"] else None,
        "profit_margin": round(float(fin["profit_margin"]) * 100, 1) if fin["profit_margin"] else None,
        "sector": fin["sector"],
        "revenue": format_big_number(fin["revenue"]),
        "news": news,
    }


@app.get("/api/compare/{ticker_a}/{ticker_b}")
def compare(ticker_a: str, ticker_b: str):
    a = find_company(ticker_a)
    b = find_company(ticker_b)
    if not a or not b:
        return {"error": "one or both companies not found"}
    try:
        return compare_companies(a["name"], a["ticker"], b["name"], b["ticker"])
    except Exception as e:
        msg = str(e)
        if any(k in msg for k in ("503", "UNAVAILABLE", "overloaded")):
            return {"error": "The AI model is briefly overloaded — try again in a moment."}
        if any(k in msg for k in ("429", "RESOURCE_EXHAUSTED")):
            return {"error": "Daily AI quota reached — resets at midnight Pacific."}
        return {"error": f"Comparison unavailable: {msg}"}
@app.get("/api/history/{ticker}")
def history(ticker: str, period: str = "1y"):
    if period not in ("1y", "5y"):
        period = "1y"
    try:
        hist = yf.Ticker(ticker).history(period=period)
        if hist.empty:
            return {"history": []}
        if period == "5y":
            hist = hist.resample("W").last().dropna()
            fmt = "%b %Y"
        else:
            fmt = "%b %d"
        points = [
            {"date": d.strftime(fmt), "price": round(float(c), 2)}
            for d, c in zip(hist.index, hist["Close"])
        ]
        return {"history": points}
    except Exception:
        return {"history": []}
    
@app.get("/api/competitors/{ticker}")
def competitors(ticker: str):
    info = find_company(ticker)
    if not info:
        return {"error": "company not found"}
    fin = get_financials(ticker)
    try:
        df = get_competitor_comparison(info["name"], info["ticker"])
        landscape = get_competitive_landscape(info["name"], fin["sector"])
        return {
            "comparison": df.to_dict(orient="records"),
            "established": landscape.get("established", []),
            "emerging": landscape.get("emerging", []),
        }
    except Exception as e:
        return {"error": f"competitor analysis unavailable (likely rate-limited): {e}"}

# ---- the request shape for chat (FastAPI validates this for you) ----
class ChatRequest(BaseModel):
    ticker: str
    question: str
    history: list = []


@app.post("/api/chat")
def chat(req: ChatRequest):
    info = find_company(req.ticker)
    if not info:
        return {"error": "company not found"}

    # get + index the filing (cached per ticker after the first time)
    filing_text, filing_form = get_annual_report(info["cik"])
    if filing_text is None:
        return {"error": "no annual report on file for this company"}
    chunks, chunk_vecs = build_chunk_index(info["ticker"], filing_text)

    # the agent's tools — they can see THIS company's filing
    retrieved_log = []

    def search_filing(query: str) -> str:
        """Search the company's annual report for information relevant to the query.
        Use for questions about risks, business, strategy, or disclosures.

        Args:
            query: what to look for in the filing
        """
        print(f"🔧 search_filing({query[:50]})")
        result = retrieve_chunks(query, chunks, chunk_vecs, top_k=5)
        retrieved_log.append(result)
        return result

    def get_stock_price(ticker: str) -> str:
        """Get the latest stock price and daily change for a US-listed ticker.

        Args:
            ticker: stock ticker symbol, e.g. AAPL or NVDA
        """
        print(f"🔧 get_stock_price({ticker})")
        data = get_stock_data(ticker)
        if not data:
            return "Price unavailable."
        return f"${data['price']:.2f} (change {data['change']:+.2f} since previous close)"

    def get_company_financials(ticker: str) -> str:
        """Get market cap, P/E ratio, revenue, and profit margin for a US-listed ticker.

        Args:
            ticker: stock ticker symbol
        """
        print(f"🔧 get_company_financials({ticker})")
        f = get_financials(ticker)
        return (f"Sector: {f['sector']}; Market cap: {format_big_number(f['market_cap'])}; "
                f"Revenue: {format_big_number(f['revenue'])}; P/E: {f['pe_ratio']}; "
                f"Profit margin: {f['profit_margin']}")

    def get_company_news(ticker: str) -> str:
        """Get recent news headlines for a US-listed ticker.

        Args:
            ticker: stock ticker symbol
        """
        print(f"🔧 get_company_news({ticker})")
        items = get_recent_news(ticker)
        if not items:
            return "No recent news."
        return "\n".join(f"- {a['title']} ({a['publisher']})" for a in items)

    tools = [search_filing, get_stock_price, get_company_financials, get_company_news]

    # fold the conversation history into the prompt
    history_text = ""
    for msg in req.history:
        speaker = "User" if msg.get("role") == "user" else "Analyst"
        history_text += f"{speaker}: {msg.get('content', '')}\n"

    prompt = f"""You are a financial analyst for {info['name']} (ticker: {info['ticker']}, this year's filing is a {filing_form}).
Use your tools to look up whatever you need — the filing (search_filing), live price, financials, or news. Call as many as the question requires.
When you state a fact, briefly note its source in brackets, e.g. [filing], [live price], [financials], or [news].

Conversation so far:
{history_text}
User's new question: {req.question}

Answer it."""

    answer, used_fallback, err = None, False, None
    for i, model in enumerate((AGENT_MODEL, AGENT_FALLBACK)):
        try:
            response = client.models.generate_content(
                model=model,
                contents=prompt,
                config=types.GenerateContentConfig(tools=tools),
            )
            answer = response.text
            used_fallback = i > 0
            break
        except Exception as e:
            err = str(e)
            busy = any(k in err for k in ("503", "UNAVAILABLE", "overloaded", "429", "RESOURCE_EXHAUSTED"))
            if busy and i == 0:
                continue  # primary overloaded / out of quota → try the backup model
            break

    if answer is None:
        return {"error": f"agent unavailable (likely rate-limited): {err}"}

    return {"answer": answer, "filing_form": filing_form, "sources": retrieved_log, "fallback": used_fallback}