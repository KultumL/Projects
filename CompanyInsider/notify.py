import os
from datetime import datetime
from dotenv import load_dotenv
from supabase import create_client
import resend
from alerts import check_alerts

load_dotenv()

sb = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])
resend.api_key = os.environ["RESEND_API_KEY"]
EMAIL_FROM = os.environ.get("EMAIL_FROM", "onboarding@resend.dev")


def get_users():
    try:
        res = sb.auth.admin.list_users()
    except Exception as e:
        print("Could not list users:", e)
        return []
    users = res if isinstance(res, list) else getattr(res, "users", []) or []
    return [(u.id, u.email) for u in users if getattr(u, "email", None)]


def send_email(to, rows):
    items = "".join(f"<li style='margin:6px 0'>{r['message']}</li>" for r in rows)
    html = (
        "<div style='font-family:system-ui,sans-serif'>"
        f"<h2>🔔 {len(rows)} new alert(s)</h2><ul>{items}</ul>"
        "<p style='color:#888;font-size:12px'>From CompanyInsider · not financial advice</p></div>"
    )
    try:
        resend.Emails.send({
            "from": EMAIL_FROM, "to": [to],
            "subject": f"{len(rows)} new alert(s) from CompanyInsider",
            "html": html,
        })
        print(f"  ✉️  emailed {to} ({len(rows)} alerts)")
    except Exception as e:
        print(f"  email to {to} failed:", e)


def run():
    today = datetime.now().strftime("%Y-%m-%d")
    users = get_users()
    print(f"Checking {len(users)} user(s)…")
    for uid, email in users:
        s = sb.table("alert_settings").select("*").eq("user_id", uid).execute()
        settings = s.data[0] if s.data else None
        if not settings:
            continue
        w = sb.table("saved_companies").select("ticker").eq("user_id", uid).execute()
        tickers = [r["ticker"] for r in (w.data or [])]
        if not tickers:
            continue
        hits = check_alerts(tickers, settings)
        if not hits:
            print(f"  {email}: nothing triggered")
            continue
        rows = [{
            "user_id": uid, "ticker": h["ticker"], "type": h["type"],
            "severity": h["severity"], "message": h["message"],
            "dedup_key": f'{h["ticker"]}:{h["type"]}:{today}',
        } for h in hits]
        keys = [r["dedup_key"] for r in rows]
        existing = sb.table("alert_hits").select("dedup_key").eq("user_id", uid).in_("dedup_key", keys).execute()
        existing_keys = {e["dedup_key"] for e in (existing.data or [])}
        new_rows = [r for r in rows if r["dedup_key"] not in existing_keys]
        if not new_rows:
            print(f"  {email}: no new alerts (already notified today)")
            continue
        sb.table("alert_hits").insert(new_rows).execute()
        send_email(email, new_rows)


if __name__ == "__main__":
    run()