import { useState } from "react";
import { Lightbulb, ArrowRight } from "lucide-react";
import { API } from "../api";

const RISKS = ["Conservative", "Balanced", "Aggressive"];
const HORIZONS = ["Short (~1 yr)", "Medium (~3 yr)", "Long (5 yr+)"];

function Segmented({ options, value, onChange }) {
  return (
    <div className="flex flex-wrap gap-1 rounded-xl border border-white/10 bg-white/5 p-1">
      {options.map((o) => (
        <button key={o} onClick={() => onChange(o)}
          className={"rounded-lg px-3 py-1.5 text-sm font-medium transition " + (value === o ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white" : "text-blue-200/60 hover:text-white")}>
          {o}
        </button>
      ))}
    </div>
  );
}

export default function ThesisView({ openCompany }) {
  const [risk, setRisk] = useState("Balanced");
  const [horizon, setHorizon] = useState("Medium (~3 yr)");
  const [theme, setTheme] = useState("");
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);

  async function generate() {
    setLoading(true); setData(null);
    try {
      const res = await fetch(`${API}/api/thesis`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ risk, horizon, theme }),
      });
      setData(await res.json());
    } catch { setData({ error: "Couldn't reach the API." }); }
    finally { setLoading(false); }
  }

  return (
    <div className="mx-auto max-w-3xl px-6 py-12">
      <div className="flex items-center gap-3">
        <span className="rounded-xl border border-white/10 bg-white/5 p-2 text-cyan-300"><Lightbulb size={20} /></span>
        <div>
          <h2 className="text-3xl font-bold">Investment ideas</h2>
          <p className="text-blue-100/60">Tell us your goals and get three companies worth researching, with reasons and sources.</p>
        </div>
      </div>

      <div className="mt-8 space-y-5 rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-200/50">How much risk are you comfortable with?</p>
          <Segmented options={RISKS} value={risk} onChange={setRisk} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-200/50">How long do you plan to hold?</p>
          <Segmented options={HORIZONS} value={horizon} onChange={setHorizon} />
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-blue-200/50">Any theme or industry? (optional)</p>
          <input value={theme} onChange={(e) => setTheme(e.target.value)} placeholder="e.g. AI infrastructure, clean energy, healthcare…"
            className="w-full rounded-xl border border-white/15 bg-white/10 px-4 py-2.5 text-sm placeholder-blue-200/40 focus:border-blue-400/60 focus:outline-none" />
        </div>
        <button onClick={generate} disabled={loading}
          className="rounded-xl bg-gradient-to-r from-blue-500 to-cyan-400 px-6 py-2.5 text-sm font-semibold shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50">
          {loading ? "Thinking…" : "Get ideas"}
        </button>
      </div>

      {loading && <p className="mt-6 text-sm text-blue-200/40">Researching companies that fit your goals…</p>}
      {data?.error && <p className="mt-6 text-sm text-rose-300">{data.error}</p>}

      {data?.picks?.length > 0 && (
        <div className="mt-8 space-y-4">
          {data.picks.map((p, i) => (
            <div key={i} className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div>
                  <span className="text-lg font-bold text-cyan-200">{p.ticker}</span>
                  <span className="text-blue-200/60"> · {p.name}</span>
                </div>
                {openCompany && (
                  <button onClick={() => openCompany(p.ticker)}
                    className="flex items-center gap-1 rounded-lg border border-white/15 px-3 py-1 text-xs text-blue-100 hover:bg-white/10">
                    View <ArrowRight size={13} />
                  </button>
                )}
              </div>
              <p className="mt-2 text-sm leading-relaxed text-blue-50">{p.reason}</p>
              {p.source && <p className="mt-2 text-xs text-blue-300/50">Source: {p.source}</p>}
            </div>
          ))}
          <p className="text-xs italic text-blue-200/40">These are AI-generated research ideas, not recommendations or financial advice. Always do your own research.</p>
        </div>
      )}
    </div>
  );
}