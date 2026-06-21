import { TrendingUp, Home as HomeIcon, Search, Scale, Lightbulb, Star, Bell, LogIn, LogOut } from "lucide-react";
import NotificationBell from "./NotificationBell";

const BASE_TABS = [
  { id: "home", label: "Home", icon: HomeIcon },
  { id: "explore", label: "Explore", icon: Search },
  { id: "compare", label: "Compare", icon: Scale },
  { id: "thesis", label: "Ideas", icon: Lightbulb },
  { id: "saved", label: "Saved", icon: Star },
];

export default function Header({ view, setView, user, onAuthClick, onLogout, hits, onCheck, onMarkRead }) {
  const tabs = user ? [...BASE_TABS, { id: "alerts", label: "Alerts", icon: Bell }] : BASE_TABS;
  return (
    <header className="sticky top-0 z-30 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-3">
        <button onClick={() => setView("home")} className="flex items-center gap-2">
          <span className="rounded-lg bg-gradient-to-br from-blue-500 to-cyan-400 p-1.5"><TrendingUp size={16} className="text-white" /></span>
          <span className="font-semibold tracking-tight">CompanyInsider</span>
        </button>
        <div className="flex items-center gap-1 sm:gap-2">
          <nav className="flex items-center gap-1">
            {tabs.map((t) => {
              const Icon = t.icon;
              const active = view === t.id;
              return (
                <button key={t.id} onClick={() => setView(t.id)}
                  className={"flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium transition sm:px-3 " +
                    (active ? "bg-white/10 text-white" : "text-blue-200/60 hover:bg-white/5 hover:text-white")}>
                  <Icon size={15} />
                  <span className="hidden sm:inline">{t.label}</span>
                </button>
              );
            })}
          </nav>
          <div className="ml-1 flex items-center gap-2 border-l border-white/10 pl-2 sm:ml-2 sm:pl-3">
            {user ? (
              <>
                <NotificationBell hits={hits} onCheck={onCheck} onMarkRead={onMarkRead} />
                <span className="hidden max-w-[12rem] truncate text-xs text-blue-200/60 md:inline">{user.email}</span>
                <button onClick={onLogout}
                  className="flex items-center gap-1.5 rounded-lg border border-white/15 px-2.5 py-1.5 text-sm text-blue-100 transition hover:bg-white/10">
                  <LogOut size={15} /> <span className="hidden sm:inline">Log out</span>
                </button>
              </>
            ) : (
              <button onClick={onAuthClick}
                className="flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-1.5 text-sm font-semibold transition hover:shadow-lg hover:shadow-blue-500/40">
                <LogIn size={15} /> <span className="hidden sm:inline">Log in</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}