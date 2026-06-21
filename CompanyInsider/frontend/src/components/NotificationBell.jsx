import { useState } from "react";
import { Bell, RefreshCw } from "lucide-react";

const COLORS = { high: "text-rose-300", good: "text-emerald-300", medium: "text-blue-200" };

export default function NotificationBell({ hits, onCheck, onMarkRead }) {
  const [open, setOpen] = useState(false);
  const [checking, setChecking] = useState(false);
  const unread = hits.filter((h) => !h.read).length;

  function toggle() {
    const next = !open;
    setOpen(next);
    if (next && unread > 0) onMarkRead();
  }
  async function check() {
    setChecking(true);
    await onCheck();
    setChecking(false);
  }

  return (
    <div className="relative">
      <button onClick={toggle} className="relative rounded-lg border border-white/15 p-1.5 text-blue-100 transition hover:bg-white/10">
        <Bell size={16} />
        {unread > 0 && (
          <span className="absolute -right-1 -top-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-500 px-1 text-[10px] font-bold text-white">
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-40" onClick={() => setOpen(false)} />
          <div className="absolute right-0 z-50 mt-2 w-80 overflow-hidden rounded-2xl border border-white/10 bg-slate-900/95 shadow-2xl backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
              <span className="text-sm font-semibold">Notifications</span>
              <button onClick={check} disabled={checking}
                className="flex items-center gap-1 rounded-lg border border-white/15 px-2 py-1 text-xs hover:bg-white/10 disabled:opacity-50">
                <RefreshCw size={12} className={checking ? "animate-spin" : ""} /> {checking ? "Checking…" : "Check now"}
              </button>
            </div>
            <div className="max-h-96 overflow-y-auto">
              {hits.length === 0 ? (
                <p className="px-4 py-8 text-center text-sm text-blue-200/40">No notifications yet. Hit "Check now".</p>
              ) : (
                hits.map((h) => (
                  <div key={h.id} className="border-b border-white/5 px-4 py-3 last:border-0">
                    <p className={"text-sm " + (COLORS[h.severity] || "text-blue-100")}>{h.message}</p>
                    <p className="mt-0.5 text-[11px] text-blue-200/35">{new Date(h.created_at).toLocaleString()}</p>
                  </div>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}