import { useState, useEffect } from "react";
import { Search, Star } from "lucide-react";
import { API } from "../api";
import CompanyView from "./CompanyView";

export default function Explore({ ticker, setTicker, toggleSave, isSaved }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);

  useEffect(() => {
    if (!query.trim()) { setResults([]); return; }
    fetch(`${API}/api/search?q=${encodeURIComponent(query)}`).then((r) => r.json()).then(setResults).catch(() => setResults([]));
  }, [query]);

  function pick(t) { setTicker(t); setQuery(""); setResults([]); }

  return (
    <div className="mx-auto max-w-6xl px-6 py-12">
      <div className="text-center">
        <h2 className="text-3xl font-bold">Explore a company</h2>
        <p className="mt-2 text-blue-100/60">Search any public company by name or ticker to see its full profile.</p>
        <div className="relative mx-auto mt-6 max-w-lg">
          <Search size={18} className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-blue-200/40" />
          <input type="text" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Try “Apple”, “NVDA”, “Tesla”…"
            className="w-full rounded-xl border border-white/15 bg-white/10 py-3 pl-11 pr-4 text-sm placeholder-blue-200/40 backdrop-blur-xl focus:border-blue-400/60 focus:outline-none" />
          {results.length > 0 && (
            <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/15 bg-slate-900/90 text-left shadow-2xl backdrop-blur-xl">
              {results.map((r) => (
                <li key={r.ticker} className="flex items-center hover:bg-white/10">
                  <button onClick={() => pick(r.ticker)} className="flex-1 px-4 py-2.5 text-left text-sm">
                    <span className="font-medium">{r.ticker}</span><span className="text-blue-200/50"> — {r.name}</span>
                  </button>
                  <button onClick={() => toggleSave({ ticker: r.ticker, name: r.name })} title="Save company"
                    className={"px-3 " + (isSaved(r.ticker) ? "text-yellow-300" : "text-blue-200/40 hover:text-yellow-300")}>
                    <Star size={16} fill={isSaved(r.ticker) ? "currentColor" : "none"} />
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
      {ticker && <div className="mt-12"><CompanyView ticker={ticker} toggleSave={toggleSave} isSaved={isSaved} /></div>}
    </div>
  );
}