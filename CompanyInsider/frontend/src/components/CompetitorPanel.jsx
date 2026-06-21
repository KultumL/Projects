import { useState, useEffect } from "react";
import { Users } from "lucide-react";
import { API } from "../api";
import SectionHeading from "./SectionHeading";
import CompetitorGroup from "./CompetitorGroup";

export default function CompetitorPanel({ ticker }) {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  useEffect(() => { setData(null); setLoading(false); }, [ticker]);

  async function analyze() {
    setLoading(true);
    try { const res = await fetch(`${API}/api/competitors/${ticker}`); setData(await res.json()); }
    catch { setData({ error: "Couldn't reach the API." }); }
    finally { setLoading(false); }
  }

  const button = !data && (
    <button onClick={analyze} disabled={loading}
      className="shrink-0 rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-1.5 text-sm font-medium shadow-lg shadow-blue-500/30 hover:shadow-blue-500/50 disabled:opacity-50">
      {loading ? "Researching…" : "Analyze"}
    </button>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <SectionHeading icon={Users} title="Competitive landscape" subtitle="Who they compete with — and which up-and-comers are catching up" action={button} />
      {loading && <p className="text-sm text-blue-200/40">Researching competitors and scanning the web…</p>}
      {data?.error && <p className="text-sm text-rose-300">{data.error}</p>}
      {data?.comparison && (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-white/10 text-left text-blue-200/50">
                <th className="py-2 pr-4">Ticker</th><th className="py-2 pr-4">Name</th><th className="py-2 pr-4">Price</th>
                <th className="py-2 pr-4">Market Cap</th><th className="py-2 pr-4">P/E</th><th className="py-2">Margin</th>
              </tr>
            </thead>
            <tbody>
              {data.comparison.map((row, i) => (
                <tr key={i} className="border-b border-white/5">
                  <td className="py-2 pr-4 font-medium">{row.Ticker}</td>
                  <td className="py-2 pr-4 text-blue-100/70">{row.Name}</td>
                  <td className="py-2 pr-4">{row.Price}</td>
                  <td className="py-2 pr-4">{row["Market Cap"]}</td>
                  <td className="py-2 pr-4">{row["P/E"]}</td>
                  <td className="py-2">{row.Margin}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {(data?.established || data?.emerging) && (
        <div className="mt-4 space-y-3">
          <CompetitorGroup title="Established competitors" subtitle="Big, well-known rivals" items={data.established || []} defaultOpen />
          <CompetitorGroup title="Emerging competitors" subtitle="Smaller players gaining ground" items={data.emerging || []} />
        </div>
      )}
    </div>
  );
}