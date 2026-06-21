import { useState } from "react";
import { supabase } from "../supabase";
import { X, LogIn } from "lucide-react";

export default function AuthModal({ onClose }) {
  const [mode, setMode] = useState("signup");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [msg, setMsg] = useState(null);
  const [loading, setLoading] = useState(false);

  async function submit() {
    if (!email || !password) return;
    setMsg(null); setLoading(true);
    if (mode === "signup") {
      const { data, error } = await supabase.auth.signUp({ email, password });
      setLoading(false);
      if (error) return setMsg({ type: "error", text: error.message });
      if (!data.session) return setMsg({ type: "ok", text: "Account created — check your email to confirm, then log in." });
      onClose();
    } else {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      setLoading(false);
      if (error) return setMsg({ type: "error", text: error.message });
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-slate-950/80 p-6 backdrop-blur-sm" onClick={onClose}>
      <div className="w-full max-w-sm rounded-3xl border border-white/10 bg-slate-900/95 p-7 shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-bold">{mode === "signup" ? "Create your account" : "Welcome back"}</h2>
          <button onClick={onClose} className="text-blue-200/50 hover:text-white"><X size={20} /></button>
        </div>
        <p className="mt-1 text-sm text-blue-100/60">
          {mode === "signup" ? "Sign up to save companies and track updates." : "Log in to access your saved companies."}
        </p>

        <div className="mt-5 space-y-3">
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-blue-200/30 focus:border-cyan-400/50" />
          <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Password (6+ characters)"
            onKeyDown={(e) => e.key === "Enter" && submit()}
            className="w-full rounded-lg border border-white/15 bg-white/5 px-3 py-2.5 text-sm outline-none placeholder:text-blue-200/30 focus:border-cyan-400/50" />
        </div>

        {msg && (
          <p className={"mt-3 rounded-lg px-3 py-2 text-sm " + (msg.type === "error" ? "bg-red-500/10 text-red-200" : "bg-emerald-500/10 text-emerald-200")}>
            {msg.text}
          </p>
        )}

        <button onClick={submit} disabled={loading || !email || !password}
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-4 py-2.5 text-sm font-semibold transition hover:shadow-lg hover:shadow-blue-500/40 disabled:opacity-50">
          <LogIn size={16} /> {loading ? "Please wait…" : mode === "signup" ? "Sign up" : "Log in"}
        </button>

        <p className="mt-4 text-center text-sm text-blue-100/60">
          {mode === "signup" ? "Already have an account? " : "New here? "}
          <button onClick={() => { setMode(mode === "signup" ? "login" : "signup"); setMsg(null); }} className="font-semibold text-cyan-300 hover:underline">
            {mode === "signup" ? "Log in" : "Create one"}
          </button>
        </p>
      </div>
    </div>
  );
}