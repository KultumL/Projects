import { Star, ArrowRight } from "lucide-react";

export default function SavedView({ saved, openCompany, toggleSave }) {
  return (
    <div className="mx-auto max-w-4xl px-6 py-12">
      <h2 className="text-3xl font-bold">Saved companies</h2>
      <p className="mt-2 text-blue-100/60">Companies you've starred for quick access. Saved on this device.</p>
      {saved.length === 0 ? (
        <div className="mt-10 rounded-2xl border border-dashed border-white/15 bg-white/5 p-10 text-center text-blue-200/50">
          <Star size={28} className="mx-auto mb-3 text-blue-200/30" />
          Nothing saved yet. Find a company and tap the star to keep it here.
        </div>
      ) : (
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {saved.map((c) => (
            <div key={c.ticker} className="group flex items-center justify-between rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-xl transition hover:border-white/20">
              <button onClick={() => openCompany(c.ticker)} className="flex flex-1 items-center justify-between text-left">
                <div>
                  <p className="font-semibold">{c.ticker}</p>
                  <p className="text-sm text-blue-200/60">{c.name}</p>
                </div>
                <ArrowRight size={16} className="text-blue-200/30 transition group-hover:translate-x-0.5 group-hover:text-blue-200/70" />
              </button>
              <button onClick={() => toggleSave(c)} className="ml-3 text-yellow-300" title="Remove"><Star size={18} fill="currentColor" /></button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}