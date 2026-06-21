import { useState } from "react";
import { ChevronDown, ChevronUp } from "lucide-react";

export default function CompetitorGroup({ title, subtitle, items, defaultOpen }) {
  const [open, setOpen] = useState(defaultOpen || false);
  return (
    <div className="overflow-hidden rounded-xl border border-white/10 bg-white/5">
      <button onClick={() => setOpen((o) => !o)} className="flex w-full items-center justify-between px-4 py-3 text-left hover:bg-white/5">
        <div>
          <span className="text-sm font-semibold">{title} <span className="text-blue-200/40">({items.length})</span></span>
          {subtitle && <span className="block text-xs text-blue-200/40">{subtitle}</span>}
        </div>
        {open ? <ChevronUp size={16} className="text-blue-200/50" /> : <ChevronDown size={16} className="text-blue-200/50" />}
      </button>
      {open && (items.length ? (
        <ul className="space-y-2 px-4 pb-4">
          {items.map((c, i) => (
            <li key={i} className="text-sm"><span className="font-medium text-blue-100">{c.name}</span><span className="text-blue-200/60"> — {c.note}</span></li>
          ))}
        </ul>
      ) : <p className="px-4 pb-4 text-sm text-blue-200/40">None found.</p>)}
    </div>
  );
}