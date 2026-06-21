import pandas as pd
import yfinance as yf

def _find_col(df, *names):
    cols = {str(c).lower(): c for c in df.columns}
    for n in names:
        if n.lower() in cols:
            return cols[n.lower()]
    return None

def get_risk_signals(ticker):
    signals = []
    t = yf.Ticker(ticker)

    # 1) Analyst downgrades in the last 90 days
    try:
        ud = t.upgrades_downgrades
        if ud is not None and not ud.empty:
            idx = pd.to_datetime(ud.index)
            if getattr(idx, "tz", None) is not None:
                idx = idx.tz_localize(None)
            recent = ud[idx >= (pd.Timestamp.now() - pd.Timedelta(days=90))]
            acol = _find_col(recent, "action")
            if acol is not None and not recent.empty:
                acts = recent[acol].astype(str).str.lower()
                downs = int((acts == "down").sum())
                ups = int((acts == "up").sum())
                if downs > 0:
                    signals.append({
                        "severity": "high" if (downs >= 3 and downs > ups) else "medium",
                        "label": f"{downs} analyst downgrade{'' if downs == 1 else 's'} (90 days)",
                        "detail": f"{downs} downgrade(s) versus {ups} upgrade(s) from analysts in the past 90 days.",
                    })
    except Exception:
        pass

    # 2) Analyst consensus cooling (recommendations trend, this month vs last)
    try:
        rec = t.recommendations
        cols = ["strongBuy", "buy", "hold", "sell", "strongSell"]
        if rec is not None and not rec.empty and all(c in rec.columns for c in cols) and len(rec) >= 2:
            def neg_share(row):
                total = sum(float(row[c]) for c in cols)
                return None if total == 0 else (float(row["hold"]) + float(row["sell"]) + float(row["strongSell"])) / total
            cur, prev = neg_share(rec.iloc[0]), neg_share(rec.iloc[1])
            if cur is not None and prev is not None and cur - prev > 0.05:
                signals.append({
                    "severity": "medium",
                    "label": "Analyst sentiment cooling",
                    "detail": "The share of hold/sell ratings rose versus the prior month — softening analyst conviction.",
                })
    except Exception:
        pass

    # 3) Net insider activity over the last 6 months
    try:
        ip = t.insider_purchases
        if ip is not None and not ip.empty and len(ip.columns) >= 2:
            label_col = ip.columns[0]
            shares_col = _find_col(ip, "Shares") or ip.columns[1]
            m = ip[ip[label_col].astype(str).str.contains("net shares", case=False, na=False)]
            if not m.empty:
                net_val = float(str(m.iloc[0][shares_col]).replace(",", ""))
                if net_val < 0:
                    signals.append({
                        "severity": "medium",
                        "label": "Net insider selling (6 months)",
                        "detail": f"Insiders sold a net {abs(int(net_val)):,} shares over the past six months.",
                    })
                elif net_val > 0:
                    signals.append({
                        "severity": "good",
                        "label": "Net insider buying (6 months)",
                        "detail": f"Insiders bought a net {int(net_val):,} shares over the past six months — a reassuring sign.",
                    })
    except Exception:
        pass

    return {"signals": signals}