import InfoTip from "./InfoTip";

export default function MetricCard({ label, value, sub, subColor, info }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-white/20">
      <div className="flex items-center text-xs font-medium uppercase tracking-wide text-blue-200/60">
        {label}{info && <InfoTip text={info} />}
      </div>
      <p className="mt-1 text-2xl font-semibold">{value}</p>
      {sub && <p className={`mt-1 text-sm font-medium ${subColor}`}>{sub}</p>}
    </div>
  );
}