import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const CATEGORY_LABELS = {
  "saque": "Saque",
  "cobrança indevida": "Cobrança Indevida",
  "cadastro": "Cadastro",
  "maquininha": "Maquininha",
  "atendimento": "Atendimento",
  "outros": "Outros",
};

const SENTIMENT_COLOR = {
  positive: "var(--pos)",
  negative: "var(--neg)",
  neutral: "var(--neu)",
};

const BAR_COLORS = ["#6c63ff", "#ff5c7a", "#00d4aa", "#ffc94d", "#7b8cde", "#a78bfa"];

function sentimentLabel(avg) {
  if (avg >= 0.4) return { label: "Positivo", color: "var(--pos)" };
  if (avg <= -0.4) return { label: "Negativo", color: "var(--neg)" };
  return { label: "Neutro", color: "var(--neu)" };
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
    await axios.post(`${API}/reviews/scrape?count=200`);
    setScraping(false);
    load();
  };

  const totalReviews = stats?.categories?.reduce((s, c) => s + c.count, 0) || 0;
  const nonOthers = stats?.categories?.filter(c => c.category !== "outros") || [];
  const deflectable = nonOthers.reduce((s, c) => s + c.count, 0);
  const deflectionPct = totalReviews ? Math.round((deflectable / totalReviews) * 100) : 0;

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={s.nav}>
        <span style={s.logo} onClick={() => nav("/")}>
          Infinite<span style={{ color: "var(--accent)" }}>IQ</span>
        </span>
        <div style={s.navLinks}>
          <span style={{ ...s.navItem, color: "var(--accent)" }}>Dashboard</span>
          <button style={s.navBtn} onClick={() => nav("/agent")}>Agente</button>
        </div>
      </nav>

      <div style={s.content}>
        {/* HEADER */}
        <div style={s.header}>
          <div>
            <h1 style={s.title}>Dashboard de Reviews</h1>
            <p style={s.subtitle}>Análise de {totalReviews} reviews reais do InfinitePay no Google Play</p>
          </div>
          <button style={s.scrapeBtn} onClick={handleScrape} disabled={scraping}>
            {scraping ? "Coletando..." : "🔄 Novo Scraping"}
          </button>
        </div>

        {loading ? (
          <div style={s.loading}>Carregando dados...</div>
        ) : (
          <>
            {/* METRIC CARDS */}
            <div style={s.metricsRow}>
              <div style={s.metric}>
                <div style={s.metricValue}>{totalReviews}</div>
                <div style={s.metricLabel}>Reviews analisados</div>
              </div>
              <div style={s.metric}>
                <div style={{ ...s.metricValue, color: "var(--accent)" }}>
                  {stats?.categories?.length || 0}
                </div>
                <div style={s.metricLabel}>Categorias identificadas</div>
              </div>
              <div style={s.metric}>
                <div style={{ ...s.metricValue, color: "var(--pos)" }}>
                  {deflectionPct}%
                </div>
                <div style={s.metricLabel}>Problemas com solução na KB</div>
              </div>
              {stats?.deflection_rate != null && (
                <div style={s.metric}>
                  <div style={{ ...s.metricValue, color: "var(--accent2)" }}>
                    {stats.deflection_rate}%
                  </div>
                  <div style={s.metricLabel}>Deflection rate real do agente</div>
                </div>
              )}
            </div>

            {/* CHART */}
            <div style={s.card}>
              <h2 style={s.cardTitle}>Distribuição por categoria</h2>
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
                    formatter={v => [v, "Reviews"]}
                  />
                  <Bar dataKey="count" radius={[6, 6, 0, 0]}>
                    {stats?.categories?.map((_, i) => (
                      <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* CATEGORIES + SAMPLES */}
            <div style={s.grid}>
              {stats?.categories?.map((cat, i) => {
                const sent = sentimentLabel(cat.avg_sentiment);
                const samples = stats?.samples?.[cat.category] || [];
                return (
                  <div key={cat.category} style={s.catCard}>
                    <div style={s.catHeader}>
                      <div style={{ ...s.catDot, background: BAR_COLORS[i % BAR_COLORS.length] }} />
                      <span style={s.catName}>{CATEGORY_LABELS[cat.category] || cat.category}</span>
                      <span style={s.catCount}>{cat.count} reviews</span>
                    </div>
                    <div style={{ ...s.sentBadge, background: sent.color + "22", color: sent.color }}>
                      {sent.label}
                    </div>
                    <div style={s.samples}>
                      {samples.slice(0, 2).map((r, j) => (
                        <div key={j} style={s.sample}>
                          <div style={s.sampleMeta}>
                            <span style={s.sampleAuthor}>{r.author}</span>
                            <span style={s.stars}>{"⭐".repeat(r.score)}</span>
                          </div>
                          <p style={s.sampleText}>"{r.content.slice(0, 120)}{r.content.length > 120 ? "..." : ""}"</p>
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

const s = {
  page: { minHeight: "100vh" },
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "1.2rem 2rem", borderBottom: "1px solid var(--border)",
    position: "sticky", top: 0, background: "var(--bg)", zIndex: 10,
  },
  logo: { fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.5px", cursor: "pointer" },
  navLinks: { display: "flex", gap: "1rem", alignItems: "center" },
  navItem: { fontSize: "0.9rem", fontWeight: 600 },
  navBtn: {
    background: "transparent", color: "var(--muted)", padding: "0.4rem 1rem",
    borderRadius: "6px", fontSize: "0.9rem",
  },
  content: { maxWidth: 1100, margin: "0 auto", padding: "2.5rem 2rem" },
  header: { display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "2rem", flexWrap: "wrap", gap: "1rem" },
  title: { fontSize: "1.8rem", fontWeight: 800, marginBottom: "0.3rem" },
  subtitle: { color: "var(--muted)", fontSize: "0.95rem" },
  scrapeBtn: {
    background: "var(--surface2)", color: "var(--text)", padding: "0.6rem 1.4rem",
    borderRadius: "8px", fontWeight: 600, fontSize: "0.9rem", border: "1px solid var(--border)",
  },
  loading: { textAlign: "center", color: "var(--muted)", padding: "4rem" },
  metricsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1rem", marginBottom: "2rem" },
  metric: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
    padding: "1.5rem", textAlign: "center",
  },
  metricValue: { fontSize: "2.2rem", fontWeight: 800, marginBottom: "0.3rem" },
  metricLabel: { color: "var(--muted)", fontSize: "0.85rem" },
  card: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
    padding: "1.5rem", marginBottom: "2rem",
  },
  cardTitle: { fontSize: "1.1rem", fontWeight: 700, marginBottom: "1.2rem" },
  grid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "1.2rem" },
  catCard: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.4rem",
  },
  catHeader: { display: "flex", alignItems: "center", gap: "0.6rem", marginBottom: "0.8rem" },
  catDot: { width: 10, height: 10, borderRadius: "50%", flexShrink: 0 },
  catName: { fontWeight: 700, fontSize: "1rem", flex: 1 },
  catCount: { color: "var(--muted)", fontSize: "0.85rem" },
  sentBadge: {
    display: "inline-block", padding: "0.2rem 0.8rem", borderRadius: "999px",
    fontSize: "0.8rem", fontWeight: 600, marginBottom: "1rem",
  },
  samples: { display: "flex", flexDirection: "column", gap: "0.8rem" },
  sample: { background: "var(--surface2)", borderRadius: "8px", padding: "0.8rem" },
  sampleMeta: { display: "flex", justifyContent: "space-between", marginBottom: "0.3rem" },
  sampleAuthor: { fontSize: "0.8rem", fontWeight: 600, color: "var(--muted)" },
  stars: { fontSize: "0.7rem" },
  sampleText: { fontSize: "0.85rem", color: "var(--muted)", lineHeight: 1.5, fontStyle: "italic" },
};
