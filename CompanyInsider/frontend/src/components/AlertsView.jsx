import { useState, useEffect } from "react";
import { supabase } from "../supabase";
import { Bell, TrendingUp, Target, Activity, BarChart3, Users, CalendarClock, Check } from "lucide-react";
import SectionHeading from "./SectionHeading";

const DEFAULTS = {
  big_move: false, big_move_pct: 5,
  high_low_52w: false,
  unusual_volume: false, volume_mult: 2,
  analyst_change: false,
  insider_activity: false,
  earnings_soon: false, earnings_days: 7,
};

const ALERTS = [
  { key: "big_move", icon: TrendingUp, title: "Big daily move",
    desc: "When a watchlist stock jumps or drops sharply in a single day.",
    num: { key: "big_move_pct", label: "More than", suffix: "% in a day", min: 1 } },
  { key: "high_low_52w", icon: Activity, title: "52-week high or low",
    desc: "When a stock hits a new high or low for the year." },
  { key: "unusual_volume", icon: BarChart3, title: "Unusual volume",
    desc: "When trading volume spikes far above its normal level.",
    num: { key: "volume_mult", label: "At least", suffix: "× average volume", min: 1.5, step: 0.5 } },
  { key: "analyst_change", icon: Target, title: "Analyst upgrade or downgrade",
    desc: "When a Wall Street firm raises or lowers its rating." },
  { key: "insider_activity", icon: Users, title: "Insider buying or selling",
    desc: "When a company executive buys or sells their own shares." },
  { key: "earnings_soon", icon: CalendarClock, title: "Earnings coming up",
    desc: "A heads-up before a watchlist company reports earnings.",
    num: { key: "earnings_days", label: "Within", suffix: "days", min: 1 } },
];

function Switch({ on, onClick }) {
  return (
    <button onClick={onClick} role="switch" aria-checked={on}
      className={"relative h-6 w-11 shrink-0 rounded-full transition " + (on ? "bg-cyan-400" : "bg-white/15")}>
      <span className={"absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-all " + (on ? "left-[22px]" : "left-0.5")} />
    </button>
  );
}

export default function AlertsView({ user }) {
  const [s, setS] = useState(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [savedFlash, setSavedFlash] = useState(false);

  useEffect(() => {
    supabase.from("alert_settings").select("*").eq("user_id", user.id).maybeSingle()
      .then(({ data }) => { if (data) setS({ ...DEFAULTS, ...data }); setLoading(false); });
  }, [user]);

  async function persist(next) {
    await supabase.from("alert_settings").upsert({ user_id: user.id, ...next, updated_at: new Date().toISOString() });
    setSavedFlash(true); setTimeout(() => setSavedFlash(false), 1500);
  }

  function toggle(key) { const next = { ...s, [key]: !s[key] }; setS(next); persist(next); }
  function setNum(key, val) { setS({ ...s, [key]: val }); }
  function commitNum() { persist(s); }

  if (loading) return <div className="mx-auto max-w-2xl px-6 py-16 text-center text-blue-200/50">Loading your alerts…</div>;

  return (
    <div className="mx-auto max-w-2xl px-6 pb-24 pt-10">
      <SectionHeading icon={Bell} title="Alert settings" subtitle="Choose what to be notified about across your watchlist" />
      <div className="mt-5 space-y-3">
        {ALERTS.map((a) => {
          const Icon = a.icon;
          const on = s[a.key];
          return (
            <div key={a.key} className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl">
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <span className={"mt-0.5 inline-flex rounded-xl p-2 " + (on ? "bg-gradient-to-br from-blue-500/80 to-cyan-400/80" : "bg-white/10")}>
                    <Icon size={16} className="text-white" />
                  </span>
                  <div>
                    <p className="font-medium">{a.title}</p>
                    <p className="text-sm text-blue-100/55">{a.desc}</p>
                  </div>
                </div>
                <Switch on={on} onClick={() => toggle(a.key)} />
              </div>
              {a.num && on && (
                <div className="mt-3 flex items-center gap-2 pl-12 text-sm text-blue-100/70">
                  <span>{a.num.label}</span>
                  <input type="number" min={a.num.min} step={a.num.step || 1} value={s[a.num.key]}
                    onChange={(e) => setNum(a.num.key, Number(e.target.value))} onBlur={commitNum}
                    className="w-16 rounded-lg border border-white/15 bg-white/5 px-2 py-1 text-center outline-none focus:border-cyan-400/50" />
                  <span>{a.num.suffix}</span>
                </div>
              )}
            </div>
          );
        })}
      </div>
      <p className="mt-5 flex items-center gap-1.5 text-sm text-emerald-300/80" style={{ visibility: savedFlash ? "visible" : "hidden" }}>
        <Check size={15} /> Saved
      </p>
      <p className="mt-2 text-xs text-blue-200/40">
        Price-target alerts for specific companies are set on each company's page. Notifications get wired up next.
      </p>
    </div>
  );
}