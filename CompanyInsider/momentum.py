import os, time, requests
from functools import lru_cache

_GH_HEADERS = {"Accept": "application/vnd.github+json"}
if os.getenv("GITHUB_TOKEN"):  # optional: lifts 60/hr → 5000/hr
    _GH_HEADERS["Authorization"] = f"Bearer {os.getenv('GITHUB_TOKEN')}"

def clean_name(name):
    drop = {"corp", "corporation", "inc", "co", "ltd", "plc", "the", "company", "holdings", "group", "&"}
    words = [w for w in name.split() if w.lower().strip(",.") not in drop]
    return " ".join(words[:2]) if words else name

@lru_cache(maxsize=256)
def github_traction(name):
    try:
        r = requests.get("https://api.github.com/search/repositories",
            params={"q": name, "sort": "stars", "order": "desc", "per_page": 3},
            headers=_GH_HEADERS, timeout=10)
        if r.status_code != 200:
            return []
        return [{"repo": it["full_name"], "stars": it["stargazers_count"], "url": it["html_url"]}
                for it in r.json().get("items", [])]
    except Exception:
        return []

@lru_cache(maxsize=256)
def hn_buzz(name):
    try:
        cutoff = int(time.time()) - 90 * 24 * 3600
        r = requests.get("https://hn.algolia.com/api/v1/search_by_date",
            params={"query": name, "tags": "story", "numericFilters": f"created_at_i>{cutoff}"}, timeout=10)
        if r.status_code != 200:
            return {"count": 0, "top": None}
        data = r.json()
        hits = data.get("hits", [])
        top = None
        if hits:
            best = max(hits, key=lambda h: h.get("points") or 0)
            top = {"title": best.get("title"), "points": best.get("points"),
                   "url": f"https://news.ycombinator.com/item?id={best.get('objectID')}"}
        return {"count": data.get("nbHits", len(hits)), "top": top}
    except Exception:
        return {"count": 0, "top": None}