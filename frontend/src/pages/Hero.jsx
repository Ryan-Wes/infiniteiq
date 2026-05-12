import { useNavigate } from "react-router-dom";
import { useEffect, useRef } from "react";
import "../css/hero.css";

const PROBLEMS = [
  { n: "18", label: "reclamações de atendimento" },
  { n: "17", label: "cobranças indevidas relatadas" },
  { n: "16", label: "problemas com maquininha" },
  { n: "14", label: "bloqueios de conta" },
];

export default function Hero() {
  const nav = useNavigate();
  const heroRef = useRef(null);

  useEffect(() => {
    const items = heroRef.current?.querySelectorAll("[data-animate]");
    if (!items) return;
    items.forEach((el, i) => {
      el.style.opacity = "0";
      el.style.transform = "translateY(24px)";
      el.style.transition = `opacity .6s ease ${i * 0.1}s, transform .6s ease ${i * 0.1}s`;
      setTimeout(() => {
        el.style.opacity = "1";
        el.style.transform = "translateY(0)";
      }, 80);
    });
  }, []);

  return (
    <div className="hero-page" ref={heroRef}>

      <nav className="hero-nav">
        <span className="logo">
          Infinite<span className="logo-accent">IQ</span>
        </span>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => nav("/dashboard")}>Dashboard</button>
          <button className="nav-btn" onClick={() => nav("/agent")}>Agente</button>
        </div>
      </nav>

      <section className="hero-section">
        <div className="hero-left">
          <p className="hero-eyebrow" data-animate>
            Case study · CloudWalk / InfinitePay
          </p>

          <h1 className="hero-title" data-animate>
            Analisei as reclamações reais<br />
            dos clientes do InfinitePay<br />
            <span className="title-accent">e construí o agente pra resolver.</span>
          </h1>

          <p className="hero-desc" data-animate>
            Mais de 100 reviews do Google Play classificados por IA.
            Um agente que resolve os problemas mais frequentes automaticamente
            e mede o impacto em deflection rate real.
          </p>

          <div className="cta-row" data-animate>
            <button className="btn-primary" onClick={() => nav("/dashboard")}>
              Ver os dados
            </button>
            <button className="btn-secondary" onClick={() => nav("/agent")}>
              Testar o agente →
            </button>
          </div>
        </div>

        <div className="hero-right" data-animate>
          <p className="stats-label">Das últimas 100 avaliações analisadas</p>
          <div className="stats-grid">
            {PROBLEMS.map((p) => (
              <div key={p.label} className="stat-card">
                <span className="stat-n">{p.n}</span>
                <span className="stat-label">{p.label}</span>
              </div>
            ))}
          </div>
          <p className="stats-note">Dados reais · atualizados a cada novo scraping</p>
        </div>
      </section>

      <section className="flow-section" data-animate>
        <div className="flow-step">
          <div className="flow-icon">📊</div>
          <div>
            <p className="flow-title">Coleta</p>
            <p className="flow-desc">Reviews reais do Google Play classificados por problema e sentimento</p>
          </div>
        </div>
        <span className="flow-arrow">→</span>
        <div className="flow-step">
          <div className="flow-icon">🔍</div>
          <div>
            <p className="flow-title">Análise</p>
            <p className="flow-desc">Dashboard mostra onde está a dor e quanto pode ser automatizado</p>
          </div>
        </div>
        <span className="flow-arrow">→</span>
        <div className="flow-step">
          <div className="flow-icon">🤖</div>
          <div>
            <p className="flow-title">Resolução</p>
            <p className="flow-desc">Agente resolve os problemas encontrados e registra a deflection rate real</p>
          </div>
        </div>
      </section>

      <footer className="hero-footer">
        Construído por Wesley Ryan · Case study para CloudWalk
      </footer>
    </div>
  );
}
