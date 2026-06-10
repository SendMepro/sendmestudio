"use client";

interface Props {
  draft: string;
  setDraft: (v: string) => void;
  showAI: boolean;
  onToggleAI: () => void;
}

export default function Composer({ draft, setDraft, showAI, onToggleAI }: Props) {
  const wrapperStyle: React.CSSProperties = {
    padding: "0.75rem 0 1rem",
    flexShrink: 0,
  };

  const pillStyle: React.CSSProperties = {
    display: "flex",
    gap: "0.75rem",
    alignItems: "center",
    background: "white",
    padding: "0.75rem 1.25rem",
    borderRadius: "20px",
    border: "1px solid rgba(0,0,0,0.06)",
    boxShadow: "0 2px 10px rgba(0,0,0,0.02)",
  };

  const aiBtnStyle: React.CSSProperties = {
    width: "32px",
    height: "32px",
    borderRadius: "50%",
    border: "none",
    background: showAI ? "var(--bg-champagne)" : "rgba(0,0,0,0.025)",
    cursor: "pointer",
    fontSize: "0.9rem",
    color: showAI ? "var(--accent-gold)" : "var(--text-ghost)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    transition: "all 0.3s ease",
  };

  const sendBtnStyle: React.CSSProperties = {
    background: "none",
    border: "none",
    fontSize: "1.1rem",
    cursor: "pointer",
    color: draft ? "var(--text-main)" : "var(--text-ghost)",
    flexShrink: 0,
    transition: "color 0.3s ease",
  };

  return (
    <div style={wrapperStyle}>
      <div style={pillStyle}>
        <button onClick={onToggleAI} title="Asistente IA" style={aiBtnStyle}>
          ◈
        </button>
        <input
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          style={{
            flex: 1,
            background: "transparent",
            border: "none",
            outline: "none",
            fontSize: "0.92rem",
            color: "var(--text-main)",
          }}
          placeholder="Escribe un mensaje…"
        />
        <button style={sendBtnStyle}>
          ✦
        </button>
      </div>
    </div>
  );
}
