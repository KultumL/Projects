import { useState, useEffect } from "react";
import { GitBranch, Flame, Star, ArrowUpRight } from "lucide-react";
import { API } from "../api";
import SectionHeading from "./SectionHeading";

export default function MomentumPanel({ ticker }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    setData(null);
    fetch(`${API}/api/momentum/${ticker}`).then((r) => r.json()).then(setData).catch(() => setData({ github: [], hn: { count: 0 } }));
  }, [ticker]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <SectionHeading icon={Flame} title="Developer & community traction"
        subtitle="Open-source and tech-community signals — most telling for tech and up-and-coming companies" />
      {!data ? (
        <p className="text-sm text-blue-200/40">Checking GitHub and Hacker News…</p>
      ) : (
        <div className="space-y-4">
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-300/70"><GitBranch size={14} /> Top GitHub projects matching the name</div>
            {data.github?.length ? (
              <ul className="space-y-1.5">
                {data.github.map((g, i) => (
                  <li key={i} className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                    <a href={g.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1 text-blue-100 hover:text-white hover:underline">{g.repo} <ArrowUpRight size={12} /></a>
                    <span className="flex items-center gap-1 text-amber-300"><Star size={13} fill="currentColor" /> {g.stars.toLocaleString()}</span>
                  </li>
                ))}
              </ul>
            ) : <p className="text-sm text-blue-200/40">No notable matching repositories.</p>}
          </div>
          <div>
            <div className="mb-2 flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-300/70"><Flame size={14} /> Hacker News buzz · last 90 days</div>
            {data.hn?.count ? (
              <div className="rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm">
                <span className="font-medium text-orange-300">{data.hn.count.toLocaleString()} mentions</span>
                {data.hn.top && (
                  <a href={data.hn.top.url} target="_blank" rel="noopener noreferrer" className="mt-1 block text-xs text-blue-200/60 hover:text-white hover:underline">Top: “{data.hn.top.title}” ({data.hn.top.points} points)</a>
                )}
              </div>
            ) : <p className="text-sm text-blue-200/40">No recent Hacker News mentions.</p>}
          </div>
        </div>
      )}
      <p className="mt-3 text-xs text-blue-200/30">Live from the GitHub and Hacker News public APIs.</p>
    </div>
  );
}