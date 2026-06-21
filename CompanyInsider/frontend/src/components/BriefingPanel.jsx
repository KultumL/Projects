import { useState, useEffect } from "react";
import { Compass, FileText, AlertTriangle, Eye } from "lucide-react";
import { API } from "../api";
import SectionHeading from "./SectionHeading";

export default function BriefingPanel({ ticker }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setData(null); setLoading(false); }, [ticker]);

  async function load() {
    setLoading(true);
    try { const r = await fetch(`${API}/api/briefing/${ticker}`); setData(await r.json()); }
    catch { setData({ error: "Couldn't reach the API." }); }
    finally { setLoading(false); }
  }

  const button = !data && (
    <button onClick={load} disabled={loading}
      className="shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-1.5 text-sm font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50">
      {loading ? "Analyzing…" : "Generate"}
    </button>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <SectionHeading icon={Compass} title="AI research briefing"
        subtitle="A summarization on the last 90 days — what happened, what's risky, what's next" action={button} />
      {loading && <p className="text-sm text-blue-200/40">Scanning the last 90 days across the web…</p>}
      {data?.error && <p className="text-sm text-rose-300">{data.error}</p>}
      {data && !data.error && (
        <div className="space-y-5">
          {data.narrative && (
            <div>
              <div className="mb-1.5 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-300/70"><FileText size={14} /> What's been happening</div>
              <p className="text-sm leading-relaxed text-blue-50">{data.narrative}</p>
            </div>
          )}
          {data.risks?.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-300/70"><AlertTriangle size={14} /> Potential concerns</div>
              <ul className="space-y-2">
                {data.risks.map((r, i) => (
                  <li key={i} className="rounded-lg border border-rose-400/20 bg-rose-500/5 px-3 py-2 text-sm">
                    <span className="font-medium text-rose-200">{r.signal}</span><span className="text-blue-100/70"> — {r.detail}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {data.watch?.length > 0 && (
            <div>
              <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-300/70"><Eye size={14} /> What to watch next quarter</div>
              <ul className="space-y-2">
                {data.watch.map((w, i) => (
                  <li key={i} className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <span className="font-medium text-cyan-200">{w.catalyst}</span><span className="text-blue-100/70"> — {w.detail}</span>
                    {w.source && <span className="mt-1 block text-xs text-blue-300/50">Source: {w.source}</span>}
                  </li>
                ))}
              </ul>
              <p className="mt-3 text-xs italic text-blue-200/40">AI-generated analysis for research only — not financial advice.</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}