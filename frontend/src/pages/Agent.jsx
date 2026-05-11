import { useNavigate } from "react-router-dom";

export default function Agent() {
  const nav = useNavigate();
  return (
    <div style={{ minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "1rem" }}>
      <h1 style={{ fontSize: "1.8rem", fontWeight: 800 }}>Agente de Suporte</h1>
      <p style={{ color: "var(--muted)" }}>Disponível no Dia 3 🚀</p>
      <button onClick={() => nav("/")} style={{ background: "var(--accent)", color: "#fff", padding: "0.7rem 1.5rem", borderRadius: "8px", fontWeight: 600 }}>
        Voltar
      </button>
    </div>
  );
}
