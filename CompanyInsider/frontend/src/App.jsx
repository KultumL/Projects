import { useState, useEffect } from "react";
import { supabase } from "./supabase";
import { API } from "./api";
import Header from "./components/Header";
import Home from "./components/Home";
import Explore from "./components/Explore";
import SavedView from "./components/SavedView";
import CompareView from "./components/CompareView";
import ThesisView from "./components/ThesisView";
import AssistantBubble from "./components/AssistantBubble";
import OnboardingOverlay from "./components/OnboardingOverlay";
import AuthModal from "./components/AuthModal";
import AlertsView from "./components/AlertsView";

export default function App() {
  const [view, setView] = useState("home");
  const [ticker, setTicker] = useState(null);
  const [saved, setSaved] = useState([]);
  const [showTour, setShowTour] = useState(() => !localStorage.getItem("tourDone"));
  const [user, setUser] = useState(null);
  const [showAuth, setShowAuth] = useState(false);
  const [hits, setHits] = useState([]);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!user) { setSaved([]); setHits([]); return; }
    supabase.from("saved_companies").select("ticker, name").order("created_at")
      .then(({ data, error }) => { if (!error) setSaved(data || []); });
    loadHits();
    checkAlerts();
  }, [user]);

  async function loadHits() {
    const { data } = await supabase.from("alert_hits").select("*").order("created_at", { ascending: false }).limit(50);
    setHits(data || []);
  }

  async function checkAlerts() {
    if (!user) return;
    const [{ data: settings }, { data: watch }] = await Promise.all([
      supabase.from("alert_settings").select("*").eq("user_id", user.id).maybeSingle(),
      supabase.from("saved_companies").select("ticker").eq("user_id", user.id),
    ]);
    const tickers = (watch || []).map((w) => w.ticker);
    if (settings && tickers.length) {
      try {
        const res = await fetch(`${API}/api/check-alerts`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ tickers, settings }),
        });
        const { hits: found } = await res.json();
        const today = new Date().toISOString().slice(0, 10);
        const rows = (found || []).map((h) => ({
          user_id: user.id, ticker: h.ticker, type: h.type, severity: h.severity,
          message: h.message, dedup_key: `${h.ticker}:${h.type}:${today}`,
        }));
        if (rows.length) {
          await supabase.from("alert_hits").upsert(rows, { onConflict: "user_id,dedup_key", ignoreDuplicates: true });
        }
      } catch { /* backend unreachable — keep existing hits */ }
    }
    await loadHits();
  }

  async function markHitsRead() {
    setHits((prev) => prev.map((h) => ({ ...h, read: true })));
    await supabase.from("alert_hits").update({ read: true }).eq("read", false);
  }

  function finishTour() { localStorage.setItem("tourDone", "1"); setShowTour(false); }

  async function toggleSave(c) {
    if (!user) { setShowAuth(true); return; }
    const already = saved.some((x) => x.ticker === c.ticker);
    if (already) {
      setSaved((prev) => prev.filter((x) => x.ticker !== c.ticker));
      await supabase.from("saved_companies").delete().eq("ticker", c.ticker);
    } else {
      setSaved((prev) => [...prev, { ticker: c.ticker, name: c.name }]);
      await supabase.from("saved_companies").insert({ ticker: c.ticker, name: c.name, user_id: user.id });
    }
  }
  const isSaved = (t) => saved.some((x) => x.ticker === t);
  function openCompany(t) { setTicker(t); setView("explore"); }

  async function logout() { await supabase.auth.signOut(); setView("home"); }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-blue-950 to-indigo-950 text-white">
      <Header view={view} setView={setView} user={user} onAuthClick={() => setShowAuth(true)} onLogout={logout}
        hits={hits} onCheck={checkAlerts} onMarkRead={markHitsRead} />
      {view === "home" && <Home onStart={() => setView("explore")} />}
      {view === "explore" && <Explore ticker={ticker} setTicker={setTicker} toggleSave={toggleSave} isSaved={isSaved} />}
      {view === "compare" && <CompareView />}
      {view === "thesis" && <ThesisView openCompany={openCompany} />}
      {view === "saved" && <SavedView saved={saved} openCompany={openCompany} toggleSave={toggleSave} />}
      {view === "alerts" && user && <AlertsView user={user} />}
      {view === "explore" && ticker && <AssistantBubble ticker={ticker} />}
      {showTour && <OnboardingOverlay onFinish={finishTour} goTo={setView} />}
      {showAuth && <AuthModal onClose={() => setShowAuth(false)} />}
    </div>
  );
}