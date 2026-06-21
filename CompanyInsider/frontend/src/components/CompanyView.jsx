import { useState, useEffect } from "react";
import { Star, Newspaper } from "lucide-react";
import { API } from "../api";
import MetricCard from "./MetricCard";
import StockChart from "./StockChart";
import RiskPanel from "./RiskPanel";
import BriefingPanel from "./BriefingPanel";
import CompetitorPanel from "./CompetitorPanel";
import SectionHeading from "./SectionHeading";


export default function CompanyView({ ticker, toggleSave, isSaved }) {
  const [company, setCompany] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    setCompany(null); setError(null);
    fetch(`${API}/api/company/${ticker}`).then((r) => r.json()).then(setCompany)
      .catch(() => setError("Couldn't reach the API — is the backend running?"));
  }, [ticker]);

  if (error) return <p className="rounded-xl bg-red-500/10 p-4 text-red-200">{error}</p>;
  if (!company) return <p className="text-blue-200/50">Loading…</p>;
  if (company.error) return <p className="text-blue-200/50">Couldn't load that company.</p>;

  const saved = isSaved(company.ticker);
  return (
    <div className="space-y-6 text-left">
      <div className="flex items-start justify-between">
        <div>
          <h3 className="text-3xl font-bold">{company.name}</h3>
          <p className="text-blue-200/60">{company.ticker} · {company.sector}</p>
        </div>
        <button onClick={() => toggleSave({ ticker: company.ticker, name: company.name })} title={saved ? "Saved" : "Save company"}
          className={"flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-sm transition " +
            (saved ? "border-yellow-300/40 bg-yellow-300/10 text-yellow-300" : "border-white/15 text-blue-100 hover:bg-white/10")}>
          <Star size={15} fill={saved ? "currentColor" : "none"} /> {saved ? "Saved" : "Save"}
        </button>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <MetricCard label="Price" info="The current share price and how much it has moved since the previous trading day."
          value={`$${company.price}`} sub={`${company.change >= 0 ? "▲" : "▼"} ${Math.abs(company.change)}`}
          subColor={company.change >= 0 ? "text-emerald-400" : "text-rose-400"} />
        <MetricCard label="Market Cap" info="The company's total value — share price times the number of shares. A rough gauge of size."
          value={company.market_cap} />
        <MetricCard label="P/E Ratio" info="Price-to-Earnings: the dollars you pay for each $1 of yearly profit. Higher usually means investors expect strong growth (or the stock is pricey)."
          value={company.pe_ratio ?? "N/A"} />
        <MetricCard label="Profit Margin" info="The share of revenue kept as profit. A 20% margin means 20 cents of profit on every dollar of sales."
          value={`${company.profit_margin}%`} />
      </div>

      <StockChart ticker={ticker} />
      <RiskPanel ticker={ticker} />
      <BriefingPanel ticker={ticker} />

      {company.news?.length > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl">
          <SectionHeading icon={Newspaper} title="Recent news" subtitle="Latest headlines about this company" />
          <ul className="space-y-2">
            {company.news.map((a, i) => (
              <li key={i} className="text-sm">
                {a.link ? <a href={a.link} target="_blank" rel="noopener noreferrer" className="text-blue-100 hover:text-white hover:underline">{a.title}</a> : <span className="text-blue-100">{a.title}</span>}
                {a.publisher && <span className="text-blue-200/40"> — {a.publisher}</span>}
              </li>
            ))}
          </ul>
        </div>
      )}

      <CompetitorPanel ticker={ticker} />
    </div>
  );
}