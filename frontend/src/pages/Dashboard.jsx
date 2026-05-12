import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import axios from "axios";
import "../css/dashboard.css";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CATEGORY_LABELS = {
  "saque": "Saque",
  "cobrança indevida": "Cobrança Indevida",
  "cadastro": "Cadastro",
  "maquininha": "Maquininha",
  "atendimento": "Atendimento",
  "outros": "Outros",
};

const BAR_COLORS = ["#39e75f", "#ff5c7a", "#c8ff00", "#ffc94d", "#4db8a0", "#7a9e8e"];

const SCRAPE_MESSAGES = [
  "Buscando avaliações no Google Play...",
  "Analisando o que os clientes estão dizendo...",
  "Classificando problemas por categoria...",
  "Quase lá...",
];

function sentimentLabel(avg) {
  if (avg >= 0.4) return { label: "Positivo", color: "var(--pos)" };
  if (avg <= -0.4) return { label: "Negativo", color: "var(--neg)" };
  return { label: "Neutro", color: "var(--neu)" };
}

function ScrapeOverlay() {
  const [msgIdx, setMsgIdx] = useState(0);
  useEffect(() => {
    const interval = setInterval(() => {
      setMsgIdx(i => (i + 1) % SCRAPE_MESSAGES.length);
    }, 3000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="scrape-overlay">
      <div className="scrape-overlay-card">
        <div className="overlay-spinner" />
        <p className="overlay-title">Atualizando avaliações</p>
        <p className="overlay-msg">{SCRAPE_MESSAGES[msgIdx]}</p>
        <div className="overlay-bar">
          <div className="overlay-bar-fill" />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [scraping, setScraping] = useState(false);
  const nav = useNavigate();

  const load = () => {
    setLoading(true);
    axios.get(`${API}/reviews/stats`)
      .then(r => setStats(r.data))
      .finally(() => setLoading(false));
  };

  useEffect(() => { load(); }, []);

  const handleScrape = async () => {
    setScraping(true);
    await axios.post(`${API}/reviews/scrape?count=100&reset=true`);
    setScraping(false);
    load();
  };

  const totalReviews = stats?.categories?.reduce((s, c) => s + c.count, 0) || 0;
  const nonOthers = stats?.categories?.filter(c => c.category !== "outros") || [];
  const deflectable = nonOthers.reduce((s, c) => s + c.count, 0);
  const deflectionPct = totalReviews ? Math.round((deflectable / totalReviews) * 100) : 0;

  return (
    <div className="dash-page">
      {scraping && <ScrapeOverlay />}

      <nav className="dash-nav">
        <span className="logo" onClick={() => nav("/")} style={{ cursor: "pointer" }}>
          Infinite<span className="logo-accent">IQ</span>
        </span>
        <div className="nav-links">
          <span className="nav-btn active">Dashboard</span>
          <button className="nav-btn" onClick={() => nav("/agent")}>Agente</button>
        </div>
      </nav>

      <div className="dash-content">
        <div className="dash-header">
          <div>
            <h1 className="dash-title">Dashboard de Avaliações</h1>
            <p className="dash-subtitle">
              {totalReviews > 0
                ? `${totalReviews} avaliações reais do InfinitePay no Google Play`
                : "Nenhuma avaliação ainda — clique em Atualizar"}
            </p>
          </div>
          <button className="scrape-btn" onClick={handleScrape} disabled={scraping}>
            🔄 Atualizar avaliações
          </button>
        </div>

        {loading ? (
          <div className="dash-loading">
            <div className="overlay-spinner" style={{ width: 32, height: 32, borderWidth: 3 }} />
            <p>Carregando dados...</p>
          </div>
        ) : totalReviews === 0 ? (
          <div className="dash-empty">
            <p className="empty-icon">📊</p>
            <p className="empty-title">Nenhuma avaliação ainda</p>
            <p className="empty-desc">Clique em "Atualizar avaliações" para buscar e analisar as avaliações mais recentes do InfinitePay.</p>
            <button className="empty-btn" onClick={handleScrape}>Buscar avaliações agora</button>
          </div>
        ) : (
          <>
            <div className="metrics-row">
              <div className="metric-card">
                <div className="metric-value">{totalReviews}</div>
                <div className="metric-label">Avaliações analisadas</div>
              </div>
              <div className="metric-card">
                <div className="metric-value accent">{stats?.categories?.length || 0}</div>
                <div className="metric-label">Tipos de problema</div>
              </div>
              <div className="metric-card">
                <div className="metric-value pos">{deflectionPct}%</div>
                <div className="metric-label">Resolvíveis automaticamente</div>
              </div>
              {stats?.deflection_rate != null && (
                <div className="metric-card">
                  <div className="metric-value accent">{stats.deflection_rate}%</div>
                  <div className="metric-label">Taxa de resolução do agente</div>
                </div>
              )}
            </div>

            <div className="chart-card">
              <h2 className="card-title">Problemas mais relatados</h2>
              <ResponsiveContainer width="100%" height={260}>
                <BarChart data={stats?.categories || []} margin={{ top: 10, right: 20, left: 0, bottom: 5 }}>
                  <XAxis
                    dataKey="category"
                    tick={{ fill: "var(--muted)", fontSize: 12 }}
                    tickFormatter={k => CATEGORY_LABELS[k] || k}
                  />
                  <YAxis tick={{ fill: "var(--muted)", fontSize: 12 }} />
                  <Tooltip
                    contentStyle={{ background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: 8 }}
                    labelFormatter={k => CATEGORY_LABELS[k] || k}
                    formatter={v => [v, "Avaliações"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats?.categories?.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="category-grid">
              {stats?.categories?.map((cat, i) => {
                const sent = sentimentLabel(cat.avg_sentiment);
                const samples = stats?.samples?.[cat.category] || [];
                return (
                  <div key={cat.category} className="category-card">
                    <div className="category-header">
                      <div className="category-dot" style={{ background: BAR_COLORS[i % BAR_COLORS.length] }} />
                      <span className="category-name">{CATEGORY_LABELS[cat.category] || cat.category}</span>
                      <span className="category-count">{cat.count} avaliações</span>
                    </div>
                    <span
                      className="sentiment-badge"
                      style={{ background: sent.color + "22", color: sent.color }}
                    >
                      {sent.label}
                    </span>
                    <div className="review-samples">
                      {samples.slice(0, 2).map((r, j) => (
                        <div key={j} className="review-sample">
                          <div className="review-meta">
                            <span className="review-author">{r.author}</span>
                            <span className="review-stars">{"⭐".repeat(r.score)}</span>
                          </div>
                          <p className="review-text">"{r.content.slice(0, 120)}{r.content.length > 120 ? "..." : ""}"</p>
                        </div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </div>
    </div>
  );
}
