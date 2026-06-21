import { useState } from "react";
import { Scale, X } from "lucide-react";
import { API } from "../api";

function CompanyPicker({ label, selected, onSelect }) {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  async function search(q) {
    setQuery(q);
    if (!q.trim()) { setResults([]); return; }
    try { const r = await fetch(`${API}/api/search?q=${encodeURIComponent(q)}`); setResults(await r.json()); }
    catch { setResults([]); }
  }
  function pick(r) { onSelect(r); setQuery(""); setResults([]); }
  return (
    <div className="relative flex-1">
      <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-200/50">{label}</p>
      {selected ? (
        <div className="flex items-center justify-between rounded-xl border border-white/15 bg-white/10 px-4 py-3 backdrop-blur-xl">
          <span><span className="font-semibold">{selected.ticker}</span><span className="text-blue-200/50"> — {selected.name}</span></span>
          <button onClick={() => onSelect(null)} className="text-blue-200/50 hover:text-white"><X size={16} /></button>
        </div>
      ) : (
        <>
          <input value={query} onChange={(e) => search(e.target.value)} placeholder="Search a company…"
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm placeholder-blue-200/40 backdrop-blur-xl focus:border-blue-400/60 focus:outline-none" />
          {results.length > 0 && (
            <ul className="absolute z-20 mt-2 w-full overflow-hidden rounded-xl border border-white/15 bg-slate-900/90 shadow-2xl backdrop-blur-xl">
              {results.map((r) => (
                <li key={r.ticker}>
                  <button onClick={() => pick(r)} className="block w-full px-4 py-2.5 text-left text-sm hover:bg-white/10">
                    <span className="font-medium">{r.ticker}</span><span className="text-blue-200/50"> — {r.name}</span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </>
      )}
    </div>
  );
}

export default function CompareView() {
  const [a, setA] = useState(null);
  const [b, setB] = useState(null);
  const [dataA, setDataA] = useState(null);
  const [dataB, setDataB] = useState(null);
  const [synth, setSynth] = useState(null);
  const [loading, setLoading] = useState(false);

  async function runCompare() {
    if (!a || !b) return;
    setLoading(true); setDataA(null); setDataB(null); setSynth(null);
    try {
      const [ra, rb, rc] = await Promise.all([
        fetch(`${API}/api/company/${a.ticker}`).then((r) => r.json()),
        fetch(`${API}/api/company/${b.ticker}`).then((r) => r.json()),
        fetch(`${API}/api/compare/${a.ticker}/${b.ticker}`).then((r) => r.json()),
      ]);
      setDataA(ra); setDataB(rb); setSynth(rc);
    } catch { setSynth({ error: "Couldn't reach the API." }); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-5xl px-6 py-12">
      <div className="flex items-center gap-3">
        <span className="rounded-xl border border-white/10 bg-white/5 p-2 text-cyan-300"><Scale size={20} /></span>
        <div>
          <h2 className="text-3xl font-bold">Compare two companies</h2>
          <p className="text-blue-100/60">See how any two public companies stack up, side by side.</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-end">
        <CompanyPicker label="Company A" selected={a} onSelect={setA} />
        <span className="hidden pb-3 text-blue-200/40 sm:block">vs</span>
        <CompanyPicker label="Company B" selected={b} onSelect={setB} />
        <button onClick={runCompare} disabled={!a || !b || loading}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-3 text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-40">
          {loading ? "Comparing…" : "Compare"}
        </button>
      </div>

      {dataA && dataB && (
        <div className="mt-10 space-y-8">
          <div className="overflow-hidden rounded-2xl border border-white/10 bg-white/5 backdrop-blur-xl">
            <div className="grid grid-cols-3 border-b border-white/10 px-5 py-3 text-sm font-semibold">
              <span className="text-blue-200/50">Metric</span>
              <span className="text-right">{dataA.ticker}</span>
              <span className="text-right">{dataB.ticker}</span>
            </div>
            {[
              ["Price", `$${dataA.price}`, `$${dataB.price}`],
              ["Market Cap", dataA.market_cap, dataB.market_cap],
              ["P/E Ratio", dataA.pe_ratio ?? "N/A", dataB.pe_ratio ?? "N/A"],
              ["Profit Margin", `${dataA.profit_margin}%`, `${dataB.profit_margin}%`],
              ["Revenue", dataA.revenue, dataB.revenue],
              ["Sector", dataA.sector, dataB.sector],
            ].map(([label, va, vb], i) => (
              <div key={i} className="grid grid-cols-3 border-b border-white/5 px-5 py-2.5 text-sm last:border-0">
                <span className="text-blue-200/50">{label}</span>
                <span className="text-right">{va}</span>
                <span className="text-right">{vb}</span>
              </div>
            ))}
          </div>

          {synth && !synth.error && (
            <div className="space-y-4 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <h4 className="text-sm font-semibold uppercase tracking-wide text-blue-200/60">AI comparison</h4>
              {[["Strategy", synth.strategy], ["Financials", synth.financials], ["Growth trajectory", synth.growth]].map(([t, body], i) => body && (
                <div key={i}>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-blue-300/70">{t}</p>
                  <p className="text-sm leading-relaxed text-blue-50">{body}</p>
                </div>
              ))}
              {synth.verdict && (
                <div className="rounded-xl border border-cyan-400/20 bg-cyan-500/5 p-3">
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-cyan-300/80">Bottom line</p>
                  <p className="text-sm text-blue-50">{synth.verdict}</p>
                </div>
              )}
              <p className="text-xs italic text-blue-200/40">AI-generated analysis for research only — not financial advice.</p>
            </div>
          )}
          {synth?.error && <p className="text-sm text-rose-300">{synth.error}</p>}
        </div>
      )}
    </div>
  );
}