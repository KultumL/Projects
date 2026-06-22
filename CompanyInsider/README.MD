# CompanyInsider

An AI research platform that turns SEC filings and live market data into clear, source-grounded insights about public companies. The goal is simple: give anyone the kind of company research that normally sits behind expensive analyst terminals.

**Live website:** https://companyinsider-six.vercel.app
**API:** https://kultuml-companyinsider-api.hf.space ([interactive docs](https://kultuml-companyinsider-api.hf.space/docs))

---

## What it does

You search for a public company and get a single, readable picture of how it is doing:

- **Company overview** with a live price, daily change, market cap, P/E, revenue, profit margin, sector, and recent news.
- **Price history charts** over one or five years.
- **An AI analyst you can chat with** that reads the company's annual report and pulls live data to answer questions, tagging every fact with its source.
- **AI briefings** summarizing the most important recent developments, risks, and catalysts to watch.
- **Competitor analysis** comparing the company against peers on valuation and margins, plus a map of established and emerging competitors.
- **Side-by-side comparison** of any two companies on strategy, financials, growth, and the key trade-off.
- **An investment thesis generator** that suggests companies to research based on a chosen risk tolerance and time horizon.
- **Risk signals** drawn from analyst downgrades, cooling sentiment, and net insider activity.
- **A configurable Trend Tracker** that watches your saved companies for big price moves, 52-week highs and lows, unusual volume, analyst rating changes, insider activity, and upcoming earnings, then surfaces them in a notification bell.
- **Accounts and watchlists** so each user has their own saved companies and alert preferences.

This is an educational research tool, not financial advice.

---

## How the AI works

CompanyInsider uses two distinct AI patterns on purpose, and the difference is worth understanding.

### 1. Agentic RAG for the chat analyst

The `/api/chat` endpoint is built on Google Gemini function calling. The model is given four real Python tools and decides on its own which to call, and how many times, to answer a question:

- `search_filing` runs semantic retrieval over the company's annual report.
- `get_stock_price` returns the latest price and daily change.
- `get_company_financials` returns market cap, P/E, revenue, and margin.
- `get_company_news` returns recent headlines.

The retrieval step is RAG. When a filing is first requested, its full text is split into overlapping 2,000-character chunks and each chunk is embedded with a `sentence-transformers` model (`all-MiniLM-L6-v2`). At query time the question is embedded the same way, and the top five chunks are selected by cosine similarity. Embeddings are cached per company so each filing is only embedded once. This is an in-memory vector search rather than a dedicated vector database, which keeps the system lightweight while still being true semantic retrieval.

The model is prompted to cite the origin of each fact inline, for example `[filing]`, `[live price]`, `[financials]`, or `[news]`, and the frontend renders those as labeled source badges.

### 2. Google Search grounding for briefings and theses

Briefings, the competitive landscape, and the thesis and comparison generators use Gemini with Google Search grounding instead of RAG. These features need current, broad web context rather than retrieval over a single document, so they let the model search the web and return structured JSON.

Both paths share a retry-and-fallback layer: the primary model is `gemini-2.5-flash-lite`, and if it is overloaded or out of free-tier quota the request automatically falls back to `gemini-2.5-flash`, which has a separate quota.

---

## Tech stack

**Backend:** Python, FastAPI, Pydantic, google-genai SDK, sentence-transformers, NumPy, yfinance, pandas, requests, BeautifulSoup4

**Frontend:** React, Vite, Tailwind CSS, lucide-react, supabase-js

**Data and infrastructure:** SEC EDGAR, Yahoo Finance (via yfinance), Supabase (Postgres + auth), Google Gemini API, Resend (email)

**Deployment:** Frontend on Vercel, backend on Hugging Face Spaces

---

## Project structure

```
CompanyInsider/
  api.py            FastAPI app and all route handlers
  data.py           SEC EDGAR and yfinance data fetching
  rag.py            Chunking, embeddings, and cosine-similarity retrieval
  gemini.py         Gemini client, retry/fallback, grounded and JSON configs
  alerts.py         Trend Tracker alert checks
  briefing.py       AI company briefing (search-grounded)
  compare.py        Two-company comparison (JSON output)
  competitors.py    Competitor table and competitive landscape
  thesis.py         Investment thesis generator (search-grounded)
  risk.py           Risk signals from analyst and insider data
  notify.py         Standalone email-notification script (run locally)
  frontend/
    src/
      components/   React UI components
      api.js        Backend API base URL
      supabase.js   Supabase client
```

---

## Getting started

### Prerequisites

- Python 3.10 or newer
- Node.js 18 or newer
- A Google Gemini API key
- A Supabase project (for auth and user data)

### 1. Backend

```bash
git clone https://github.com/KultumL/company-insider.git
cd company-insider

python -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

Create a `.env` file in the project root:

```
GEMINI_API_KEY=your_gemini_key
ALLOWED_ORIGINS=http://localhost:5173,https://your-frontend-domain
```

Run the API:

```bash
uvicorn api:app --reload
```

The interactive docs are then at http://localhost:8000/docs.

### 2. Frontend

```bash
cd frontend
npm install
```

Create `frontend/.env`:

```
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_ANON_KEY=your_supabase_publishable_key
VITE_API_URL=http://localhost:8000
```

The Supabase publishable (anon) key is safe to expose in the browser because access is controlled by row-level security. Make sure `VITE_API_URL` matches what `frontend/src/api.js` expects.

```bash
npm run dev
```

### 3. Supabase setup

Create these tables, each protected by row-level security so users only see their own rows:

- `saved_companies` (user_id, ticker, name) for watchlists
- `alert_settings` (user_id, plus a boolean and threshold for each alert type) for per-user preferences
- `alert_hits` (user_id, ticker, type, severity, message, dedup_key, read, created_at) for the notification feed, with a unique constraint on (user_id, dedup_key) to prevent duplicates
- `price_targets` (user_id, ticker, target_price, direction) for per-company price alerts


## Deployment

- **Frontend:** deployed to Vercel from the `frontend` directory. Environment variables are set in the Vercel project settings rather than uploaded from a local file.
- **Backend:** deployed to a Hugging Face Space. The `GEMINI_API_KEY` is set as a Space secret. `notify.py` and the local `.env` are intentionally not deployed.

Because the build servers are case-sensitive Linux, component filenames and import paths must match exactly.

---

## Roadmap

- Make news citations link directly to their source articles
- Surface per-company price-target alerts in the UI
- Add a scheduled job to run `notify.py` automatically
- Verify a sending domain so alert emails reach all users
- Add browser history routing on the frontend

---

## Disclaimer

CompanyInsider is an educational and portfolio project. Nothing it produces is financial advice or a recommendation to buy or sell any security. Market data may be delayed, and AI-generated text can contain errors. Always do your own research and consult a licensed professional before making investment decisions.
