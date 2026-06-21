import { useState, useEffect } from "react";
import { ShieldAlert, AlertTriangle, CheckCircle2 } from "lucide-react";
import { API } from "../api";
import SectionHeading from "./SectionHeading";

const TONE = {
  high: { box: "border-rose-400/30 bg-rose-500/10 text-rose-200", Icon: AlertTriangle },
  medium: { box: "border-amber-400/30 bg-amber-500/10 text-amber-200", Icon: AlertTriangle },
  good: { box: "border-emerald-400/30 bg-emerald-500/10 text-emerald-200", Icon: CheckCircle2 },
};

export default function RiskPanel({ ticker }) {
  const [data, setData] = useState(null);
  useEffect(() => {
    setData(null);
    fetch(`${API}/api/risk/${ticker}`).then((r) => r.json()).then(setData).catch(() => setData({ signals: [] }));
  }, [ticker]);

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <SectionHeading icon={ShieldAlert} title="Risk signals" subtitle="Live flags from insider trading and analyst rating changes" />
      {!data ? (
        <p className="text-sm text-blue-200/40">Checking insider activity and analyst actions…</p>
      ) : data.signals.length === 0 ? (
        <p className="text-sm text-blue-200/40">No notable data-driven flags right now.</p>
      ) : (
        <ul className="space-y-2">
          {data.signals.map((s, i) => {
            const tone = TONE[s.severity] || TONE.medium;
            const Icon = tone.Icon;
            return (
              <li key={i} className={"flex gap-2 rounded-lg border px-3 py-2 text-sm " + tone.box}>
                <Icon size={16} className="mt-0.5 shrink-0" />
                <div>
                  <span className="font-medium">{s.label}</span>
                  <span className="block text-xs text-blue-100/60">{s.detail}</span>
                </div>
              </li>
            );
          })}
        </ul>
      )}
      <p className="mt-3 text-xs text-blue-200/30">From insider transactions (SEC-sourced) and analyst rating changes, via Yahoo Finance.</p>
    </div>
  );
}