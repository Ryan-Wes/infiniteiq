import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import "../css/agent.css";

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
    <div className="reasoning-box">
      <button className="reasoning-toggle" onClick={() => setOpen(o => !o)}>
        <span>🧠 Ver raciocínio do agente</span>
        <span>{open ? "▲" : "▼"}</span>
      </button>
      {open && (
        <div className="reasoning-steps">
          {reasoning.map((r, i) => (
            <div key={i} className="reasoning-step">
              <div className="step-badge">{i + 1}</div>
              <div>
                <div className="step-title">{r.step}</div>
                <div className="step-detail">{r.detail}</div>
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
    <div className={`msg-row ${isUser ? "user" : "agent"}`}>
      {!isUser && <div className="agent-avatar">IQ</div>}
      <div className="msg-content">
        <div className={`bubble ${isUser ? "user" : "agent"}`}>
          {msg.content}
        </div>
        {msg.escalate !== undefined && (
          <span className={`resolution-badge ${msg.escalate ? "badge-escalated" : "badge-resolved"}`}>
            {msg.escalate ? "⚡ Escalado para humano" : "✅ Resolvido automaticamente"}
          </span>
        )}
        {msg.reasoning && <ReasoningPanel reasoning={msg.reasoning} />}
      </div>
    </div>
  );
}

export default function Agent() {
  const [messages, setMessages] = useState([
    { role: "agent", content: "Olá! Sou o assistente de suporte InfiniteIQ. Como posso te ajudar hoje?" },
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
      setMessages(prev => [...prev, {
        role: "agent",
        content: data.response,
        escalate: data.escalate,
        reasoning: data.reasoning,
      }]);
    } catch {
      setMessages(prev => [...prev, {
        role: "agent",
        content: "Erro ao conectar com o agente. Tente novamente.",
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="agent-page">
      <nav className="dash-nav">
        <span className="logo" onClick={() => nav("/")} style={{ cursor: "pointer" }}>
          Infinite<span className="logo-accent">IQ</span>
        </span>
        <div className="nav-links">
          <button className="nav-btn" onClick={() => nav("/dashboard")}>Dashboard</button>
          <span className="nav-btn active">Agente</span>
        </div>
      </nav>

      <div className="agent-layout">
        <div className="agent-sidebar">
          <h3 className="sidebar-title">Exemplos de dúvidas</h3>
          {SUGGESTIONS.map(s => (
            <button key={s} className="suggestion-btn" onClick={() => send(s)}>
              {s}
            </button>
          ))}
          <div className="sidebar-info">
            <p className="sidebar-info-title">Como funciona</p>
            <p className="sidebar-info-text">
              O agente classifica sua dúvida, busca na base de conhecimento e responde automaticamente — ou escala para um humano quando necessário.
            </p>
          </div>
        </div>

        <div className="chat-wrap">
          <div className="chat-messages">
            {messages.map((msg, i) => <Message key={i} msg={msg} />)}
            {loading && (
              <div className="msg-row agent">
                <div className="agent-avatar">IQ</div>
                <div className="typing-bubble">
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                  <span className="typing-dot" />
                </div>
              </div>
            )}
            <div ref={bottomRef} />
          </div>

          <div className="chat-input-row">
            <input
              className="chat-input"
              placeholder="Descreva seu problema..."
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => e.key === "Enter" && send()}
              disabled={loading}
            />
            <button
              className="send-btn"
              onClick={() => send()}
              disabled={loading || !input.trim()}
            >
              Enviar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
