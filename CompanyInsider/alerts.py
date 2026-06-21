from datetime import datetime
import pandas as pd
import yfinance as yf


def _pct(now, prev):
    if not now or not prev:
        return None
    return (now - prev) / prev * 100


def check_alerts(tickers, settings):
    """Given watchlist tickers + a user's alert settings, return a list of hit dicts."""
    hits = []
    s = settings or {}

    for raw in tickers or []:
        t = (raw or "").upper().strip()
        if not t:
            continue
        try:
            tk = yf.Ticker(t)
            info = tk.info or {}
        except Exception:
            continue

        price = info.get("currentPrice") or info.get("regularMarketPrice") or info.get("regularMarketPreviousClose")
        prev = info.get("regularMarketPreviousClose") or info.get("previousClose")

        # 1) Big daily move
        if s.get("big_move") and price and prev:
            move = _pct(price, prev)
            limit = float(s.get("big_move_pct") or 5)
            if move is not None and abs(move) >= limit:
                hits.append({
                    "ticker": t, "type": "big_move",
                    "severity": "good" if move > 0 else "high",
                    "message": f"{t} is {'up' if move > 0 else 'down'} {abs(move):.1f}% today (${price:,.2f}).",
                })

        # 2) New 52-week high / low
        if s.get("high_low_52w") and price:
            hi, lo = info.get("fiftyTwoWeekHigh"), info.get("fiftyTwoWeekLow")
            if hi and price >= hi * 0.999:
                hits.append({"ticker": t, "type": "high_low_52w", "severity": "good",
                             "message": f"{t} hit a new 52-week high (${price:,.2f})."})
            elif lo and price <= lo * 1.001:
                hits.append({"ticker": t, "type": "high_low_52w", "severity": "high",
                             "message": f"{t} hit a new 52-week low (${price:,.2f})."})

        # 3) Unusual volume
        if s.get("unusual_volume"):
            vol = info.get("regularMarketVolume") or info.get("volume")
            avg = info.get("averageVolume") or info.get("averageVolume10days")
            mult = float(s.get("volume_mult") or 2)
            if vol and avg and vol >= avg * mult:
                hits.append({"ticker": t, "type": "unusual_volume", "severity": "medium",
                             "message": f"{t} volume is {vol / avg:.1f}× its average today."})

        # 4) Analyst upgrade / downgrade in the last 7 days
        if s.get("analyst_change"):
            try:
                ud = tk.upgrades_downgrades
                if ud is not None and not ud.empty:
                    ud = ud.sort_index(ascending=False)
                    d0 = ud.index[0]
                    ld = d0.date() if hasattr(d0, "date") else None
                    if ld and (datetime.now().date() - ld).days <= 7:
                        row = ud.iloc[0]
                        firm = str(row.get("Firm", "An analyst"))
                        action = str(row.get("Action", "")).lower()
                        to_grade = str(row.get("ToGrade", ""))
                        verb = "upgraded" if "up" in action else "downgraded" if "down" in action else "changed its rating on"
                        hits.append({"ticker": t, "type": "analyst_change",
                                     "severity": "good" if "up" in action else "high" if "down" in action else "medium",
                                     "message": f"{firm} {verb} {t}" + (f" to {to_grade}." if to_grade else ".")})
            except Exception:
                pass

        # 5) Insider buying / selling in the last 14 days
        if s.get("insider_activity"):
            try:
                it = tk.insider_transactions
                if it is not None and not it.empty:
                    date_col = next((c for c in it.columns if "date" in c.lower()), None)
                    if date_col is not None:
                        it = it.copy()
                        it["_d"] = pd.to_datetime(it[date_col], errors="coerce")
                        it = it.sort_values("_d", ascending=False)
                        top = it.iloc[0]
                        d = top["_d"]
                        if pd.notna(d) and (datetime.now().date() - d.date()).days <= 14:
                            insider = str(top.get("Insider", "") or top.get("Name", "") or "An insider")
                            txn = str(top.get("Transaction", "") or top.get("Text", "") or "a transaction").strip().rstrip(".")
                            hits.append({"ticker": t, "type": "insider_activity", "severity": "medium",
                                         "message": f"Insider activity at {t}: {insider} — {txn}."})
            except Exception:
                pass

        # 6) Earnings within N days
        if s.get("earnings_soon"):
            try:
                cal = tk.calendar
                dates = cal.get("Earnings Date") if isinstance(cal, dict) else None
                if dates:
                    if not isinstance(dates, (list, tuple)):
                        dates = [dates]
                    today = datetime.now().date()
                    window = int(s.get("earnings_days") or 7)
                    for d in dates:
                        dd = d.date() if hasattr(d, "date") else d
                        delta = (dd - today).days
                        if 0 <= delta <= window:
                            when = "today" if delta == 0 else f"in {delta} day(s)"
                            hits.append({"ticker": t, "type": "earnings_soon", "severity": "medium",
                                         "message": f"{t} reports earnings {when} ({dd})."})
                            break
            except Exception:
                pass

    return hits