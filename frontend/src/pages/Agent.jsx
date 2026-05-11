import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const API = import.meta.env.VITE_API_URL || "http://localhost:8000";

const SUGGESTIONS = [
  "Minha conta foi bloqueada",
  "O app fica fechando sozinho",
  "Como contestar uma cobrança indevida?",
  "Qual o limite de saque diário?",
  "Meu cliente não consegue pagar pelo link",
];

function ReasoningPanel({ reasoning }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={s.reasoningBox}>
      <button style={s.reasoningToggle} onClick={() => setOpen(o => !o)}>
        <span>🧠 Ver raciocínio do agente</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div style={s.reasoningSteps}>
          {reasoning.map((r, i) => (
            <div key={i} style={s.reasoningStep}>
              <div style={s.stepBadge}>{i + 1}</div>
              <div>
                <div style={s.stepTitle}>{r.step}</div>
                <div style={s.stepDetail}>{r.detail}</div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function Message({ msg }) {
  const isUser = msg.role === "user";
  return (
    <div style={{ ...s.msgRow, justifyContent: isUser ? "flex-end" : "flex-start" }}>
      {!isUser && <div style={s.avatar}>IQ</div>}
      <div style={{ maxWidth: "75%" }}>
        <div style={{ ...s.bubble, ...(isUser ? s.bubbleUser : s.bubbleAgent) }}>
          {msg.content}
        </div>
        {msg.escalate !== undefined && (
          <div style={{ marginTop: "0.5rem" }}>
            <span style={{ ...s.badge, ...(msg.escalate ? s.badgeEscalate : s.badgeResolved) }}>
              {msg.escalate ? "⚡ Escalado para humano" : "✅ Resolvido automaticamente"}
            </span>
          </div>
        )}
        {msg.reasoning && <ReasoningPanel reasoning={msg.reasoning} />}
      </div>
    </div>
  );
}

export default function Agent() {
  const [messages, setMessages] = useState([
    {
      role: "agent",
      content: "Olá! Sou o assistente de suporte InfiniteIQ. Como posso te ajudar hoje?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef(null);
  const nav = useNavigate();

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async (text) => {
    const msg = text || input.trim();
    if (!msg || loading) return;
    setInput("");
    setMessages(prev => [...prev, { role: "user", content: msg }]);
    setLoading(true);
    try {
      const { data } = await axios.post(`${API}/agent/chat`, { message: msg });
      setMessages(prev => [
        ...prev,
        {
          role: "agent",
          content: data.response,
          escalate: data.escalate,
          reasoning: data.reasoning,
        },
      ]);
    } catch {
      setMessages(prev => [
        ...prev,
        { role: "agent", content: "Erro ao conectar com o agente. Tente novamente." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={s.page}>
      {/* NAV */}
      <nav style={s.nav}>
        <span style={s.logo} onClick={() => nav("/")}>
          Infinite<span style={{ background: "var(--accent-gradient)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>IQ</span>
        </span>
        <div style={s.navLinks}>
          <button style={s.navBtn} onClick={() => nav("/dashboard")}>Dashboard</button>
          <span style={{ ...s.navBtn, color: "var(--accent)" }}>Agente</span>
        </div>
      </nav>

      <div style={s.layout}>
        {/* SIDEBAR */}
        <div style={s.sidebar}>
          <h3 style={s.sidebarTitle}>Exemplos de dúvidas</h3>
          {SUGGESTIONS.map(s_ => (
            <button key={s_} style={s.suggestion} onClick={() => send(s_)}>
              {s_}
            </button>
          ))}
          <div style={s.sidebarInfo}>
            <p style={s.sidebarInfoTitle}>Como funciona</p>
            <p style={s.sidebarInfoText}>O agente classifica sua dúvida, busca na base de conhecimento e responde automaticamente — ou escala para um humano quando necessário.</p>
          </div>
        </div>

        {/* CHAT */}
        <div style={s.chatWrap}>
          <div style={s.messages}>
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && (
              <div style={{ ...s.msgRow, justifyContent: "flex-start" }}>
                <div style={s.avatar}>IQ</div>
                <div style={s.typing}>
                  <span style={s.dot} />
                  <span style={{ ...s.dot, animationDelay: "0.2s" }} />
                  <span style={{ ...s.dot, animationDelay: "0.4s" }} />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          {/* INPUT */}
          <div style={s.inputRow}>
            <input
              style={s.input}
              placeholder="Descreva seu problema..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button style={s.sendBtn} onClick={() => send()} disabled={loading || !input.trim()}>
              Enviar
            </button>
          </div>
        </div>
      </div>
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
  logo: { fontSize: "1.4rem", fontWeight: 700, letterSpacing: "-0.5px", cursor: "pointer" },
  navLinks: { display: "flex", gap: "1rem", alignItems: "center" },
  navBtn: { background: "transparent", color: "var(--muted)", padding: "0.4rem 1rem", borderRadius: "6px", fontSize: "0.9rem" },
  layout: { display: "flex", flex: 1, maxWidth: 1100, margin: "0 auto", width: "100%", padding: "2rem", gap: "1.5rem", alignItems: "flex-start" },
  sidebar: { width: 220, flexShrink: 0, display: "flex", flexDirection: "column", gap: "0.5rem" },
  sidebarTitle: { fontSize: "0.8rem", fontWeight: 700, color: "var(--muted)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "0.3rem" },
  suggestion: {
    background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px",
    padding: "0.6rem 0.8rem", color: "var(--muted)", fontSize: "0.82rem", textAlign: "left",
    cursor: "pointer", lineHeight: 1.4,
  },
  sidebarInfo: { marginTop: "1rem", background: "var(--surface)", border: "1px solid var(--border)", borderRadius: "8px", padding: "1rem" },
  sidebarInfoTitle: { fontSize: "0.8rem", fontWeight: 700, marginBottom: "0.4rem", color: "var(--accent)" },
  sidebarInfoText: { fontSize: "0.8rem", color: "var(--muted)", lineHeight: 1.6 },
  chatWrap: { flex: 1, display: "flex", flexDirection: "column", minHeight: "calc(100vh - 160px)" },
  messages: { flex: 1, display: "flex", flexDirection: "column", gap: "1.2rem", overflowY: "auto", paddingBottom: "1rem" },
  msgRow: { display: "flex", gap: "0.8rem", alignItems: "flex-start" },
  avatar: {
    width: 32, height: 32, borderRadius: "50%", background: "var(--accent-gradient)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.7rem", fontWeight: 800, color: "#0a0a0a", flexShrink: 0,
  },
  bubble: { padding: "0.9rem 1.1rem", borderRadius: "12px", fontSize: "0.92rem", lineHeight: 1.6 },
  bubbleUser: { background: "var(--accent-gradient)", color: "#0a0a0a", fontWeight: 500, borderBottomRightRadius: 2 },
  bubbleAgent: { background: "var(--surface)", border: "1px solid var(--border)", borderBottomLeftRadius: 2 },
  badge: { display: "inline-block", padding: "0.25rem 0.8rem", borderRadius: "999px", fontSize: "0.78rem", fontWeight: 600 },
  badgeResolved: { background: "#39e75f22", color: "var(--pos)" },
  badgeEscalate: { background: "#ff5c7a22", color: "var(--neg)" },
  reasoningBox: { marginTop: "0.6rem", background: "var(--surface2)", border: "1px solid var(--border)", borderRadius: "8px", overflow: "hidden" },
  reasoningToggle: {
    width: "100%", display: "flex", justifyContent: "space-between", alignItems: "center",
    padding: "0.6rem 0.9rem", background: "transparent", color: "var(--muted)",
    fontSize: "0.8rem", fontWeight: 600, cursor: "pointer",
  },
  reasoningSteps: { padding: "0.5rem 0.9rem 0.9rem", display: "flex", flexDirection: "column", gap: "0.7rem" },
  reasoningStep: { display: "flex", gap: "0.7rem", alignItems: "flex-start" },
  stepBadge: {
    width: 20, height: 20, borderRadius: "50%", background: "var(--accent-gradient)",
    display: "flex", alignItems: "center", justifyContent: "center",
    fontSize: "0.65rem", fontWeight: 800, color: "#0a0a0a", flexShrink: 0, marginTop: 2,
  },
  stepTitle: { fontSize: "0.78rem", fontWeight: 700, marginBottom: "0.1rem" },
  stepDetail: { fontSize: "0.78rem", color: "var(--muted)", lineHeight: 1.5 },
  typing: {
    background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "12px", padding: "0.9rem 1.1rem",
    display: "flex", gap: "0.3rem", alignItems: "center",
  },
  dot: {
    width: 6, height: 6, borderRadius: "50%", background: "var(--muted)",
    display: "inline-block",
    animation: "pulse 1s ease-in-out infinite",
  },
  inputRow: { display: "flex", gap: "0.8rem", paddingTop: "1rem", borderTop: "1px solid var(--border)" },
  input: {
    flex: 1, background: "var(--surface)", border: "1px solid var(--border)",
    borderRadius: "8px", padding: "0.8rem 1rem", color: "var(--text)",
    fontSize: "0.92rem", outline: "none",
  },
  sendBtn: {
    background: "var(--accent-gradient)", color: "#0a0a0a",
    padding: "0.8rem 1.5rem", borderRadius: "8px", fontWeight: 700, fontSize: "0.9rem",
  },
};
