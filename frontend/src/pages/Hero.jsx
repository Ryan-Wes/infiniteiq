import { useNavigate } from "react-router-dom";

const PAIN_POINTS = [
  { icon: "🔐", label: "Contas bloqueadas sem aviso" },
  { icon: "💳", label: "Cobranças indevidas e taxas altas" },
  { icon: "📱", label: "App travando na maquininha" },
  { icon: "🎧", label: "Atendimento lento e automatizado" },
  { icon: "💸", label: "Saque retido sem justificativa" },
];

export default function Hero() {
  const nav = useNavigate();

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={s.nav}>
        <span style={s.logo}>Infinite<span style={{ background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>IQ</span></span>
        <div style={s.navLinks}>
          <button style={s.navBtn} onClick={() => nav("/dashboard")}>Dashboard</button>
          <button style={s.navBtn} onClick={() => nav("/agent")}>Agente</button>
        </div>
      </nav>

      {/* HERO */}
      <section style={s.hero}>
        <div style={s.badge}>Case Study · CloudWalk / InfinitePay</div>
        <h1 style={s.title}>
          Inteligência de suporte<br />
          <span style={{ background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>construída com dados reais</span>
        </h1>
        <p style={s.subtitle}>
          Analisei centenas de reviews reais do InfinitePay no Google Play,
          identifiquei os principais problemas e construí um agente que resolve
          automaticamente os mais frequentes — com raciocínio visível.
        </p>
        <div style={s.ctaRow}>
          <button style={s.ctaPrimary} onClick={() => nav("/dashboard")}>
            Ver Dashboard
          </button>
          <button style={s.ctaSecondary} onClick={() => nav("/agent")}>
            Testar Agente
          </button>
        </div>
      </section>

      {/* PAIN POINTS */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Problemas encontrados nos reviews reais</h2>
        <div style={s.cardGrid}>
          {PAIN_POINTS.map((p) => (
            <div key={p.label} style={s.card}>
              <span style={s.cardIcon}>{p.icon}</span>
              <span style={s.cardLabel}>{p.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* HOW IT WORKS */}
      <section style={s.section}>
        <h2 style={s.sectionTitle}>Como funciona</h2>
        <div style={s.stepsRow}>
          {[
            { n: "1", title: "Coleta", desc: "Reviews reais do Google Play classificados por categoria e sentimento via OpenAI" },
            { n: "2", title: "Dashboard", desc: "Visualize a distribuição de dor, sentimento por categoria e exemplos reais" },
            { n: "3", title: "Agente", desc: "O agente classifica, busca na base de conhecimento e responde — ou escala para humano" },
          ].map((step) => (
            <div key={step.n} style={s.step}>
              <div style={s.stepNum}>{step.n}</div>
              <h3 style={s.stepTitle}>{step.title}</h3>
              <p style={s.stepDesc}>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer style={s.footer}>
        Construído por Wesley Ryan · Case study para CloudWalk
      </footer>
    </div>
  );
}

const s = {
  page: { minHeight: "100vh", display: "flex", flexDirection: "column" },
  nav: {
    display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "1.2rem 2rem", borderBottom: "1px solid var(--border)",
    position: "sticky", top: 0, background: "var(--bg)", zIndex: 10,
  },
  logo: { fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.5px" },
  navLinks: { display: "flex", gap: "1rem" },
  navBtn: {
    background: "transparent", color: "var(--muted)", padding: "0.4rem 1rem",
    borderRadius: "6px", fontSize: "0.9rem",
    transition: "color 0.2s",
  },
  hero: {
    maxWidth: 760, margin: "6rem auto 4rem", padding: "0 2rem", textAlign: "center",
  },
  badge: {
    display: "inline-block", background: "var(--surface2)", color: "var(--accent)",
    padding: "0.3rem 1rem", borderRadius: "999px", fontSize: "0.8rem",
    fontWeight: 600, marginBottom: "1.5rem", border: "1px solid var(--border)",
  },
  title: { fontSize: "clamp(2rem, 5vw, 3.2rem)", fontWeight: 800, lineHeight: 1.2, marginBottom: "1.2rem" },
  subtitle: { color: "var(--muted)", fontSize: "1.1rem", marginBottom: "2.5rem", lineHeight: 1.7 },
  ctaRow: { display: "flex", gap: "1rem", justifyContent: "center", flexWrap: "wrap" },
  ctaPrimary: {
    background: "var(--accent-gradient)", color: "#0d1117", padding: "0.8rem 2rem",
    borderRadius: "8px", fontWeight: 700, fontSize: "1rem",
  },
  ctaSecondary: {
    background: "var(--surface2)", color: "var(--text)", padding: "0.8rem 2rem",
    borderRadius: "8px", fontWeight: 600, fontSize: "1rem", border: "1px solid var(--border)",
  },
  section: { maxWidth: 900, margin: "0 auto 5rem", padding: "0 2rem", width: "100%" },
  sectionTitle: { fontSize: "1.5rem", fontWeight: 700, marginBottom: "2rem", textAlign: "center" },
  cardGrid: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "1rem" },
  card: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px",
    padding: "1.5rem 1rem", display: "flex", flexDirection: "column",
    alignItems: "center", gap: "0.8rem", textAlign: "center",
  },
  cardIcon: { fontSize: "2rem" },
  cardLabel: { color: "var(--muted)", fontSize: "0.9rem", fontWeight: 500 },
  stepsRow: { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.5rem" },
  step: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "12px", padding: "1.8rem",
  },
  stepNum: {
    width: 36, height: 36, borderRadius: "50%", background: "var(--accent-gradient)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontWeight: 700, marginBottom: "1rem", color: "#0d1117",
  },
  stepTitle: { fontSize: "1.1rem", fontWeight: 700, marginBottom: "0.5rem" },
  stepDesc: { color: "var(--muted)", fontSize: "0.9rem", lineHeight: 1.6 },
  footer: {
    marginTop: "auto", textAlign: "center", padding: "2rem",
    color: "var(--muted)", fontSize: "0.85rem", borderTop: "1px solid var(--border)",
  },
};
