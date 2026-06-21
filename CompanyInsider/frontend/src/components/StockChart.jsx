import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { LineChart as LineChartIcon } from "lucide-react";
import { API } from "../api";
import SectionHeading from "./SectionHeading";

export default function StockChart({ ticker }) {
  const [history, setHistory] = useState(null);
  const [period, setPeriod] = useState("1y");
  useEffect(() => {
    setHistory(null);
    fetch(`${API}/api/history/${ticker}?period=${period}`).then((r) => r.json()).then((d) => setHistory(d.history || [])).catch(() => setHistory([]));
  }, [ticker, period]);

  const toggle = (
    <div className="flex gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5 text-xs">
      {["1y", "5y"].map((p) => (
        <button key={p} onClick={() => setPeriod(p)}
          className={"rounded-md px-3 py-1 font-medium transition " + (period === p ? "bg-gradient-to-r from-blue-500 to-cyan-400 text-white" : "text-blue-200/60 hover:text-white")}>
          {p.toUpperCase()}
        </button>
      ))}
    </div>
  );

  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
      <SectionHeading icon={LineChartIcon} title="Price history" subtitle="How the share price has moved over time" action={toggle} />
      {!history ? <p className="text-blue-200/40">Loading chart…</p>
        : history.length === 0 ? <p className="text-blue-200/40">No price history available.</p>
        : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={history} margin={{ top: 5, right: 5, left: -10, bottom: 0 }}>
              <defs>
                <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity={0.45} />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
              <XAxis dataKey="date" tick={{ fontSize: 11, fill: "rgba(191,219,254,0.45)" }} minTickGap={48} tickLine={false} axisLine={false} />
              <YAxis domain={["auto", "auto"]} tick={{ fontSize: 11, fill: "rgba(191,219,254,0.45)" }} width={48} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v}`} />
              <Tooltip contentStyle={{ background: "rgba(15,23,42,0.9)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "0.75rem" }}
                labelStyle={{ color: "rgba(191,219,254,0.7)" }} itemStyle={{ color: "#fff" }} formatter={(v) => [`$${v}`, "Price"]} />
              <Area type="monotone" dataKey="price" stroke="#38bdf8" strokeWidth={2} fill="url(#priceFill)" />
            </AreaChart>
          </ResponsiveContainer>
        )}
    </div>
  );
}