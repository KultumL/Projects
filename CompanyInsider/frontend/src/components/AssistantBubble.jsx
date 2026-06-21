import { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { API } from "../api";
import { MessageCircle, X, Send, Bot, FileText, TrendingUp, BarChart3, Newspaper, AlertTriangle, Maximize2, Minimize2 } from "lucide-react";

const CITATIONS = {
  "filing": { label: "SEC Filing", Icon: FileText, source: "From the company's official SEC EDGAR filings (10-K / 20-F annual report)." },
  "live price": { label: "Live Price", Icon: TrendingUp, source: "Live share price from Yahoo Finance." },
  "financials": { label: "Financial Data", Icon: BarChart3, source: "Market cap, revenue, P/E, and margins from Yahoo Finance." },
  "news": { label: "News", Icon: Newspaper, source: "Recent headlines from Yahoo Finance." },
};

function Badge({ label, Icon, source }) {
  const ref = useRef(null);
  const [tip, setTip] = useState(null);
  function show() {
    const r = ref.current.getBoundingClientRect();
    setTip({ left: r.left + r.width / 2, top: r.top - 6 });
  }
  return (
    <span ref={ref} onMouseEnter={show} onMouseLeave={() => setTip(null)}
      className="mx-0.5 inline-flex cursor-help items-center gap-1 rounded-full border border-cyan-400/30 bg-cyan-500/10 px-1.5 py-0.5 align-middle text-[11px] font-medium text-cyan-200">
      <Icon size={10} /> {label}
      {tip && createPortal(
        <span style={{ left: tip.left, top: tip.top }}
          className="pointer-events-none fixed z-[100] max-w-[220px] -translate-x-1/2 -translate-y-full whitespace-normal rounded-lg bg-slate-800 px-2.5 py-1.5 text-[11px] font-normal leading-snug text-blue-100 shadow-xl ring-1 ring-white/10">
          {source}
        </span>,
        document.body
      )}
    </span>
  );
}

function AnswerText({ text }) {
  const parts = text.split(/(\[(?:filing|live price|financials|news)\])/gi);
  return (
    <span className="whitespace-pre-wrap">
      {parts.map((part, i) => {
        const m = part.match(/^\[(filing|live price|financials|news)\]$/i);
        if (m) { const c = CITATIONS[m[1].toLowerCase()]; return <Badge key={i} label={c.label} Icon={c.Icon} source={c.source} />; }
        return part;
      })}
    </span>
  );
}

const SIZES = [
  { h: "h-[22rem]", w: "w-[19rem]" },
  { h: "h-[28rem]", w: "w-[22rem]" },
  { h: "h-[34rem]", w: "w-[27rem]" },
  { h: "h-[42rem]", w: "w-[33rem]" },
];

export default function AssistantBubble({ ticker }) {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [sizeIdx, setSizeIdx] = useState(1);
  useEffect(() => { setMessages([]); }, [ticker]);

  const size = SIZES[sizeIdx];

  async function send() {
    const question = input.trim();
    if (!question || loading) return;
    const history = messages;
    setMessages((p) => [...p, { role: "user", content: question }]);
    setInput(""); setLoading(true);
    try {
      const res = await fetch(`${API}/api/chat`, {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ticker, question, history }),
      });
      const data = await res.json();
      setMessages((p) => [...p, { role: "assistant", content: data.answer || data.error || "Something went wrong.", fallback: data.fallback }]);
    } catch { setMessages((p) => [...p, { role: "assistant", content: "Couldn't reach the agent." }]); }
    finally { setLoading(false); }
  }

  return (
    <>
      {open && (
        <div className={"fixed bottom-24 right-6 z-40 flex max-h-[80vh] max-w-[92vw] flex-col rounded-2xl border border-white/15 bg-slate-900/85 shadow-2xl backdrop-blur-2xl transition-all " + size.h + " " + size.w}>
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
            <span className="flex items-center gap-2 text-sm font-semibold"><Bot size={16} className="text-cyan-300" /> AI Analyst · {ticker}</span>
            <div className="flex items-center gap-1">
              <button onClick={() => setSizeIdx((i) => Math.max(0, i - 1))} disabled={sizeIdx === 0}
                title="Shrink" className="text-blue-200/50 hover:text-white disabled:opacity-30"><Minimize2 size={14} /></button>
              <button onClick={() => setSizeIdx((i) => Math.min(SIZES.length - 1, i + 1))} disabled={sizeIdx === SIZES.length - 1}
                title="Enlarge" className="text-blue-200/50 hover:text-white disabled:opacity-30"><Maximize2 size={14} /></button>
              <button onClick={() => setOpen(false)} title="Close" className="ml-1 text-blue-200/50 hover:text-white"><X size={16} /></button>
            </div>
          </div>
          <div className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
            {messages.length === 0 && (
              <div className="rounded-2xl bg-white/10 px-3 py-2.5 text-sm leading-relaxed text-blue-50">
                Hi! I'm your AI analyst for <span className="font-semibold">{ticker}</span>. I read its filings and pull live data to answer any questions. The tags in my replies — like <Badge label="SEC Filing" Icon={FileText} source="From the company's official SEC EDGAR filings (its 10-K / 20-F annual report)." /> — show where each fact came from (hover any tag to see its source). Try asking "What are the biggest risks in this company?"
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={m.role === "user" ? "text-right" : "text-left"}>
                {m.role === "assistant" && m.fallback && (
                  <div className="mb-1 flex w-fit items-center gap-1.5 rounded-lg border border-amber-400/30 bg-amber-500/10 px-2 py-1 text-[11px] text-amber-200">
                    <AlertTriangle size={11} /> Primary agent hit its daily limit — using a backup model, so answers may be briefer.
                  </div>
                )}
                <div className={"inline-block max-w-[85%] rounded-2xl px-3 py-2 text-sm " + (m.role === "user" ? "whitespace-pre-wrap bg-gradient-to-r from-blue-500 to-cyan-500" : "bg-white/10 text-blue-50")}>
                  {m.role === "assistant" ? <AnswerText text={m.content} /> : m.content}
                </div>
              </div>
            ))}
            {loading && <p className="text-sm text-blue-200/40">Thinking…</p>}
          </div>
          <div className="flex gap-2 border-t border-white/10 p-3">
            <input value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Ask a question…" className="flex-1 rounded-lg border border-white/15 bg-white/5 px-3 py-2 text-sm placeholder-blue-200/40 focus:border-blue-400/60 focus:outline-none" />
            <button onClick={send} disabled={loading} className="rounded-lg bg-gradient-to-r from-blue-500 to-cyan-400 px-3 py-2 disabled:opacity-50"><Send size={16} /></button>
          </div>
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} aria-label="AI assistant"
        className="fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-400 shadow-lg shadow-blue-500/50 transition hover:scale-105">
        {open ? <X size={22} /> : <MessageCircle size={22} />}
      </button>
    </>
  );
}